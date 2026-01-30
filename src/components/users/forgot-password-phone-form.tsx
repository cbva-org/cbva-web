import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import z from "zod/v4";
import { authClient } from "@/auth/client";
import { useAppForm } from "@/components/base/form";
import { useLoggedInRedirect } from "@/hooks/auth";

export type ForgotPasswordPhoneFormProps = {
	className?: string;
};

const sendOtpSchema = z.object({
	phoneNumber: z.e164(),
});

const resetPasswordSchema = z
	.object({
		phoneNumber: z.e164(),
		otp: z.string().min(1, { message: "Verification code is required" }),
		newPassword: z
			.string()
			.min(8, { message: "Must be at least 8 characters" }),
		confirmPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export function ForgotPasswordPhoneForm({
	className,
}: ForgotPasswordPhoneFormProps) {
	const navigate = useNavigate();
	const [sentTo, setSentTo] = useState<string | undefined>();

	const {
		mutate: sendOtp,
		failureReason: sendOtpError,
		isPending: isSendingOtp,
	} = useMutation({
		mutationFn: async ({ phoneNumber }: z.infer<typeof sendOtpSchema>) => {
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

	const {
		mutate: resetPassword,
		failureReason: resetPasswordError,
		isPending: isResettingPassword,
	} = useMutation({
		mutationFn: async ({
			phoneNumber,
			otp,
			newPassword,
		}: z.infer<typeof resetPasswordSchema>) => {
			const { error } = await authClient.phoneNumber.resetPassword({
				phoneNumber,
				otp,
				newPassword,
			});

			if (error) {
				throw error;
			}
		},
		onSuccess: () => {
			navigate({
				to: "/log-in",
			});
		},
	});

	useLoggedInRedirect("/account");

	const form = useAppForm({
		defaultValues: {
			phoneNumber: "",
			otp: "",
			newPassword: "",
			confirmPassword: "",
		} as z.infer<typeof resetPasswordSchema>,
		validators: {
			onChange: sentTo ? resetPasswordSchema : sendOtpSchema,
		},
		onSubmit: ({ value }) => {
			if (!sentTo) {
				sendOtp({ phoneNumber: value.phoneNumber });
			} else {
				resetPassword(value);
			}
		},
	});

	const failureReason = sendOtpError || resetPasswordError;

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
							isDisabled={Boolean(sentTo)}
						/>
					)}
				/>

				{sentTo && (
					<>
						<div className="space-y-3">
							<p>A verification code has been sent to:</p>
							<p className="border border-gray-500 rounded-md p-2 bg-gray-200 font-semibold">
								{sentTo}
							</p>
						</div>

						<form.AppField name="otp">
							{(field) => (
								<field.Text
									isRequired
									label="Verification Code"
									placeholder="Enter the code"
									field={field}
									autoComplete="one-time-code"
								/>
							)}
						</form.AppField>

						<form.AppField name="newPassword">
							{(field) => (
								<field.Password isRequired label="New Password" field={field} />
							)}
						</form.AppField>

						<form.AppField name="confirmPassword">
							{(field) => (
								<field.Password
									isRequired
									label="Confirm Password"
									field={field}
								/>
							)}
						</form.AppField>
					</>
				)}

				<form.AppForm>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
						children={([canSubmit, isSubmitting]) => (
							<form.Footer>
								{sentTo && (
									<form.Button
										variant="text"
										onPress={() => sendOtp({ phoneNumber: sentTo })}
										isDisabled={isSendingOtp}
									>
										{isSendingOtp ? "Sending..." : "Resend Code"}
									</form.Button>
								)}
								<form.SubmitButton
									className="flex-1"
									isDisabled={
										!canSubmit ||
										isSubmitting ||
										isSendingOtp ||
										isResettingPassword
									}
								>
									{sentTo ? "Reset Password" : "Send Code"}
								</form.SubmitButton>
							</form.Footer>
						)}
					/>
				</form.AppForm>
			</div>
		</form>
	);
}
