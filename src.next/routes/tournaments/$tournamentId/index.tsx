import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import clsx from "clsx";
import { CheckIcon } from "lucide-react";
import { match, P } from "ts-pattern";
import {
  DropdownMenu,
  DropdownMenuItemLink,
} from "@/components/base/dropdown-menu";
import { subtitle, title } from "@/components/base/primitives";
import { Tab, TabList, Tabs } from "@/components/base/tabs";
import { GamesPanel } from "@/components/tournaments/panels/games";
import { InformationPanel } from "@/components/tournaments/panels/information";
import { PlayoffsPanel } from "@/components/tournaments/panels/playoffs";
import { PoolsPanel } from "@/components/tournaments/panels/pools";
import { TeamsPanel } from "@/components/tournaments/panels/teams";
import { tournamentQueryOptions } from "@/data/tournaments";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/tournaments/$tournamentId/")({
  component: RouteComponent,
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    pools: number[];
    courts: string[];
  } => {
    return {
      pools: Array.isArray(search?.pools) ? search.pools : [],
      courts: Array.isArray(search?.courts) ? search.courts : [],
    };
  },
  loader: async ({ params: { tournamentId }, context: { queryClient } }) => {
    const tournament = await queryClient.ensureQueryData(
      tournamentQueryOptions(Number.parseInt(tournamentId, 10)),
    );

    if (!tournament) {
      throw new Error("not found");
    }

    const activeDivision = tournament.tournamentDivisions[0];

    throw redirect({
      to: "/tournaments/$tournamentId/$divisionId",
      params: {
        tournamentId,
        divisionId: activeDivision.id.toString(),
      },
    });
  },
});

function RouteComponent() {
  return null;
}
