import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Suspense } from "react";
import { useViewerHasPermission } from "@/auth/shared";
import { title } from "@/components/base/primitives";
import { RichTextDisplay } from "@/components/base/rich-text-editor/display";
import { contentPageBlocksQueryOptions, updatePageFn } from "@/data/blocks";
import { divisionsQueryOptions } from "@/data/divisions";
import type { CreateBlock } from "@/db/schema";
import type { LexicalState } from "@/db/schema/shared";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/juniors/")({
	ssr: "data-only",
	loader: async ({ context: { queryClient } }) => {
		await Promise.all([
			queryClient.ensureQueryData(contentPageBlocksQueryOptions("juniors")),
			queryClient.ensureQueryData(divisionsQueryOptions(false)),
		]);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const canEdit = useViewerHasPermission({
		content: ["update"],
	});

	const { data: blocks } = useSuspenseQuery({
		...contentPageBlocksQueryOptions("juniors"),
		select: (data) => new Map(data.map(({ key, content }) => [key, content])),
	});

	const mutationFn = useServerFn(updatePageFn);

	const queryClient = useQueryClient();

	const { mutateAsync } = useMutation({
		mutationFn: async (input: Pick<CreateBlock, "content" | "key">) => {
			return mutationFn({
				data: {
					page: "juniors",
					...input,
				},
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [],
			});
		},
	});

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 px-2 max-w-2xl mx-auto flex flex-col space-y-12",
			}}
		>
			<Suspense>
				<h1
					className={title({
						class: "w-full text-center ",
					})}
				>
					Juniors
				</h1>

				<div>
					{blocks?.has("juniors") && (
						<RichTextDisplay
							name="juniors"
							content={blocks.get("juniors")}
							onSave={
								canEdit
									? async (state) => {
											await mutateAsync({
												key: "juniors",
												content: state as LexicalState,
											});
										}
									: undefined
							}
						/>
					)}
				</div>
			</Suspense>
		</DefaultLayout>
	);
}
