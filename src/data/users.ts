import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq, or, sql } from "drizzle-orm";
import z from "zod";
import { authMiddleware, requireRole } from "@/auth/shared";
import { db } from "@/db/connection";
import { selectUserSchema, updateUserSchema, users } from "@/db/schema";
import { forbidden } from "@/lib/responses";

export const searchUsersSchema = z.object({
	name: z.string().optional(),
	email: z.string().optional(),
	phone: z.string().optional(),
});

export const getUsersFn = createServerFn()
	.middleware([requireRole(["admin"])])
	.inputValidator(searchUsersSchema)
	.handler(async ({ data: { name, email, phone } }) => {
		return await db.query.users.findMany({
			where: {
				name: name ? { ilike: `%${name}%` } : undefined,
				email: email ? { ilike: `%${email}%` } : undefined,
				phoneNumber: phone ? { ilike: `%${phone}%` } : undefined,
			},
			limit: 10,
			orderBy: (t, { asc }) => asc(t.name),
		});
	});

export const usersQueryOptions = ({
	name,
	email,
	phone,
}: z.infer<typeof searchUsersSchema>) =>
	queryOptions({
		queryKey: ["users", { name, email, phone }],
		queryFn: async () => {
			const hasSearch =
				(name && name.length >= 2) ||
				(email && email.length >= 2) ||
				(phone && phone.length >= 2);

			if (!hasSearch) {
				return { users: [] };
			}

			const data = await getUsersFn({ data: { name, email, phone } });

			return { users: data };
		},
	});

export const updateUserFnSchema = updateUserSchema
	.pick({
		name: true,
		email: true,
		phoneNumber: true,
	})
	.extend({
		id: z.string(),
	});

export const updateUserFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator(updateUserFnSchema)
	.handler(
		async ({ data: { id, name, email, phoneNumber }, context: { viewer } }) => {
			const isAdmin = viewer?.role === "admin";
			const isViewer = viewer?.id === id;

			if (!isAdmin && !isViewer) {
				throw forbidden();
			}

			const values = {
				name: isAdmin ? name : undefined,
				email: isAdmin ? email : undefined,
				phoneNumber,
			};

			await db
				.update(users)
				.set({
					...values,
					emailVerified: values.email
						? sql`CASE WHEN ${users.email} != ${values.email} THEN false ELSE ${users.emailVerified} END`
						: undefined,
					phoneNumberVerified: values.phoneNumber
						? sql`CASE WHEN ${users.phoneNumber} != ${values.phoneNumber} THEN false ELSE ${users.phoneNumberVerified} END`
						: undefined,
				})
				.where(eq(users.id, id));

			return {
				success: true,
			};
		},
	);

export const updateUserMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof updateUserFnSchema>) => {
			return updateUserFn({ data });
		},
	});

export const adminUpdateUserSchema = selectUserSchema
	.pick({
		role: true,
	})
	.extend({
		id: z.string(),
	});

export const adminUpdateUserFn = createServerFn({ method: "POST" })
	.middleware([requireRole(["admin"])])
	.inputValidator(adminUpdateUserSchema)
	.handler(async ({ data: { id, role } }) => {
		await db
			.update(users)
			.set({
				role,
			})
			.where(eq(users.id, id));

		return {
			success: true,
		};
	});

export const adminUpdateUserMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof adminUpdateUserSchema>) => {
			return adminUpdateUserFn({ data });
		},
	});

export const adminVerifyEmailSchema = z.object({
	id: z.string(),
});

export const adminVerifyEmailFn = createServerFn({ method: "POST" })
	.middleware([requireRole(["admin"])])
	.inputValidator(adminVerifyEmailSchema)
	.handler(async ({ data: { id } }) => {
		await db
			.update(users)
			.set({
				emailVerified: true,
			})
			.where(eq(users.id, id));

		return { success: true };
	});

export const adminVerifyEmailMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof adminVerifyEmailSchema>) => {
			return adminVerifyEmailFn({ data });
		},
	});

export const adminVerifyPhoneSchema = z.object({
	id: z.string(),
});

export const adminVerifyPhoneFn = createServerFn({ method: "POST" })
	.middleware([requireRole(["admin"])])
	.inputValidator(adminVerifyPhoneSchema)
	.handler(async ({ data: { id } }) => {
		await db
			.update(users)
			.set({
				phoneNumberVerified: true,
			})
			.where(eq(users.id, id));

		return { success: true };
	});

export const adminVerifyPhoneMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof adminVerifyPhoneSchema>) => {
			return adminVerifyPhoneFn({ data });
		},
	});
