import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { findPaged } from "@/db/pagination"

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
      orderBy: (t, { asc }) => [asc(t.finish), asc(t.seed)],
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

export const teamsQueryOptions = (
  tournamentDivisionId: number,
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 50 }
) =>
  queryOptions({
    queryKey: ["teams", tournamentDivisionId],
    queryFn: () =>
      getTeams({
        data: {
          tournamentDivisionId,
          pagination,
        },
      }),
  })
