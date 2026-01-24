import { pgTable, text } from "drizzle-orm/pg-core";
import { timestamps } from "./shared";

export const settings = pgTable("settings", {
	key: text().primaryKey(),
	value: text().notNull(),
	...timestamps,
});
