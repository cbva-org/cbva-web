import { mutationOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import z from "zod"

import { db } from "@/db/connection"
import { selectTournamentSchema } from "@/db/schema"

const addTeamSchema = z.object({
  tournamentDivisionId: z.number(),
  players: z.array(z.number()),
})

type AddTeamParams = z.infer<typeof addTeamSchema>

export const addTeamFn = createServerFn({ method: "POST" })
  .inputValidator(addTeamSchema)
  .handler(async ({ data: { tournamentDivisionId, players } }) => {
    // TODO: drizzle query to find a team with all players in the team
  })

export const addTeamOptions = () =>
  mutationOptions({
    mutationFn: async (data: AddTeamParams) => {
      return addTeamFn({ data })
    },
  })
