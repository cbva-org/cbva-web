import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { tournamentQueryOptions } from "@/data/tournaments";

export function useTournament() {
	const { tournamentId } = useParams({
		from: "/tournaments/$tournamentId/$divisionId/{-$tab}",
	});

	const { data: tournament } = useSuspenseQuery(
		tournamentQueryOptions(Number.parseInt(tournamentId, 10)),
	);

	return tournament;
}

export function useIsDemoTournament() {
	const tournament = useTournament();

	return tournament?.demo;
}
