import { requireRole } from "@/auth/shared";
import { runAllRollups } from "@/functions/ratings/rollup";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tasks/ratings/rollup")({
	server: {
		middleware: [requireRole(["admin"])],
		handlers: {
			POST: async () => {
				console.log("START /api/tasks/ratings/rollup");

				try {
					await runAllRollups();

					console.log("STOP /api/tasks/ratings/rollup - SUCCESS");

					return new Response(JSON.stringify({ success: true }), {
						headers: { "Content-Type": "application/json" },
					});
				} catch (error) {
					console.error("ERROR /api/tasks/ratings/rollup", error);

					return new Response(
						JSON.stringify({
							success: false,
							error: error instanceof Error ? error.message : "Unknown error",
						}),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			},
		},
	},
});
