import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { poolsQueryOptions } from "@/data/pools";
import { teamsQueryOptions } from "@/data/teams";
import { fillTournamentMutationOptions } from "@/data/tournaments/teams";
import type { Division, TournamentDivision } from "@/db/schema";

export type FillTournamentFormProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function FillTournamentForm({
	tournamentId,
	division,
	onOpenChange,
	...props
}: FillTournamentFormProps) {
	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...fillTournamentMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: teamsQueryOptions({ tournamentDivisionId: division.id })
					.queryKey,
			});

			queryClient.invalidateQueries({
				queryKey: poolsQueryOptions({ tournamentDivisionId: division.id })
					.queryKey,
			});

			onOpenChange(false);
		},
	});

	const form = useAppForm({
		defaultValues: {
			// overwrite: false,
		},
		validators: {
			// onMount: schema,
			// onChange: schema,
		},
		onSubmit: () => {
			console.log("hello");

			mutate({
				id: tournamentId,
			});
		},
	});

	return (
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<h3 className={title({ size: "sm" })}>Fill Tournament</h3>

				<p className="text-sm text-gray-700 mb-6">
					Randomly fill each division in the tournament to max capacity.
				</p>

				<form
					className="flex flex-col space-y-6"
					onSubmit={(e) => {
						e.preventDefault();

						console.log("here");

						form.handleSubmit();
					}}
				>
					{failureReason && (
						<form.AppForm>
							<form.Alert
								title="Unable to fill tournament"
								description={failureReason.message}
							/>
						</form.AppForm>
					)}

					<form.AppForm>
						<form.Footer>
							<Button onPress={() => onOpenChange(false)}>Cancel</Button>

							<form.SubmitButton>Submit</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
