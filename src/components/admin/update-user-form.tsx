import {
	type QueryKey,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useAppForm } from "@/components/base/form";
import {
	adminUpdateUserMutationOptions,
	adminUpdateUserSchema,
} from "@/data/users";
import type { User } from "@/db/schema";

export type UpdateUserFormProps = Pick<User, "id" | "name" | "role"> & {
	refetch: () => void;
	queryKey: QueryKey;
	onSuccess?: () => void;
};

export function UpdateUserForm({
	id,
	name,
	role,
	queryKey,
	onSuccess,
}: UpdateUserFormProps) {
	const queryClient = useQueryClient();

	const { mutate } = useMutation(adminUpdateUserMutationOptions());

	const schema = adminUpdateUserSchema.omit({
		id: true,
	});

	const form = useAppForm({
		defaultValues: {
			role,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { role }, formApi }) => {
			mutate(
				{
					id,
					role,
				},
				{
					onSuccess: () => {
						queryClient.setQueryData(queryKey, (data: { users: User[] }) => {
							return {
								...data,
								users: data.users.map((user) =>
									user.id === id
										? {
												...user,
												role,
											}
										: user,
								),
							};
						});

						formApi.reset();
						onSuccess?.();
					},
				},
			);
		},
	});

	return (
		<form
			className="flex flex-col space-y-4"
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
		>
			<div className="flex flex-col space-y-1">
				<span className="text-sm text-gray-500">Name</span>
				<span className="font-medium">{name}</span>
			</div>

			<form.AppField
				name="role"
				children={(field) => (
					<field.Select
						label="Role"
						field={field}
						options={[
							{
								display: "User",
								value: "user",
							},
							{
								display: "Director",
								value: "td",
							},
							{
								display: "Admin",
								value: "admin",
							},
						]}
					/>
				)}
			/>

			<form.AppForm>
				<form.Footer>
					<form.SubmitButton>Save Changes</form.SubmitButton>
				</form.Footer>
			</form.AppForm>
		</form>
	);
}
