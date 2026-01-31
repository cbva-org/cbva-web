import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq, or, sql } from "drizzle-orm";
import z from "zod";
import { authMiddleware, requireRole } from "@/auth/shared";
import { db } from "@/db/connection";
import { selectUserSchema, updateUserSchema, users } from "@/db/schema";
import { forbidden } from "@/lib/responses";

export const searchUsersSchema = z.object({
	query: z.string(),
	searchType: z.enum(["name", "email", "phone"]),
});

export const getUsersFn = createServerFn()
	.middleware([requireRole(["admin"])])
	.inputValidator(searchUsersSchema)
	.handler(async ({ data: { query, searchType } }) => {
		return await db._query.users.findMany({
			where: (t, { ilike, eq }) => {
				switch (searchType) {
					case "name":
						return ilike(t.name, `%${query}%`);
					case "email":
						return ilike(t.email, `%${query}%`);
					case "phone":
						return ilike(t.phoneNumber, `%${query}%`);
				}
			},
			limit: 10,
			orderBy: (t, { asc }) => asc(t.name),
		});
	});

export const usersQueryOptions = ({
	query,
	searchType,
}: z.infer<typeof searchUsersSchema>) =>
	queryOptions({
		queryKey: ["users", searchType, query],
		queryFn: async () => {
			if (query.length < 3) {
				return { users: [] };
			}

			const data = await getUsersFn({ data: { query, searchType } });

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
