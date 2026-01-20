import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { createFaqSchema, faqs } from "@/db/schema";
import type { LexicalState } from "@/db/schema/shared";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq, isNull, max, sql } from "drizzle-orm";
import type z from "zod";

export const createFaqFn = createServerFn()
	.inputValidator(createFaqSchema)
	.middleware([requirePermissions({ faqs: ["create"] })])
	.handler(async ({ data: { question, answer, key } }) => {
		const orderQ = db
			.select({ order: max(faqs.order) })
			.from(faqs)
			.where(key ? eq(faqs.key, key) : isNull(faqs.key));

		await db.insert(faqs).values({
			key,
			question,
			answer: answer as LexicalState,
			order: sql`COALESCE((${orderQ}), -1) + 1`,
		});

		return {
			success: true,
		};
	});

export const createFaqMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof createFaqSchema>) =>
			createFaqFn({ data }),
	});
