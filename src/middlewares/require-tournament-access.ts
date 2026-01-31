import { createServerOnlyFn } from "@tanstack/react-start";
import { and, eq, exists } from "drizzle-orm";
import { requirePermissions, type SessionViewer } from "@/auth/shared";
import { db } from "@/db/connection";
import { directors, playerProfiles, tournamentDirectors } from "@/db/schema";
import { forbidden } from "@/lib/responses";

/**
 * Middleware that requires tournament update permissions.
 * Use with `assertTournamentDirector` in your handler to verify
 * the user is a director for the specific tournament.
 *
 * @example
 * ```typescript
 * export const updateTournamentFn = createServerFn()
 *   .middleware([requireTournamentUpdate])
 *   .inputValidator(schema)
 *   .handler(async ({ context, data }) => {
 *     await assertTournamentDirector(context.viewer, data.tournamentId);
 *     // User is guaranteed to be an admin or a director for this tournament
 *   })
 * ```
 */
export const requireTournamentUpdate = requirePermissions({
	tournament: ["update"],
});

/**
 * Asserts that the viewer is either an admin or a director for the specified tournament.
 * Throws a 403 Forbidden error if the user doesn't have access.
 *
 * @param viewer - The authenticated user from context
 * @param tournamentId - The tournament ID to check access for
 *
 * @example
 * ```typescript
 * export const updateTournamentFn = createServerFn()
 *   .middleware([requireTournamentUpdate])
 *   .inputValidator(schema)
 *   .handler(async ({ context, data }) => {
 *     await assertTournamentDirector(context.viewer, data.tournamentId);
 *     // Proceed with tournament update
 *   })
 * ```
 */
export const assertTournamentDirector = createServerOnlyFn(
	async (viewer: SessionViewer, tournamentId: number) => {
		// Admins have access to all tournaments
		if (viewer.role === "admin") {
			return;
		}

		// Check if the user is a director for this tournament
		const isDirectorForTournament = await db
			.select({ id: tournamentDirectors.id })
			.from(tournamentDirectors)
			.where(
				and(
					eq(tournamentDirectors.tournamentId, tournamentId),
					exists(
						db
							.select()
							.from(directors)
							.innerJoin(
								playerProfiles,
								eq(directors.profileId, playerProfiles.id),
							)
							.where(
								and(
									eq(directors.id, tournamentDirectors.directorId),
									eq(playerProfiles.userId, viewer.id),
								),
							),
					),
				),
			)
			.limit(1);

		if (isDirectorForTournament.length === 0) {
			throw forbidden("You must be a director for this tournament");
		}
	},
);
