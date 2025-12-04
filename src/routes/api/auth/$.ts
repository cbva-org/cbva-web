// import { createFileRoute } from "@tanstack/react-router";

import { auth } from "@/auth";

// export const Route = createFileRoute("/api/auth/$")({
// 	server: {
// 		handlers: {
// 			GET: async ({ request }: { request: Request }) => {
// 				return await auth.handler(request);
// 			},
// 			POST: async ({ request }: { request: Request }) => {
// 				return await auth.handler(request);
// 			},
// 		},
// 	},
// });

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }) => {
				return auth.handler(request);
			},
			POST: ({ request }) => {
				return auth.handler(request);
			},
		},
	},
});
