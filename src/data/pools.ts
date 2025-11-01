import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { db, findPaged } from "@/db";

async function readPools({
  tournamentDivisionId,
  ids,
  pagination: { page, pageSize },
}: {
  tournamentDivisionId: number;
  ids?: [];
  pagination: { page: number; pageSize: number };
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
          ].filter(Boolean),
        ),
      orderBy: (t, { asc }) => asc(t.name),
    },
  });
}

export const getPools = createServerFn({
  method: "GET",
})
  .inputValidator(
    (i) =>
      i as {
        tournamentDivisionId: number;
        pagination: { page: number; pageSize: number };
      },
  )
  .handler(async ({ data }) => await readPools(data));

export function usePools(
  {
    tournamentDivisionId,
    ids,
  }: { tournamentDivisionId: number; ids?: number[] },
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 50 },
  options: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof readPools>>, unknown>,
    "queryFn" | "queryKey"
  > = {},
) {
  const fetchPools = useServerFn(getPools);

  return useQuery({
    ...options,
    queryKey: ["pools", tournamentDivisionId, ids ? ids.join() : null].filter(
      Boolean,
    ),
    queryFn: () =>
      fetchPools({
        data: {
          tournamentDivisionId,
          ids,
          pagination,
        },
      }),
  });
}
