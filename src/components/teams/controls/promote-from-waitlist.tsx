import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import {
	promoteFromWaitlistMutationOptions,
	promoteFromWaitlistSchema,
} from "@/functions/teams/promote-from-waitlist";
import {
	usePlayoffsQueryOptions,
	usePoolsQueryOptions,
	useTeamsQueryOptions,
} from "@/components/tournaments/context";
import { useEffect, useState } from "react";
import type z from "zod";
import { Radio, RadioGroup } from "@/components/base/radio-group";

export type PromoteFromWaitlistFormProps = {
	tournamentDivisionTeamId: number;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function PromoteFromWaitlistForm({
	tournamentDivisionTeamId,
	...props
}: PromoteFromWaitlistFormProps) {
	const queryClient = useQueryClient();

	const teamsQueryOptions = useTeamsQueryOptions();
	const poolsQueryOptions = usePoolsQueryOptions();
	const playoffsQueryOptions = usePlayoffsQueryOptions();

	const { data: poolOptions } = useQuery({
		...poolsQueryOptions,
		select: (data) =>
			data.map((pool) => ({
				value: pool.id,
				display: pool.name.toUpperCase(),
			})),
	});

	const { mutate, failureReason } = useMutation({
		...promoteFromWaitlistMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(teamsQueryOptions);
			queryClient.invalidateQueries(poolsQueryOptions);
			queryClient.invalidateQueries(playoffsQueryOptions);

			props.onOpenChange(false);
		},
	});

	const schema = promoteFromWaitlistSchema.omit({ id: true });

	const form = useAppForm({
		defaultValues: {
			seed: null,
			poolId: null,
			poolSeed: null,
		} as z.infer<typeof schema>,
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { seed, poolId, poolSeed } }) => {
			mutate({
				id: tournamentDivisionTeamId,
				seed,
				poolId,
				poolSeed,
			});
		},
	});

	const [mode, setMode] = useState<"calculate" | "manual">("calculate");

	useEffect(() => {
		if (mode === "calculate") {
			form.setFieldValue("seed", null);
			form.setFieldValue("poolId", null);
			form.setFieldValue("poolSeed", null);
		}
	}, [mode, form]);

	return (
		<Modal {...props}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Promote Team from Waitlist
				</Heading>

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

					<RadioGroup
						value={mode}
						onChange={(mode) => setMode(mode as "calculate" | "manual")}
					>
						<Radio
							value="calculate"
							isDisabled={poolOptions ? poolOptions.length === 0 : true}
						>
							Recalculate seeds and pools for whole division
						</Radio>
						<Radio
							value="manual"
							isDisabled={poolOptions ? poolOptions.length === 0 : true}
						>
							Manually set seed and pool
						</Radio>
					</RadioGroup>

					{mode === "manual" && (
						<>
							<form.AppField name="seed">
								{(field) => (
									<field.Number label="Seed" field={field} minValue={1} />
								)}
							</form.AppField>

							{poolOptions && (
								<>
									<form.AppField name="poolId">
										{(field) => (
											<field.Select
												label="Pool"
												options={poolOptions ?? []}
												field={field}
											/>
										)}
									</form.AppField>

									<form.AppField name="poolSeed">
										{(field) => (
											<field.Number
												label="Pool Seed"
												field={field}
												minValue={1}
											/>
										)}
									</form.AppField>
								</>
							)}
						</>
					)}

					<form.AppForm>
						<form.Footer>
							<Button onPress={() => props.onOpenChange(false)}>Cancel</Button>

							<form.SubmitButton requireChange={false}>
								Submit
							</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
