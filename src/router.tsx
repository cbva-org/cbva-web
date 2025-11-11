import { createRouter as createTanstackRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

import "./styles.css";

import { Provider, queryClient } from "./providers";

export function getRouter() {
	return createTanstackRouter({
		routeTree,
		context: { queryClient: queryClient },
		defaultPreload: "intent",
		Wrap: (props: { children: React.ReactNode }) => {
			return <Provider>{props.children}</Provider>;
		},
	});
}
