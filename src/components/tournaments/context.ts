import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { tournamentQueryOptions } from "@/data/tournaments";
import { teamsQueryOptions } from "@/data/teams";

export function useTournament() {
	const { tournamentId } = useParams({
		from: "/tournaments/$tournamentId/$divisionId/{-$tab}",
	});

	const { data: tournament } = useSuspenseQuery(
		tournamentQueryOptions(Number.parseInt(tournamentId, 10)),
	);

	return tournament;
}

export function useTournamentDivision() {
	const { divisionId } = useParams({
		from: "/tournaments/$tournamentId/$divisionId/{-$tab}",
	});

	const tournament = useTournament();

	return (
		tournament?.tournamentDivisions.find(
			({ id }) => id.toString() === divisionId,
		) ?? tournament?.tournamentDivisions[0]
	);
}

export function useIsDemoTournament() {
	const tournament = useTournament();

	return tournament?.demo;
}

export function useTeamsAtCapacity() {
	const { divisionId } = useParams({
		from: "/tournaments/$tournamentId/$divisionId/{-$tab}",
	});

	const division = useTournamentDivision();

	const { data: atCapacity } = useSuspenseQuery({
		...teamsQueryOptions({
			tournamentDivisionId: Number.parseInt(divisionId, 10),
		}),
		select: (data) => data.length === division?.capacity,
	});

	return atCapacity;
}

// const { data: hasPools } = useQuery({
// 	...poolsQueryOptions({
// 		tournamentDivisionId: activeDivision.id,
// 	}),
// 	select: (data) => data.length > 0,
// });
//
// const { data: hasGames } = useQuery({
// 	...poolsQueryOptions({
// 		tournamentDivisionId: activeDivision.id,
// 	}),
// 	select: (data) => data.some((pool) => pool.matches.length > 0),
// });
//
// const { data: hasPlayoffs } = useQuery({
// 	...playoffsQueryOptions({
// 		tournamentDivisionId: activeDivision.id,
// 	}),
// 	select: (data) => data.length > 0,
// });
