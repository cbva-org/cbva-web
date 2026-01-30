import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import z from "zod/v4";
import { authClient } from "@/auth/client";
import { useAppForm } from "@/components/base/form";
import { useLoggedInRedirect } from "@/hooks/auth";
import { Link } from "../base/link";

export type LoginFormProps = {
	className?: string;
	next?: string;
};

// Accepts either email or E.164 phone number
const emailOrPhoneSchema = z.union([z.email(), z.e164()]);

const schema = z.object({
	identifier: emailOrPhoneSchema,
	password: z.string().nonempty({
		message: "This field is required",
	}),
});

function isEmail(value: string): boolean {
	return value.includes("@");
}

export function LoginForm({ className, next }: LoginFormProps) {
	const navigate = useNavigate();

	const { mutate: login, failureReason } = useMutation({
		mutationFn: async ({ identifier, password }: z.infer<typeof schema>) => {
			if (isEmail(identifier)) {
				const { error } = await authClient.signIn.email({
					email: identifier,
					password,
				});

				if (error) {
					throw error;
				}
			} else {
				const { error } = await authClient.signIn.phoneNumber({
					phoneNumber: identifier,
					password,
				});

				if (error) {
					throw error;
				}
			}

			navigate({
				to: next ?? "/account",
			});
		},
	});

	useLoggedInRedirect("/account");

	const form = useAppForm({
		defaultValues: {
			identifier: "",
			password: "",
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value }) => {
			login(value);
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
			<div className="flex flex-col gap-4 max-w-md">
				{failureReason && (
					<form.Alert
						color="error"
						title="Uh oh!"
						description={failureReason.message}
					/>
				)}

				<form.AppField
					name="identifier"
					children={(field) => (
						<field.Text
							isRequired
							label="Email or Phone"
							placeholder="Enter your email or phone number"
							field={field}
						/>
					)}
				/>

				<form.AppField
					name="password"
					children={(field) => (
						<field.Password
							isRequired
							label="Password"
							labelRight={
								<Link to="/account/forgot-password" className="hover:underline">
									Forgot your password?
								</Link>
							}
							placeholder="Enter your password"
							field={field}
						/>
					)}
				/>

				<form.AppForm>
					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
						children={([canSubmit, isSubmitting]) => {
							return (
								<form.Footer>
									<form.SubmitButton
										className="w-full"
										isDisabled={Boolean(!canSubmit || isSubmitting)}
									>
										Log in
									</form.SubmitButton>
								</form.Footer>
							);
						}}
					/>
				</form.AppForm>
			</div>
		</form>
	);
}
