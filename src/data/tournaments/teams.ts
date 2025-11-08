import { mutationOptions } from "@tanstack/react-query"
import { notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { setResponseStatus } from "@tanstack/react-start/server"
import { eq, inArray, sql } from "drizzle-orm"
import orderBy from "lodash/orderBy"
import sum from "lodash/sum"
import z from "zod"
import { db } from "@/db/connection"
import {
  selectTournamentSchema,
  teamPlayers,
  teams,
  tournamentDivisionTeams,
} from "@/db/schema"

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

export const calculateSeedsSchema = selectTournamentSchema
  .pick({
    id: true,
  })
  .extend({
    overwrite: z.boolean(),
  })

const calculateSeedsFn = createServerFn()
  .inputValidator(calculateSeedsSchema)
  .handler(async ({ data: { id: tournamentId, overwrite } }) => {
    const tournament = await db.query.tournaments.findFirst({
      with: {
        tournamentDivisions: {
          with: {
            teams: {
              with: {
                team: {
                  with: {
                    players: {
                      with: {
                        profile: {
                          with: {
                            level: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      where: (t, { eq }) => eq(t.id, tournamentId),
    })

    if (!tournament) {
      throw notFound()
    }

    const hasSeeds = tournament.tournamentDivisions.some((division) =>
      division.teams.some((team) => team.seed !== null)
    )

    if (hasSeeds && !overwrite) {
      setResponseStatus(400)

      throw new Error(
        'Seeds are already set for this tournament. If you intended to redo the seeding, select "Overwrite existing".'
      )
    }

    // TODO: lift ordering into the database query
    const updates = tournament.tournamentDivisions.flatMap((division) => {
      const weights = division.teams.map(({ id, team: { players } }) => ({
        id,
        weight: sum(players.map(({ profile: { level } }) => level?.order ?? 0)),
        rank: sum(players.map(({ profile: { rank } }) => rank)),
      }))

      const ordered = orderBy(weights, ["weight", "rank"], ["desc", "asc"])

      return ordered.map(({ id }, idx) => ({
        id,
        seed: idx + 1,
      }))
    })

    await db.transaction(async (txn) => {
      await Promise.all(
        updates.map(({ id, seed }) =>
          txn
            .update(tournamentDivisionTeams)
            .set({ seed })
            .where(eq(tournamentDivisionTeams.id, id))
        )
      )
    })

    return {
      success: true,
    } as { success: true }
  })

export const calculateSeedsMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof calculateSeedsSchema>) =>
      calculateSeedsFn({ data }),
  })
