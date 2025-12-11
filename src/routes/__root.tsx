import { isServer, type QueryClient } from "@tanstack/query-core";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type * as React from "react";
import {
	getViewerFn,
	viewerIdQueryOptions,
	viewerQueryOptions,
} from "@/auth/shared";
import { Provider } from "@/providers";
import appCss from "../styles.css?url";

interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	beforeLoad: async ({ context: { queryClient } }) => {
		const viewer = await getViewerFn();

		if (viewer) {
			queryClient.setQueryData(viewerQueryOptions().queryKey, viewer);
			queryClient.setQueryData(viewerIdQueryOptions().queryKey, viewer.id);
		}

		return {
			viewer,
		};
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "CBVA",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	// beforeLoad: async ({ context: { queryClient } }) => {
	// 	await Promise.all([
	// 		queryClient.ensureQueryData(viewerIdQueryOptions()),
	// 		queryClient.ensureQueryData(viewerQueryOptions()),
	// 	]);
	// },
	// errorComponent: ({ error }) => {
	//    useEffect(() => {
	//      Sentry.captureException(error)
	//    }, [error])

	//    return def
	// },

	component: () => (
		<>
			<Outlet />
			<TanStackRouterDevtools />
		</>
	),
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<Provider>{children}</Provider>
				<Scripts />
			</body>
		</html>
	);
}
