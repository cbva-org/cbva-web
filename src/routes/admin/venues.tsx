import { createFileRoute, redirect } from "@tanstack/react-router";
import { VenuesList } from "@/components/admin/venues-list";
import { AdminLayout } from "@/layouts/admin";

export const Route = createFileRoute("/admin/venues")({
	loader: async ({ context: { viewer } }) => {
		if (!viewer || viewer.role !== "admin") {
			throw redirect({ to: "/not-found" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<AdminLayout
			classNames={{
				content: "max-w-4xl px-4 py-16 mx-auto flex flex-col space-y-8",
			}}
		>
			<VenuesList />
		</AdminLayout>
	);
}
