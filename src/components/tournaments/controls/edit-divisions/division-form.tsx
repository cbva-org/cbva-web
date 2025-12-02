import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { title } from "@/components/base/primitives";
import { divisionsQueryOptions } from "@/data/divisions";
import { tournamentQueryOptions } from "@/data/tournaments";
import {
	upsertTournamentDivisionMutationOptions,
	upsertTournamentDivisionSchema,
} from "@/data/tournaments/divisions";
import { isNotNullOrUndefined } from "@/utils/types";

export type DivisionFormProps = {
	tournamentId: number;
	divisionId?: number;
	onCancel: () => void;
};

export function DivisionForm({
	tournamentId,
	divisionId,
	onCancel,
}: DivisionFormProps) {
	const { data: divisionOptions } = useSuspenseQuery({
		...divisionsQueryOptions(),
		select: (divisions) =>
			divisions.map(({ id, display, name, maxAge }) => ({
				value: id,
				display: display ?? name.toUpperCase(),
				hasMaxAge: isNotNullOrUndefined(maxAge),
			})),
	});

	const { data: editDivision } = useSuspenseQuery({
		...tournamentQueryOptions(tournamentId),
		select: (data) =>
			data?.tournamentDivisions.find(({ id }) => divisionId === id),
	});

	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...upsertTournamentDivisionMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(tournamentQueryOptions(tournamentId));

			onCancel();
		},
	});

	const form = useAppForm({
		defaultValues: {
			id: divisionId,
			divisionId: editDivision?.divisionId,
			gender: editDivision?.gender,
			capacity: editDivision?.capacity,
			waitlistCapacity: editDivision?.waitlistCapacity,
			autopromoteWaitlist: editDivision?.autopromoteWaitlist,
			teamSize: editDivision?.teamSize,
		},
		validators: {
			onChange: upsertTournamentDivisionSchema,
		},
		onSubmit: ({
			value: {
				id,
				divisionId,
				gender,
				capacity,
				waitlistCapacity,
				autopromoteWaitlist,
				teamSize,
			},
		}) => {
			mutate({
				id,
				divisionId,
				gender,
				capacity,
				waitlistCapacity,
				autopromoteWaitlist,
				teamSize,
			});
		},
	});

	return (
		<form
			className="grid grid-cols-6 gap-3"
			onSubmit={(e) => {
				e.preventDefault();

				form.handleSubmit();
			}}
		>
			<h3 className={title({ size: "xs", class: "col-span-full" })}>
				{divisionId ? "Edit Division" : "Add Division"}
			</h3>

			{failureReason && (
				<form.AppForm>
					<form.Alert
						className="col-span-full"
						title={"Unable to set seeds"}
						description={failureReason.message}
					/>
				</form.AppForm>
			)}

			<form.AppField
				name="divisionId"
				children={(field) => (
					<field.Select
						label="Division"
						field={field}
						options={divisionOptions}
						placeholder="Select a division"
						className="col-span-full"
					/>
				)}
			/>

			<form.Subscribe selector={(state) => [state.values.divisionId]}>
				{([divisionId]) => {
					const selectedDivision = divisionOptions.find(
						({ value }) => value === divisionId,
					);

					return (
						<form.AppField
							name="gender"
							children={(field) => (
								<field.Select
									label="Gender"
									className="col-span-full"
									field={field}
									isDisabled={!selectedDivision}
									options={[
										{
											value: "male",
											display: selectedDivision?.hasMaxAge ? "Boy's" : "Men's",
										},
										{
											value: "female",
											display: selectedDivision?.hasMaxAge
												? "Girl's"
												: "Women's",
										},
									]}
									placeholder="Select"
								/>
							)}
						/>
					);
				}}
			</form.Subscribe>

			<form.AppField
				name="capacity"
				children={(field) => (
					<field.Number
						label="Capacity"
						className="col-span-full sm:col-span-3"
						field={field}
					/>
				)}
			/>

			<form.AppField
				name="waitlistCapacity"
				children={(field) => (
					<field.Number
						label="Waitlist Capacity"
						className="col-span-full sm:col-span-3"
						field={field}
					/>
				)}
			/>

			<form.AppField
				name="autopromoteWaitlist"
				children={(field) => (
					<field.Checkbox
						className="col-span-full"
						label="Auto Promote from Waitlist"
						field={field}
					/>
				)}
			/>

			<form.AppForm>
				<form.Footer>
					<Button onPress={onCancel}>Cancel</Button>

					<form.SubmitButton>Submit</form.SubmitButton>
				</form.Footer>
			</form.AppForm>
		</form>
	);
}
