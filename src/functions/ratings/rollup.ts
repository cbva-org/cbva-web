import { db } from "@/db/connection";
import {
	playerProfiles,
	teamPlayers,
	tournamentDivisions,
	tournamentDivisionTeams,
	tournaments,
} from "@/db/schema";
import type { Gender } from "@/db/schema/shared";
import { and, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";

/**
 * Run all rollup operations for both genders.
 */
export async function runAllRollups() {
	for (const gender of ["male", "female"] as const) {
		await rollupRatings(gender);
		await rollupRatedPoints(gender);
		await rollupJuniorsPoints(gender);
		await updateRanks(gender);
	}
}

/**
 * Ratings decay rules:
 * - An earned rating lasts the rest of that season and through the following season
 * - If not earned again, it drops one tier every January 1st
 * - Example: earning AA in 2024 lasts through all of 2025, dropping to A in 2026, B in 2027, Unrated after
 *
 * Level order (from levels table): unrated=0, b=1, a=2, aa=3, aaa=4
 * Higher order = better rating
 */
export async function rollupRatings(
	gender: Gender,
	currentYear: number = new Date().getFullYear(),
) {
	const startTime = performance.now();
	console.log(`Rolling up ratings for ${gender}...`);

	// Get all levels ordered by their order field
	const allLevels = await db.query.levels.findMany({
		orderBy: {
			order: "desc",
		},
	});

	// Create a map from level id to order and vice versa
	const levelOrderMap = new Map(allLevels.map((l) => [l.id, l.order]));
	const orderToLevelId = new Map(allLevels.map((l) => [l.order, l.id]));

	// Find the "unrated" level (lowest order, typically 1)
	const unratedLevel = allLevels.find((l) => l.name === "unrated");
	const unratedLevelId = unratedLevel?.id;

	const fiveYearsAgo = new Date();
	fiveYearsAgo.setFullYear(currentYear - 5);

	// Fetch ALL participations for ALL players of this gender in a single query
	// Only include completed tournament divisions
	const allParticipations = await db
		.select({
			playerProfileId: teamPlayers.playerProfileId,
			levelEarnedId: tournamentDivisionTeams.levelEarnedId,
			tournamentDate: tournaments.date,
		})
		.from(teamPlayers)
		.innerJoin(
			playerProfiles,
			eq(playerProfiles.id, teamPlayers.playerProfileId),
		)
		.innerJoin(
			tournamentDivisionTeams,
			eq(tournamentDivisionTeams.teamId, teamPlayers.teamId),
		)
		.innerJoin(
			tournamentDivisions,
			eq(tournamentDivisionTeams.tournamentDivisionId, tournamentDivisions.id),
		)
		.innerJoin(
			tournaments,
			eq(tournamentDivisions.tournamentId, tournaments.id),
		)
		.where(
			and(
				eq(playerProfiles.gender, gender),
				isNotNull(tournamentDivisionTeams.levelEarnedId),
				eq(tournamentDivisions.status, "complete"),
				eq(tournaments.demo, false),
				inArray(tournamentDivisionTeams.status, ["confirmed"]),
				gte(tournaments.date, fiveYearsAgo.toISOString().split("T")[0]),
			),
		);

	// Group participations by player
	const participationsByPlayer = new Map<
		number,
		{ levelEarnedId: number | null; tournamentDate: string }[]
	>();

	for (const p of allParticipations) {
		const existing = participationsByPlayer.get(p.playerProfileId) ?? [];
		existing.push({
			levelEarnedId: p.levelEarnedId,
			tournamentDate: p.tournamentDate,
		});
		participationsByPlayer.set(p.playerProfileId, existing);
	}

	// Calculate best decayed rating for each player
	const playerNewLevels = new Map<number, number | undefined>();

	for (const [playerId, participations] of participationsByPlayer) {
		let bestCurrentOrder = 0;

		for (const participation of participations) {
			if (!participation.levelEarnedId) continue;

			const earnedOrder = levelOrderMap.get(participation.levelEarnedId);
			if (earnedOrder === undefined) continue;

			const tournamentYear = new Date(
				participation.tournamentDate,
			).getFullYear();
			const decayedOrder = calculateDecayedOrder(
				earnedOrder,
				tournamentYear,
				currentYear,
			);

			if (decayedOrder > bestCurrentOrder) {
				bestCurrentOrder = decayedOrder;
			}
		}

		const newLevelId = orderToLevelId.get(bestCurrentOrder) ?? unratedLevelId;
		playerNewLevels.set(playerId, newLevelId);
	}

	// Batch update all players using a single SQL statement with CASE
	if (playerNewLevels.size > 0) {
		const playerIds = Array.from(playerNewLevels.keys());

		// Build CASE expression for the update
		const caseFragments = Array.from(playerNewLevels.entries()).map(
			([playerId, levelId]) =>
				sql`WHEN ${playerId} THEN ${levelId ?? null}::integer`,
		);

		await db.execute(sql`
			UPDATE player_profiles
			SET level_id = CASE id
				${sql.join(caseFragments, sql` `)}
			END
			WHERE id IN (${sql.join(playerIds, sql`, `)})
		`);
	}

	// Set unrated for players who have participated but have no rating from last 5 years
	// Novice (null) = never participated in any completed tournament
	// Unrated = has participated but no recent rating or fully decayed
	await db.execute(sql`
		UPDATE player_profiles pp
		SET level_id = ${unratedLevelId ?? null}::integer
		FROM (
			SELECT pp2.id
			FROM player_profiles pp2
			-- Must have at least one completed tournament participation (lifetime)
			WHERE pp2.gender = ${gender}
			AND EXISTS (
				SELECT 1 FROM team_players tp2
				INNER JOIN tournament_division_teams tdt2 ON tdt2.team_id = tp2.team_id
					AND tdt2.status = 'confirmed'
				INNER JOIN tournament_divisions td2 ON td2.id = tdt2.tournament_division_id
					AND td2.status = 'complete'
				INNER JOIN tournaments t2 ON t2.id = td2.tournament_id
					AND t2.demo = false
				WHERE tp2.player_profile_id = pp2.id
			)
			-- But no level earned in last 5 years
			AND NOT EXISTS (
				SELECT 1 FROM team_players tp3
				INNER JOIN tournament_division_teams tdt3 ON tdt3.team_id = tp3.team_id
					AND tdt3.level_earned_id IS NOT NULL
					AND tdt3.status = 'confirmed'
				INNER JOIN tournament_divisions td3 ON td3.id = tdt3.tournament_division_id
					AND td3.status = 'complete'
				INNER JOIN tournaments t3 ON t3.id = td3.tournament_id
					AND t3.date >= ${fiveYearsAgo.toISOString().split("T")[0]}
					AND t3.demo = false
				WHERE tp3.player_profile_id = pp2.id
			)
		) inactive
		WHERE pp.id = inactive.id
	`);

	// Set null (Novice) for players who have NEVER participated in any completed tournament
	await db.execute(sql`
		UPDATE player_profiles pp
		SET level_id = NULL
		WHERE pp.gender = ${gender}
		AND pp.level_id IS NOT NULL
		AND NOT EXISTS (
			SELECT 1 FROM team_players tp
			INNER JOIN tournament_division_teams tdt ON tdt.team_id = tp.team_id
				AND tdt.status = 'confirmed'
			INNER JOIN tournament_divisions td ON td.id = tdt.tournament_division_id
				AND td.status = 'complete'
			INNER JOIN tournaments t ON t.id = td.tournament_id
				AND t.demo = false
			WHERE tp.player_profile_id = pp.id
		)
	`);


	console.log(
		`Finished rolling up ratings for ${gender} in ${(performance.now() - startTime).toFixed(0)}ms`,
	);
}

/**
 * Rollup rated points:
 * - Sum all pointsEarned from the last 365 days
 * - Only count tournaments in rated divisions (Open, AAA, AA, A, B, Unrated)
 * - Points last 365 days and are cumulative
 */
export async function rollupRatedPoints(
	gender: Gender,
	asOfDate: Date = new Date(),
) {
	const startTime = performance.now();
	console.log(`Rolling up rated points for ${gender}...`);

	const oneYearAgo = new Date(asOfDate);
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

	// Get rated divisions (those without maxAge - not juniors)
	const ratedDivisions = await db.query.divisions.findMany({
		where: {
			maxAge: {
				isNull: true,
			},
		},
	});
	const ratedDivisionIds = ratedDivisions.map((d) => d.id);

	if (ratedDivisionIds.length === 0) {
		console.log("No rated divisions found, skipping rated points rollup");
		return;
	}

	// Pre-aggregate points in a CTE, then join to update (faster than correlated subquery)
	await db.execute(sql`
		WITH aggregated_points AS (
			SELECT
				tp.player_profile_id,
				SUM(tdt.points_earned) as total_points
			FROM team_players tp
			INNER JOIN tournament_division_teams tdt ON tdt.team_id = tp.team_id
			INNER JOIN tournament_divisions td ON td.id = tdt.tournament_division_id
			INNER JOIN tournaments t ON t.id = td.tournament_id
			WHERE tdt.status = 'confirmed'
			AND td.status = 'complete'
			AND t.demo = false
			AND tdt.points_earned IS NOT NULL
			AND t.date >= ${oneYearAgo.toISOString().split("T")[0]}
			AND td.division_id IN (${sql.join(ratedDivisionIds, sql`, `)})
			GROUP BY tp.player_profile_id
		)
		UPDATE player_profiles pp
		SET rated_points = COALESCE(ap.total_points, 0)
		FROM (
			SELECT pp2.id, ap.total_points
			FROM player_profiles pp2
			LEFT JOIN aggregated_points ap ON ap.player_profile_id = pp2.id
			WHERE pp2.gender = ${gender}
		) ap
		WHERE pp.id = ap.id
	`);

	console.log(
		`Finished rolling up rated points for ${gender} in ${(performance.now() - startTime).toFixed(0)}ms`,
	);
}

/**
 * Rollup juniors points:
 * - Sum all pointsEarned from the last 365 days
 * - Only count tournaments in juniors divisions (U12, U14, U16, U18 - those with maxAge)
 */
export async function rollupJuniorsPoints(
	gender: Gender,
	asOfDate: Date = new Date(),
) {
	const startTime = performance.now();
	console.log(`Rolling up juniors points for ${gender}...`);

	const oneYearAgo = new Date(asOfDate);
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

	// Get juniors divisions (those with maxAge set)
	const juniorsDivisions = await db.query.divisions.findMany({
		where: {
			maxAge: {
				isNotNull: true,
			},
		},
	});

	const juniorsDivisionIds = juniorsDivisions.map((d) => d.id);

	if (juniorsDivisionIds.length === 0) {
		console.log("No juniors divisions found, skipping juniors points rollup");
		return;
	}

	// Pre-aggregate points in a CTE, then join to update (faster than correlated subquery)
	await db.execute(sql`
		WITH aggregated_points AS (
			SELECT
				tp.player_profile_id,
				SUM(tdt.points_earned) as total_points
			FROM team_players tp
			INNER JOIN tournament_division_teams tdt ON tdt.team_id = tp.team_id
			INNER JOIN tournament_divisions td ON td.id = tdt.tournament_division_id
			INNER JOIN tournaments t ON t.id = td.tournament_id
			WHERE tdt.status = 'confirmed'
			AND td.status = 'complete'
			AND t.demo = false
			AND tdt.points_earned IS NOT NULL
			AND t.date >= ${oneYearAgo.toISOString().split("T")[0]}
			AND td.division_id IN (${sql.join(juniorsDivisionIds, sql`, `)})
			GROUP BY tp.player_profile_id
		)
		UPDATE player_profiles pp
		SET juniors_points = COALESCE(ap.total_points, 0)
		FROM (
			SELECT pp2.id, ap.total_points
			FROM player_profiles pp2
			LEFT JOIN aggregated_points ap ON ap.player_profile_id = pp2.id
			WHERE pp2.gender = ${gender}
		) ap
		WHERE pp.id = ap.id
	`);

	console.log(
		`Finished rolling up juniors points for ${gender} in ${(performance.now() - startTime).toFixed(0)}ms`,
	);
}

/**
 * Update ranks:
 * - Rank players by rating (level order desc), then by rated_points desc
 * - Only rank players who have participated in tournaments or have points
 */
export async function updateRanks(gender: Gender) {
	const startTime = performance.now();
	console.log(`Updating ranks for ${gender}...`);

	// Use a window function to calculate ranks
	// Order by level order (higher is better) then by rated_points (higher is better)
	await db.execute(sql`
		WITH ranked AS (
			SELECT
				pp.id,
				ROW_NUMBER() OVER (
					ORDER BY
						COALESCE(l.order, 0) DESC,
						pp.rated_points DESC,
						pp.created_at ASC
				) as new_rank
			FROM player_profiles pp
			LEFT JOIN levels l ON l.id = pp.level_id
			WHERE pp.gender = ${gender}
			AND (pp.rated_points > 0 OR pp.juniors_points > 0 OR pp.level_id IS NOT NULL)
		)
		UPDATE player_profiles pp
		SET rank = ranked.new_rank
		FROM ranked
		WHERE pp.id = ranked.id
	`);

	// Clamp ranks: players with very high ranks get clamped to worst_active_rank + 500
	// This prevents inactive players from having arbitrarily high rank numbers
	const unratedLevel = await db.query.levels.findFirst({
		where: { name: "unrated" },
	});

	if (unratedLevel) {
		await db.execute(sql`
			WITH worst_active_rank AS (
				SELECT MAX(pp.rank) as max_rank
				FROM player_profiles pp
				WHERE pp.gender = ${gender}
				AND pp.level_id = ${unratedLevel.id}
				AND pp.rated_points > 0
			)
			UPDATE player_profiles pp
			SET rank = (SELECT max_rank + 500 FROM worst_active_rank)
			FROM worst_active_rank
			WHERE pp.gender = ${gender}
			AND pp.rank > (SELECT max_rank + 500 FROM worst_active_rank)
			AND worst_active_rank.max_rank IS NOT NULL
		`);
	}

	// Set rank to NULL for players with no activity
	await db.execute(sql`
		UPDATE player_profiles
		SET rank = NULL
		WHERE gender = ${gender}
		AND rated_points = 0
		AND juniors_points = 0
		AND level_id IS NULL
	`);

	console.log(
		`Finished updating ranks for ${gender} in ${(performance.now() - startTime).toFixed(0)}ms`,
	);
}

/**
 * Calculate the decayed rating order for a given earned rating and tournament year.
 * Exported for unit testing.
 */
export function calculateDecayedOrder(
	earnedOrder: number,
	tournamentYear: number,
	currentYear: number,
): number {
	// Decay starts after 1 full year (the rest of that season + following season)
	const yearsOfDecay = Math.max(0, currentYear - tournamentYear - 1);
	// Each year of decay drops the rating by 1 order, minimum of 0 (unrated)
	return Math.max(0, earnedOrder - yearsOfDecay);
}
