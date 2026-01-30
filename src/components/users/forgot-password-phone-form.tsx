import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import z from "zod/v4";
import { authClient } from "@/auth/client";
import { useAppForm } from "@/components/base/form";
import { useLoggedInRedirect } from "@/hooks/auth";

export type ForgotPasswordPhoneFormProps = {
	className?: string;
};

const schema = z.object({
	phoneNumber: z.e164(),
});

export function ForgotPasswordPhoneForm({
	className,
}: ForgotPasswordPhoneFormProps) {
	const [sentTo, setSentTo] = useState<string | undefined>();

	const { mutate: sendReset, failureReason } = useMutation({
		mutationFn: async ({ phoneNumber }: z.infer<typeof schema>) => {
			if (sentTo === phoneNumber) {
				return;
			}

			const { error } = await authClient.phoneNumber.requestPasswordReset({
				phoneNumber,
			});

			if (error) {
				throw error;
			}
		},
		onSuccess: (_, { phoneNumber }) => {
			setSentTo(phoneNumber);
		},
	});

	useLoggedInRedirect("/account");

	const form = useAppForm({
		defaultValues: {
			phoneNumber: "",
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value }) => {
			sendReset(value);
		},
	});

	return (
		<form
			className={className}
			onSubmit={(e) => {
				e.preventDefault();

				form.handleSubmit();
			}}
		>
			<div className="flex flex-col gap-4 max-w-lg">
				{failureReason && (
					<form.Alert
						color="error"
						title="Uh oh!"
						description={failureReason.message}
					/>
				)}

				<form.AppField
					name="phoneNumber"
					children={(field) => (
						<field.Text
							isRequired
							label="Phone Number"
							placeholder="Enter your phone number"
							type="tel"
							field={field}
						/>
					)}
				/>

				<form.AppForm>
					<form.Subscribe
						selector={(state) => [
							state.canSubmit,
							state.isSubmitting,
							state.values.phoneNumber,
						]}
						children={([canSubmit, isSubmitting, email]) => {
							return (
								<>
									{email === sentTo && (
										<div className="space-y-3">
											<p>A confirmation email has been sent to:</p>
											<p className="border border-gray-500 rounded-md p-2 bg-gray-200 font-semibold">
												{form.state.values.phoneNumber}
											</p>
											<p>
												Check your inbox for an email with a link to reset your
												password.
											</p>
										</div>
									)}

									<form.Footer>
										<form.SubmitButton
											className="w-full"
											isDisabled={Boolean(!canSubmit || isSubmitting)}
										>
											Send {email === sentTo ? " again" : null}
										</form.SubmitButton>
									</form.Footer>
								</>
							);
						}}
					/>
				</form.AppForm>
			</div>
		</form>
	);
}
