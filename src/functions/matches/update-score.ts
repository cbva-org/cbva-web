import { db } from "@/db/connection";
import {
	matchRefTeams,
	MatchSet,
	playoffMatches,
	poolMatches,
	tournamentDivisionTeams,
	Transaction,
	UpdatePlayoffMatch,
} from "@/db/schema";
import { getFinishForRound } from "@/lib/playoffs";
import { internalServerError } from "@/lib/responses";
import { dbg } from "@/utils/dbg";
import { createServerOnlyFn } from "@tanstack/react-start";
import { eq, max } from "drizzle-orm";

export function getWinnerId(
	{ teamAId, teamBId }: { teamAId: number; teamBId: number },
	sets: MatchSet[],
) {
	const { winnerId } = sets.reduce(
		(memo, set) => {
			if (set.teamAScore > set.teamBScore) {
				memo.aWins += 1;

				if (memo.aWins > Math.floor(sets.length / 2)) {
					memo.winnerId = teamAId;
				}
			} else if (set.teamAScore < set.teamBScore) {
				memo.bWins += 1;

				if (memo.bWins > Math.floor(sets.length / 2)) {
					memo.winnerId = teamBId;
				}
			}

			return memo;
		},
		{ winnerId: null as number | null, aWins: 0, bWins: 0 },
	);

	return winnerId;
}

export const handleCompletedPoolMatchSet = createServerOnlyFn(
	async (txn: Transaction, poolMatchId: number) => {
		const match = await txn.query.poolMatches.findFirst({
			with: {
				sets: true,
			},
			where: { id: poolMatchId },
		});

		if (!match?.teamAId || !match?.teamBId) {
			throw internalServerError(
				`expected to find match in handleCompletedPoolMatchSet(${poolMatchId})`,
			);
		}

		const winnerId = getWinnerId(
			{
				teamAId: match.teamAId,
				teamBId: match.teamBId,
			},
			match.sets,
		);

		if (!winnerId) {
			return {
				success: true,
				data: {
					winnerId: undefined,
				},
			};
		}

		await txn
			.update(poolMatches)
			.set({
				winnerId,
				status: "completed",
			})
			.where(eq(poolMatches.id, poolMatchId));

		return {
			success: true,
			data: {
				winnerId,
			},
		};
	},
);

export const handleCompletedPlayoffMatchSet = createServerOnlyFn(
	async (txn: Transaction, playoffMatchId: number) => {
		const match = await txn.query.playoffMatches.findFirst({
			with: {
				sets: true,
				nextMatch: true,
			},
			where: { id: playoffMatchId },
		});

		if (!match?.teamAId || !match?.teamBId) {
			throw internalServerError(
				`expected to find match in handleCompletedPlayoffMatchSet(${playoffMatchId})`,
			);
		}

		const winnerId = getWinnerId(
			{
				teamAId: match.teamAId,
				teamBId: match.teamBId,
			},
			match.sets,
		);

		if (!winnerId) {
			return {
				success: true,
				data: {
					winnerId: undefined,
				},
			};
		}

		const matchUpdates: (Omit<UpdatePlayoffMatch, "id"> & { id: number })[] = [
			{
				id: playoffMatchId,
				winnerId,
				status: "completed",
			},
		];

		if (match.nextMatch) {
			matchUpdates.push({
				id: match.nextMatch.id,
				teamAId:
					match.nextMatch.teamAPreviousMatchId === playoffMatchId
						? winnerId
						: undefined,
				teamBId:
					match.nextMatch.teamBPreviousMatchId === playoffMatchId
						? winnerId
						: undefined,
			});
		}

		await Promise.all(
			matchUpdates.map(({ id, ...update }) =>
				txn.update(playoffMatches).set(update).where(eq(playoffMatches.id, id)),
			),
		);

		const loserId = winnerId === match.teamAId ? match.teamBId : match.teamAId;

		if (match.nextMatchId) {
			await txn
				.delete(matchRefTeams)
				.where(eq(matchRefTeams.playoffMatchId, match.nextMatchId));

			await txn.insert(matchRefTeams).values({
				teamId: loserId,
				playoffMatchId: match.nextMatchId,
			});

			await txn
				.update(tournamentDivisionTeams)
				.set({ finish: dbg(match.loserFinish) })
				.where(eq(tournamentDivisionTeams.id, loserId));
		} else {
			// This is the finals match - set finish for both teams
			// Winner gets 1st place, loser gets 2nd place
			await txn
				.update(tournamentDivisionTeams)
				.set({ finish: 1 })
				.where(eq(tournamentDivisionTeams.id, winnerId));

			await txn
				.update(tournamentDivisionTeams)
				.set({ finish: 2 })
				.where(eq(tournamentDivisionTeams.id, loserId));
		}

		return {
			success: true,
			data: {
				winnerId,
			},
		};
	},
);
