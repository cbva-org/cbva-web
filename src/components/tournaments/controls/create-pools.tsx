import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { teamsQueryOptions } from "@/data/teams";
import {
	createPoolsMutationOptions,
	createPoolsSchema,
} from "@/data/tournaments/pools";
import type { Division, TournamentDivision } from "@/db/schema";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";

export type CreatePoolsFormProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreatePoolsForm({
	tournamentId,
	division,
	onOpenChange,
	...props
}: CreatePoolsFormProps) {
	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...createPoolsMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: teamsQueryOptions(division.id).queryKey,
			});

			onOpenChange(false);
		},
	});

	const schema = createPoolsSchema.pick({
		count: true,
		overwrite: true,
	});

	const form = useAppForm({
		defaultValues: {
			count: 1,
			overwrite: false,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { count, overwrite } }) => {
			mutate({
				id: division.id,
				count,
				overwrite,
			});
		},
	});

	const { data: teamCount } = useQuery({
		...teamsQueryOptions(division.id),
		select: (data) => data.length,
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<h3 className={title({ size: "sm" })}>Create Pools</h3>

				<p className="text-sm text-gray-700 mb-6">
					Add a team to the{" "}
					<span className="font-bold italic">
						{getTournamentDivisionDisplay(division)}
					</span>{" "}
					division for free. If you want to recreate pools entirely, select{" "}
					<span className="font-semibold italic">Overwrite existing</span>.
				</p>

				{teamCount && (
					<p className="text-sm text-gray-700 mb-6">
						There are <span className="font-bold italic">{teamCount}</span>{" "}
						teams in this division.
					</p>
				)}

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
						name="count"
						children={(field) => (
							<field.Number label="Pool Count" field={field} minValue={1} />
						)}
					/>

					<form.AppField
						name="overwrite"
						children={(field) => (
							<field.Checkbox label="Overwrite existing" field={field} />
						)}
					/>

					<form.AppForm>
						<form.Footer>
							<Button onPress={() => onOpenChange(false)}>Cancel</Button>

							<form.SubmitButton>Create</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
