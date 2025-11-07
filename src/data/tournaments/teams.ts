import { mutationOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { eq, inArray, sql } from "drizzle-orm"
import z from "zod"

import { db } from "@/db/connection"
import { teamPlayers, teams, tournamentDivisionTeams } from "@/db/schema"

const addTeamSchema = z.object({
  tournamentDivisionId: z.number(),
  players: z.array(z.number()),
})

type AddTeamParams = z.infer<typeof addTeamSchema>

export const addTeamFn = createServerFn({ method: "POST" })
  .inputValidator(addTeamSchema)
  .handler(async ({ data: { tournamentDivisionId, players } }) => {
    // Find teams in the tournament division that have all the specified players
    const existingTeam = await db
      .select({
        teamId: teams.id,
        playerCount: sql<number>`count(distinct ${teamPlayers.playerProfileId})`,
      })
      .from(teams)
      .innerJoin(teamPlayers, eq(teams.id, teamPlayers.teamId))
      .where(inArray(teamPlayers.playerProfileId, players))
      .groupBy(teams.id)
      .having(
        sql`count(distinct ${teamPlayers.playerProfileId}) = ${players.length}`
      )
      .limit(1)

    let teamId = existingTeam.at(0)?.teamId

    console.log({ teamId })

    if (!teamId) {
      const [newTeam] = await db
        .insert(teams)
        .values({
          name: null,
        })
        .returning({
          id: teams.id,
        })

      teamId = newTeam.id

      await db.insert(teamPlayers).values(
        players.map((profileId) => ({
          teamId: newTeam.id,
          playerProfileId: profileId,
        }))
      )
    }

    if (!teamId) {
      throw new Error("INTERNAL_SERVER_ERROR")
    }

    const newTournamentDivisionTeam = await db
      .insert(tournamentDivisionTeams)
      .values({
        tournamentDivisionId,
        teamId,
      })
      .returning({
        id: tournamentDivisionTeams.id,
      })

    return {
      data: newTournamentDivisionTeam,
    }
  })

export const addTeamOptions = () =>
  mutationOptions({
    mutationFn: async (data: AddTeamParams) => {
      return addTeamFn({ data })
    },
  })
