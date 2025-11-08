import { mutationOptions, queryOptions } from "@tanstack/react-query"
import { notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import orderBy from "lodash/orderBy"
import sum from "lodash/sum"
import z from "zod"

import { db } from "@/db/connection"
import { findPaged } from "@/db/pagination"
import { selectTournamentSchema, tournamentDivisionTeams } from "@/db/schema"

async function readPools({
  tournamentDivisionId,
  ids,
  pagination: { page, pageSize },
}: {
  tournamentDivisionId: number
  ids?: []
  pagination: { page: number; pageSize: number }
}) {
  return await findPaged("pools", {
    paging: { page, size: pageSize },
    config: {
      with: {
        matches: {
          with: {
            sets: true,
            teamA: {
              with: {
                poolTeam: true,
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
            teamB: {
              with: {
                poolTeam: true,
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
        teams: {
          with: {
            team: {
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
      where: (t, { eq, and, inArray }) =>
        and(
          ...[
            eq(t.tournamentDivisionId, tournamentDivisionId),
            ids ? inArray(t.id, ids) : undefined,
          ].filter(Boolean)
        ),
      orderBy: (t, { asc }) => asc(t.name),
    },
  })
}

export const getPools = createServerFn({
  method: "GET",
})
  .inputValidator(
    (i) =>
      i as {
        tournamentDivisionId: number
        pagination: { page: number; pageSize: number }
      }
  )
  .handler(async ({ data }) => await readPools(data))

export const poolsQueryOptions = (
  {
    tournamentDivisionId,
    ids,
  }: {
    tournamentDivisionId: number
    ids?: number[]
  },
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 50 }
) =>
  queryOptions({
    queryKey: ["pools", tournamentDivisionId, ids ? ids.join() : null].filter(
      Boolean
    ),
    queryFn: () =>
      getPools({
        data: {
          tournamentDivisionId,
          ids,
          pagination,
        },
      }),
  })

export const generatePoolsSchema = selectTournamentSchema
  .pick({
    id: true,
  })
  .extend({
    overwrite: z.boolean(),
  })

const generatePoolsFn = createServerFn()
  .inputValidator(generatePoolsSchema)
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
    }
  })

export const generatePoolsMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof generatePoolsSchema>) =>
      generatePoolsFn({ data }),
  })
