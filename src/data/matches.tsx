import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { db, eq, poolMatches } from "@/db";

export const getPoolMatch = createServerFn({
  method: "GET",
})
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data: { id } }) => {
    return await db.query.poolMatches.findFirst({
      where: eq(poolMatches.id, id),
      with: {
        sets: true,
        teamA: {
          with: {
            team: {
              with: {
                players: {
                  with: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
        teamB: {
          with: {
            team: {
              with: {
                players: {
                  with: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  });

export const poolMatchQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["pool_match", id],
    queryFn: () => getPoolMatch({ data: { id } }),
  });

export const getPoolMatchSet = createServerFn({
  method: "GET",
})
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data: { id } }) => {
    return await db.query.matchSets.findFirst({
      where: eq(poolMatches.id, id),
      with: {
        poolMatch: {
          with: {
            teamA: {
              with: {
                team: {
                  with: {
                    players: {
                      with: {
                        profile: true,
                      },
                    },
                  },
                },
              },
            },
            teamB: {
              with: {
                team: {
                  with: {
                    players: {
                      with: {
                        profile: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  });

export const poolMatchSetQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["pool_match_set", id],
    queryFn: () => getPoolMatchSet({ data: { id } }),
  });
