import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { roleHasPermission, viewerQueryOptions } from "@/auth/shared";
import { card, title } from "@/components/base/primitives";
import { TournamentFormsGroup } from "@/components/tournaments/forms";
import { tournamentQueryOptions } from "@/data/tournaments";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/tournaments/create")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<DefaultLayout
			classNames={{
				content: "py-12 flex flex-col items-center space-y-16",
			}}
		>
			<Suspense>
				<h1 className={title({ class: "mx-auto text-center" })}>
					New Tournament
				</h1>
				<div className={card({ class: "w-full max-w-lg mx-auto" })}>
					<TournamentFormsGroup />
				</div>
			</Suspense>
		</DefaultLayout>
	);
}
