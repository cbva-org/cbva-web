import { I18nProvider } from "@react-aria/i18n";
import { useNavigate } from "@tanstack/react-router";
import { RouterProvider } from "react-aria-components";

export function Provider({ children }: { children: React.ReactNode }) {
	const navigate = useNavigate();

	return (
		<RouterProvider navigate={(href) => navigate({ href })}>
			<I18nProvider locale="en-US">{children}</I18nProvider>
		</RouterProvider>
	);
}
