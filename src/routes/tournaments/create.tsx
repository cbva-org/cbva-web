import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { roleHasPermission, viewerQueryOptions } from "@/auth/shared";
import { title } from "@/components/base/primitives";
import { CreateTournamentForm } from "@/components/tournaments/create";
import { tournamentQueryOptions } from "@/data/tournaments";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/tournaments/create")({
	validateSearch: (
		search: Record<string, unknown>,
	): {
		templateId?: number;
	} => {
		return {
			templateId: search.template ? Number(search.template) : undefined,
		};
	},
	loaderDeps: ({ search: { templateId } }) => ({ templateId }),
	loader: async ({ deps: { templateId }, context: { queryClient } }) => {
		const data = await queryClient.ensureQueryData(viewerQueryOptions());

		const canCreate =
			data &&
			roleHasPermission(data.role, {
				tournament: ["create"],
			});

		if (!canCreate) {
			throw redirect({
				to: "/not-found",
			});
		}

		if (templateId) {
			queryClient.ensureQueryData(tournamentQueryOptions(templateId));
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { templateId } = Route.useLoaderDeps();

	const { data: template } = useSuspenseQuery(
		tournamentQueryOptions(templateId),
	);

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 flex flex-col items-center space-y-8",
			}}
		>
			<Suspense>
				<h1 className={title({ class: "mx-auto text-center" })}>
					New Tournament
				</h1>
				<div className="bg-white rounded-lg p-8 w-full max-w-md mx-auto">
					<CreateTournamentForm
						initialValues={
							template
								? {
										date: template.date,
										startTime: template.startTime,
										venueId: template.venueId,
										name: template.name,
									}
								: undefined
						}
					/>
				</div>
			</Suspense>
		</DefaultLayout>
	);
}
