import { mutationOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import z from "zod"

import { requirePermissions } from "@/auth/shared"
import { db } from "@/db/connection"
import { selectTournamentSchema } from "@/db/schema"

export const createPoolsSchema = selectTournamentSchema
  .pick({
    id: true,
  })
  .extend({
    overwrite: z.boolean(),
  })

const createPoolsFn = createServerFn()
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(createPoolsSchema)
  .handler(async ({ data: { id: tournamentId, overwrite } }) => {
    console.log("createPoolsFn", {
      tournamentId,
      overwrite,
    })

    const divisions = await db.query.tournamentDivisions.findMany({
      with: {
        teams: true,
      },
      where: (t, { eq }) => eq(t.tournamentId, tournamentId),
    })

    // ...
  })

export const createPoolsMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof createPoolsSchema>) =>
      createPoolsFn({ data }),
  })
