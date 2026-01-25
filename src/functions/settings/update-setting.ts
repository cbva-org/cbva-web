import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { settings, settingSchema } from "@/db/schema/settings";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import type z from "zod";

export const updateSettingSchema = settingSchema.pick({
	key: true,
	value: true,
});

export const updateSettingFn = createServerFn()
	.inputValidator(updateSettingSchema)
	.middleware([requirePermissions({ settings: ["update"] })])
	.handler(async ({ data: { key, value } }) => {
		await db
			.update(settings)
			.set({
				value,
			})
			.where(eq(settings.key, key));

		return {
			success: true,
		};
	});

export const updateSettingMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof updateSettingSchema>) =>
			updateSettingFn({ data }),
	});
