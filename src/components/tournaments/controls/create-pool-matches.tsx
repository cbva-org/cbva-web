import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";

import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import {
	createPoolMatchesMutationOptions,
	createPoolMatchesSchema,
} from "@/functions/pools";
import type { Division, TournamentDivision } from "@/db/schema";
import { usePoolsQueryOptions, useTeamsQueryOptions } from "../context";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";

export type CreatePoolMatchesFormProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreatePoolMatchesForm({
	tournamentId,
	division,
	onOpenChange,
	...props
}: CreatePoolMatchesFormProps) {
	const queryClient = useQueryClient();

	const teamsQueryOptions = useTeamsQueryOptions();
	const poolsQueryOptions = usePoolsQueryOptions();

	const { mutate, failureReason } = useMutation({
		...createPoolMatchesMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(teamsQueryOptions);
			queryClient.invalidateQueries(poolsQueryOptions);

			onOpenChange(false);
		},
	});

	const schema = createPoolMatchesSchema.pick({
		overwrite: true,
	});

	const form = useAppForm({
		defaultValues: {
			overwrite: false,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { overwrite } }) => {
			mutate({
				id: division.id,
				tournamentId,
				overwrite,
			});
		},
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Create Pool Matches
				</Heading>

				<p className="text-sm text-gray-700 mb-6">
					Create pool matches for the{" "}
					<span className="font-bold italic">
						{getTournamentDivisionDisplay(division)}
					</span>{" "}
					division. If you want to recreate pool matches entirely, select{" "}
					<span className="font-semibold italic">Overwrite existing</span>.
				</p>

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
								title={"Unable to create pools"}
								description={failureReason.message}
							/>
						</form.AppForm>
					)}

					<form.AppField
						name="overwrite"
						children={(field) => (
							<field.Checkbox label="Overwrite existing" field={field} />
						)}
					/>

					<form.AppForm>
						<form.Footer>
							<Button onPress={() => onOpenChange(false)}>Cancel</Button>

							<form.SubmitButton requireChange={false}>
								Create
							</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
