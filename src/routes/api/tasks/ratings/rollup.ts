import { requireRole } from "@/auth/shared";
import { runAllRollups } from "@/functions/ratings/rollup";
import { withTiming } from "@/middlewares/with-timing";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tasks/ratings/rollup")({
	server: {
		middleware: [requireRole(["admin"]), withTiming("ratings/rollup")],
		handlers: {
			POST: async () => {
				try {
					await runAllRollups();

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
