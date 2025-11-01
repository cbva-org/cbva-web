import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { relationships, tables } from "./schema"

const client = postgres(process.env.DATABASE_URL!)

export const db = drizzle({
  client,
  casing: "snake_case",
  schema: {
    ...tables,
    ...relationships,
  },
})
