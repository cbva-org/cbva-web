import { requireRole } from "@/auth/shared";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tasks/ratings/rollup")({
	server: {
		middleware: [requireRole(["admin"])],
		handlers: {
			POST: async () => {
				console.log("START /api/tasks/ratings/rollup");

				// TODO: calculate ratings for players based on the tournaments they've played in the past. Here is the description from the informational page on the site:
				//
				// An earned rating lasts the rest of that season and through the following season. If not earned again it drops one tier every January 1st. For example, earning a AA in 2024 lasts through all of 2025, dropping to A in 2026, B in 2027 and Unrated after. Points last 365 days and are cumulative.
				//
				// There is code for this written in rust and the database is edgedb (now gel). The exact file is /Users/isaacsnow/ws/cbva/rust/src/tournament_finish.rs

				console.log("STOP /api/tasks/ratings/rollup");

				return new Response(JSON.stringify({ success: true }), {
					headers: {
						"Content-Type": "application/json",
					},
				});
			},
		},
	},
});
