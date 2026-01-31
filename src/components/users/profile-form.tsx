import { type CalendarDate, today } from "@internationalized/date";
import z from "zod/v4";
import { useViewerIsAdmin } from "@/auth/shared";
import { useAppForm } from "@/components/base/form";
import { profileQueryOptions, useInsertPlayerProfile } from "@/data/profiles";
import type { CreatePlayerProfile } from "@/db/schema";
import { getDefaultTimeZone } from "@/lib/dates";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfileMutationOptions } from "@/functions/profiles/update-profile";
import { getViewerProfilesQueryOptions } from "@/functions/profiles/get-viewer-profiles";
import { queue } from "../base/toast";
import {
	Disclosure,
	DisclosureHeader,
	DisclosurePanel,
} from "@/components/base/disclosure";

const schema = z
	.object({
		firstName: z
			.string({
				message: "This field is required",
			})
			.nonempty({
				message: "This field is required",
			}),
		preferredName: z.string().optional().nullable(),
		lastName: z
			.string({
				message: "This field is required",
			})
			.nonempty({
				message: "This field is required",
			}),
		birthdate: z
			.any()
			.refine((value) => Boolean(value), {
				message: "This field is required",
			})
			.refine(
				(value: CalendarDate) => {
					if (!value) {
						return true;
					}

					const todayDate = today(getDefaultTimeZone());

					return value < todayDate;
				},
				{
					message: "Player must have already been born to play",
				},
			),
		gender: z.enum(["female", "male"], {
			message: "This field is required",
		}),
		imageSource: z.string().optional().nullable(),
		bio: z.string().optional().nullable(),
		heightFeet: z.number().optional().nullable(),
		heightInches: z.number().optional().nullable(),
		dominantArm: z.enum(["right", "left"]).optional().nullable(),
		preferredRole: z
			.enum(["blocker", "defender", "split"])
			.optional()
			.nullable(),
		preferredSide: z.enum(["right", "left"]).optional().nullable(),
		club: z.string().optional().nullable(),
		notJuniorsEligible: z.boolean().optional().nullable(),
		highSchoolGraduationYear: z.number().optional().nullable(),
		college_team: z.string().optional().nullable(),
		collegeTeamYearsParticipated: z.number().optional().nullable(),
	})
	.refine((data) => data.notJuniorsEligible || data.highSchoolGraduationYear, {
		message: "If juniors eligible, High School Graduation Year is required",
		path: ["highSchoolGraduationYear"],
	});

export function ProfileForm({
	className,
	profileId,
	initialValues,
	isEdit,
	onSuccess,
	onCancel,
}: {
	className?: string;
	profileId?: number;
	initialValues?: CreatePlayerProfile | null;
	isEdit?: boolean;
	onSuccess?: () => void;
	onCancel?: () => void;
}) {
	const isAdmin = useViewerIsAdmin();

	const isDisabledExceptAdmin = isEdit && !isAdmin;

	const { mutate: update } = useMutation({
		...updateProfileMutationOptions(),
	});

	const { mutate: insert } = useInsertPlayerProfile();

	const queryClient = useQueryClient();

	const form = useAppForm({
		defaultValues: (initialValues ?? {}) as z.infer<typeof schema>,
		// ({} as Partial<
		// 	Omit<CreatePlayerProfile, "birthdate"> & { birthdate: CalendarDate }
		// >)),
		validators: {
			onMount: schema,
			onBlur: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { birthdate, ...value }, formApi }) => {
			if (isEdit) {
				update(
					{
						...(value as Omit<CreatePlayerProfile, "birthdate">),
						birthdate: birthdate!.toString(),
					},
					{
						onSuccess: () => {
							onSuccess?.();

							queryClient.invalidateQueries(getViewerProfilesQueryOptions());

							if (profileId) {
								queryClient.invalidateQueries(profileQueryOptions(profileId));
							}

							formApi.reset();

							queue.add({
								variant: "success",
								title: "Success!",
								description: "Updated profile successfully.",
							});
						},
					},
				);
			} else {
				insert(
					{
						...(value as Omit<CreatePlayerProfile, "birthdate">),
						birthdate: birthdate!.toString(),
					},
					{
						onSuccess,
					},
				);
			}
		},
	});

	return (
		<form
			className={className}
			onSubmit={(e) => {
				e.preventDefault();

				const data = new FormData(e.target as HTMLFormElement);

				form.handleSubmit(data);
			}}
		>
			<div className="grid grid-cols-6 gap-4 w-full max-w-md items-end">
				<form.AppField
					name="firstName"
					children={(field) => (
						<field.Text
							isRequired
							className="col-span-full sm:col-span-3"
							label="First Name"
							field={field}
							isDisabled={isDisabledExceptAdmin}
						/>
					)}
				/>

				<form.AppField
					name="preferredName"
					children={(field) => (
						<field.Text
							className="col-span-full sm:col-span-3"
							label="Preferred Name"
							field={field}
						/>
					)}
				/>

				<form.AppField
					name="lastName"
					children={(field) => (
						<field.Text
							isRequired
							className="col-span-full"
							label="Last Name"
							field={field}
							isDisabled={isDisabledExceptAdmin}
						/>
					)}
				/>

				<form.AppField
					name="birthdate"
					children={(field) => (
						<field.Date
							className="col-span-full sm:col-span-3"
							isRequired
							label="Birthday"
							field={field}
							isDisabled={isDisabledExceptAdmin}
						/>
					)}
				/>

				<form.AppField
					name="gender"
					children={(field) => (
						<field.Select
							isRequired
							className="col-span-full sm:col-span-3"
							label="Gender"
							field={field}
							options={[
								{
									display: "Female",
									value: "female",
								},
								{
									display: "Male",
									value: "male",
								},
							]}
							isDisabled={isDisabledExceptAdmin}
						/>
					)}
				/>

				<form.Subscribe
					selector={(state) => state.values.notJuniorsEligible}
					children={(notJuniorsEligible) => (
						<form.AppField
							name="highSchoolGraduationYear"
							children={(field) => (
								<field.Number
									className="col-span-3"
									label="HS Graduation Year"
									placeholder={notJuniorsEligible ? "N/a" : "2030"}
									minValue={1900}
									formatOptions={{ useGrouping: false }}
									field={field}
									isRequired={!notJuniorsEligible}
									isDisabled={notJuniorsEligible ?? undefined}
								/>
							)}
						/>
					)}
				/>

				<form.AppField
					name="notJuniorsEligible"
					listeners={{
						onChange: ({ value }) => {
							if (value) {
								form.setFieldValue("highSchoolGraduationYear", null, {
									dontValidate: true,
								});
								form.setFieldMeta("highSchoolGraduationYear", (meta) => ({
									...meta,
									errors: [],
									errorMap: {},
								}));
							}
						},
					}}
					children={(field) => (
						<field.Checkbox
							className="col-span-3 col-start-1"
							label="Not juniors eligible"
							field={field}
						/>
					)}
				/>

				<form.AppField
					name="imageSource"
					children={(field) => (
						<field.ImageUpload
							className="col-span-full"
							label="Profile Photo"
							field={field}
							bucket="profiles"
							prefix="profile-photos"
							circular={true}
						/>
					)}
				/>

				<Disclosure card={false} className="col-span-full w-full min-w-0">
					<DisclosureHeader card={false} size="md">
						Additional Info
					</DisclosureHeader>
					<DisclosurePanel
						card={false}
						contentClassName="grid grid-cols-6 gap-4 w-full items-end"
					>
						<form.AppField
							name="bio"
							children={(field) => (
								<field.TextArea
									className="col-span-full"
									label="Bio"
									field={field}
									placeholder="Tell us about yourself..."
								/>
							)}
						/>

						<form.AppField
							name="heightFeet"
							children={(field) => (
								<field.Number
									className="col-span-3"
									label="Height"
									placeholder="ft"
									minValue={0}
									field={field}
								/>
							)}
						/>

						<form.AppField
							name="heightInches"
							children={(field) => (
								<field.Number
									className="col-span-3"
									placeholder="in"
									minValue={0}
									field={field}
								/>
							)}
						/>

						<form.AppField
							name="dominantArm"
							children={(field) => (
								<field.Select
									className="col-span-full"
									label="Dominant Arm"
									field={field}
									options={[
										{
											display: "Right",
											value: "right",
										},
										{
											display: "Left",
											value: "left",
										},
									]}
								/>
							)}
						/>

						<form.AppField
							name="preferredRole"
							children={(field) => (
								<field.Select
									className="col-span-3"
									label="Preferred Role"
									field={field}
									options={[
										{
											display: "Blocker",
											value: "blocker",
										},
										{
											display: "Defender",
											value: "defender",
										},
										{
											display: "Split",
											value: "split",
										},
									]}
								/>
							)}
						/>

						<form.AppField
							name="preferredSide"
							children={(field) => (
								<field.Select
									className="col-span-3"
									label="Preferred Side"
									field={field}
									options={[
										{
											display: "Right",
											value: "right",
										},
										{
											display: "Left",
											value: "left",
										},
									]}
								/>
							)}
						/>

						<form.AppField
							name="club"
							children={(field) => (
								<field.Text
									className="col-span-full"
									label="Club"
									placeholder="Clubname"
									field={field}
								/>
							)}
						/>

						<form.AppField
							name="collegeTeam"
							children={(field) => (
								<field.Text
									className="col-span-3"
									label="College Team"
									placeholder="College Name"
									field={field}
								/>
							)}
						/>

						<form.AppField
							name="collegeTeamYearsParticipated"
							children={(field) => (
								<field.Number
									className="col-span-3"
									label="Years Participated"
									minValue={0}
									field={field}
								/>
							)}
						/>
					</DisclosurePanel>
				</Disclosure>

				<form.AppForm>
					<form.Footer className="col-span-full">
						{onCancel && (
							<form.Button color="default" onClick={onCancel}>
								Cancel
							</form.Button>
						)}

						<form.SubmitButton allowInvalid={true}>Submit</form.SubmitButton>
					</form.Footer>
				</form.AppForm>
			</div>
		</form>
	);
}
