import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import {
	removeRefMutationOptions,
	removeRefSchema,
} from "@/functions/refs/remove-ref";
import {
	usePlayoffsQueryOptions,
	usePoolsQueryOptions,
	useTeamsQueryOptions,
} from "@/components/tournaments/context";
import { DeleteIcon } from "lucide-react";
import { useState } from "react";

export type RemoveRefFormProps = {
	ids?: number[];
	teamId?: number | null;
};

export function RemoveRefForm({ ids, teamId, ...props }: RemoveRefFormProps) {
	const [open, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const teamsQueryOptions = useTeamsQueryOptions();
	const poolsQueryOptions = usePoolsQueryOptions();
	const playoffsQueryOptions = usePlayoffsQueryOptions();

	const { mutate, failureReason } = useMutation({
		...removeRefMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(teamsQueryOptions);
			queryClient.invalidateQueries(poolsQueryOptions);
			queryClient.invalidateQueries(playoffsQueryOptions);

			setOpen(false);
		},
	});

	const schema = removeRefSchema.omit({ ids: true, teamId: true });

	const form = useAppForm({
		defaultValues: {},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: () => {
			mutate({
				ids,
				teamId,
			});
		},
	});

	return (
		<>
			<Button
				variant="text"
				size="xs"
				color="primary"
				onPress={() => setOpen(true)}
				tooltip={"Remove Ref Team"}
			>
				<DeleteIcon size={12} />
			</Button>
			<Modal {...props} isOpen={open} onOpenChange={setOpen}>
				<div className="p-3 flex flex-col space-y-4 relative">
					<Heading className={title({ size: "sm" })} slot="title">
						Remove Refs?
					</Heading>

					<p>Are you sure you want to remove this reffing assignment?</p>

					<form
						className="flex flex-col space-y-6"
						onSubmit={(e) => {
							e.preventDefault();

							form.handleSubmit();
						}}
					>
						{failureReason && (
							<form.AppForm>
								<form.Alert
									title={"Unable to mark abandoned ref"}
									description={failureReason.message}
								/>
							</form.AppForm>
						)}

						<form.AppForm>
							<form.Footer>
								<Button onPress={() => setOpen(false)}>Cancel</Button>

								<form.SubmitButton requireChange={false}>
									Confirm
								</form.SubmitButton>
							</form.Footer>
						</form.AppForm>
					</form>
				</div>
			</Modal>
		</>
	);
}
