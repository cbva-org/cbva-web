import { DefaultLayout } from "@/layouts/default";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/account/registration/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <DefaultLayout>Hello "/account/registration/"!</DefaultLayout>;
}
