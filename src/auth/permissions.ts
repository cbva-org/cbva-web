import {
  type AccessControl,
  createAccessControl,
  type Statements,
} from "better-auth/plugins/access"

export const statement = {
  tournament: ["create", "update", "delete"], // <-- Permissions available for created roles
} as const

export const ac = createAccessControl(statement)

export type Permissions = any

export const admin = ac.newRole({
  tournament: ["create", "update", "delete"],
})

export const td = ac.newRole({
  tournament: ["create", "update"],
})

export const user = ac.newRole({
  tournament: [],
})
