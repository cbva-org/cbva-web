import { DefaultLayout, DefaultLayoutProps } from "./default";

export function AdminLayout(props: DefaultLayoutProps) {
	return (
		<DefaultLayout
			{...props}
			sideNavItems={[
				{
					title: "Dashboard",
					to: "/admin" as const,
				},
				{
					title: "Settings",
					to: "/admin/settings" as const,
				},
				{
					title: "Invoices",
					to: "/admin/invoices" as const,
				},
			]}
		/>
	);
}
