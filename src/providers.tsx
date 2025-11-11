import { I18nProvider } from "@react-aria/i18n";
import { QueryClient } from "@tanstack/query-core";
import { QueryClientProvider } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { RouterProvider } from "react-aria-components";

export const queryClient = new QueryClient();

export function Provider({ children }: { children: React.ReactNode }) {
	const navigate = useNavigate();

	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider navigate={(href) => navigate({ href })}>
				<I18nProvider locale="en-US">{children}</I18nProvider>
			</RouterProvider>
		</QueryClientProvider>
	);
}
