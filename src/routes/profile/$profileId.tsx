import { parseDate } from "@internationalized/date";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { authClient } from "@/auth/client";
import { useViewerHasPermission } from "@/auth/shared";
import { Button } from "@/components/base/button";
import { title } from "@/components/base/primitives";
import { ProfileName } from "@/components/profiles/name";
import { ProfilePhoto } from "@/components/profiles/photo";
import { profileOverviewQueryOptions } from "@/data/profiles";
import { useViewer } from "@/hooks/auth";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/profile/$profileId")({
	loader: async ({ params: { profileId }, context: { queryClient } }) => {
		const result = await queryClient.ensureQueryData(
			profileOverviewQueryOptions(Number.parseInt(profileId, 10)),
		);

		return result;
	},
	head: () => ({
		// TODO: persons name
		meta: [{ title: "Player Profile" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { profileId } = Route.useParams();

	const { data: profile } = useSuspenseQuery({
		...profileOverviewQueryOptions(Number.parseInt(profileId, 10)),
	});

	const viewer = useViewer();

	console.log("viewer", viewer);

	const canImpersonate = useViewerHasPermission({
		user: ["impersonate"],
	});

	const { mutate: impersonate } = useMutation({
		mutationFn: async () => {
			console.log(profile.userId);

			const { data, error } = await authClient.admin.impersonateUser({
				userId: profile.userId,
			});

			if (error) {
				throw error;
			}

			return data;
		},
	});

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 w-full relative",
			}}
		>
			{canImpersonate && (
				<Button
					className="absolute top-6 right-6"
					color="secondary"
					onPress={() => impersonate()}
				>
					Impersonate
				</Button>
			)}

			<Suspense fallback={<>Nope</>}>
				<div className="px-4 max-w-2xl mx-auto flex flex-row space-x-4">
					<ProfilePhoto {...profile} className="w-24 h-24" />

					<div>
						<h1 className={title({ size: "sm" })}>
							<ProfileName {...profile} />
						</h1>
					</div>
				</div>

				<pre>{JSON.stringify(profile, null, 2)}</pre>
			</Suspense>
		</DefaultLayout>
	);
}
