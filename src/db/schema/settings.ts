import { integer, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { timestamps } from "./shared";
import { createSelectSchema } from "drizzle-zod";
import type z from "zod";

export const settingsTypeEnum = pgEnum("settings_type", [
	"string",
	"money",
	"float",
	"int",
]);

export const settingsTypeSchema = createSelectSchema(settingsTypeEnum);

export type SettingsType = z.infer<typeof settingsTypeSchema>;

export const settings = pgTable("settings", {
	key: text().primaryKey(),
	label: text().notNull(),
	value: text(),
	type: settingsTypeEnum().notNull(),
	order: integer(),
	...timestamps,
});

export const settingSchema = createSelectSchema(settings);

export type Setting = z.infer<typeof settingSchema>;
