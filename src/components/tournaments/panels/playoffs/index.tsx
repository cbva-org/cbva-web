import { TabPanel } from "@/components/base/tabs";
import { usePlayoffs } from "@/data/playoffs";
import type { Tournament, TournamentDivision } from "@/db";
import { Bracket } from "./bracket";

export function PlayoffsPanel({
  tournamentDivisionId,
}: Pick<Tournament, "id"> & {
  tournamentDivisionId: TournamentDivision["id"];
}) {
  const { data } = usePlayoffs({ tournamentDivisionId });

  return (
    <TabPanel id="playoffs">
      <Bracket matches={data || []} />
    </TabPanel>
  );
}
