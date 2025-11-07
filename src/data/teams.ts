import {
  queryOptions,
  type UseQueryOptions,
  useQuery,
} from "@tanstack/react-query"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import { findPaged } from "@/db"

async function readTeams({
  tournamentDivisionId,
  pagination: { page, pageSize },
}: {
  tournamentDivisionId: number
  pagination: { page: number; pageSize: number }
}) {
  return await findPaged("tournamentDivisionTeams", {
    paging: { page, size: pageSize },
    config: {
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
        poolTeam: {
          with: {
            pool: true,
          },
        },
      },
      where: (teams, { eq, and, or }) =>
        and(
          eq(teams.tournamentDivisionId, tournamentDivisionId),
          or(eq(teams.status, "confirmed"), eq(teams.status, "registered"))
        ),
      orderBy: (teams, { asc }) => asc(teams.finish),
    },
  })
}

export const getTeams = createServerFn({
  method: "GET",
})
  .inputValidator(
    (i) =>
      i as {
        tournamentDivisionId: number
        pagination: { page: number; pageSize: number }
      }
  )
  .handler(async ({ data }) => await readTeams(data))

export const teamsQueryOptions = <Out = Awaited<ReturnType<typeof getTeams>>>(
  tournamentDivisionId: number,
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 50 },
  options: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getTeams>>, unknown, Out>,
    "queryFn" | "queryKey"
  > = {}
) =>
  queryOptions({
    ...options,
    queryKey: ["teams", tournamentDivisionId],
    queryFn: () =>
      getTeams({
        data: {
          tournamentDivisionId,
          pagination,
        },
      }),
  })

export function useTeams(
  tournamentDivisionId: number,
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 50 },
  options: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof readTeams>>, unknown>,
    "queryFn" | "queryKey"
  > = {}
) {
  const fetchTeams = useServerFn(getTeams)

  return useQuery({
    ...options,
    queryKey: ["teams", tournamentDivisionId],
    queryFn: () =>
      fetchTeams({
        data: {
          tournamentDivisionId,
          pagination,
        },
      }),
  })
}
