import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import z from "zod/v4";
import { authClient } from "@/auth/client";
import { useAppForm } from "@/components/base/form";
import { useLoggedInRedirect } from "@/hooks/auth";
import { Link } from "../base/link";
import { Tab, TabList, TabPanel, Tabs } from "../base/tabs";

export type LoginFormProps = {
	className?: string;
	next?: string;
};

const emailSchema = z.object({
	email: z.email(),
	password: z.string().nonempty({
		message: "This field is required",
	}),
});

const phoneSchema = z.object({
	phoneNumber: z.e164(),
	password: z.string().nonempty({
		message: "This field is required",
	}),
});

type LoginMethod = "email" | "phone";

export function LoginForm({ className, next }: LoginFormProps) {
	const navigate = useNavigate();
	const [method, setMethod] = useState<LoginMethod>("email");

	const { mutate: loginWithEmail, failureReason: emailError } = useMutation({
		mutationFn: async ({ email, password }: z.infer<typeof emailSchema>) => {
			const { error } = await authClient.signIn.email({
				email,
				password,
			});

			if (error) {
				throw error;
			}

			navigate({
				to: next ?? "/account",
			});
		},
	});

	const { mutate: loginWithPhone, failureReason: phoneError } = useMutation({
		mutationFn: async ({
			phoneNumber,
			password,
		}: z.infer<typeof phoneSchema>) => {
			const { error } = await authClient.signIn.phoneNumber({
				phoneNumber,
				password,
			});

			if (error) {
				throw error;
			}

			navigate({
				to: next ?? "/account",
			});
		},
	});

	useLoggedInRedirect("/account");

	const emailForm = useAppForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onMount: emailSchema,
			onChange: emailSchema,
		},
		onSubmit: ({ value }) => {
			loginWithEmail(value);
		},
	});

	const phoneForm = useAppForm({
		defaultValues: {
			phoneNumber: "",
			password: "",
		},
		validators: {
			onMount: phoneSchema,
			onChange: phoneSchema,
		},
		onSubmit: ({ value }) => {
			loginWithPhone(value);
		},
	});

	const failureReason = method === "email" ? emailError : phoneError;

	return (
		<div className={className}>
			<Tabs
				selectedKey={method}
				onSelectionChange={(key) => setMethod(key as LoginMethod)}
			>
				<TabList className="mb-4">
					<Tab id="email">Email</Tab>
					<Tab id="phone">Phone</Tab>
				</TabList>

				<TabPanel id="email">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							emailForm.handleSubmit();
						}}
					>
						<div className="flex flex-col gap-4 max-w-md">
							{failureReason && method === "email" && (
								<emailForm.Alert
									color="error"
									title="Uh oh!"
									description={failureReason.message}
								/>
							)}

							<emailForm.AppField
								name="email"
								children={(field) => (
									<field.Text
										isRequired
										label="Email"
										placeholder="Enter your email"
										type="email"
										field={field}
									/>
								)}
							/>

							<emailForm.AppField
								name="password"
								children={(field) => (
									<field.Password
										isRequired
										label="Password"
										labelRight={
											<Link
												to="/account/forgot-password"
												className="hover:underline"
											>
												Forgot your password?
											</Link>
										}
										placeholder="Enter your password"
										field={field}
									/>
								)}
							/>

							<emailForm.AppForm>
								<emailForm.Subscribe
									selector={(state) => [state.canSubmit, state.isSubmitting]}
									children={([canSubmit, isSubmitting]) => (
										<emailForm.Footer>
											<emailForm.SubmitButton
												className="w-full"
												isDisabled={Boolean(!canSubmit || isSubmitting)}
											>
												Log in
											</emailForm.SubmitButton>
										</emailForm.Footer>
									)}
								/>
							</emailForm.AppForm>
						</div>
					</form>
				</TabPanel>

				<TabPanel id="phone">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							phoneForm.handleSubmit();
						}}
					>
						<div className="flex flex-col gap-4 max-w-md">
							{failureReason && method === "phone" && (
								<phoneForm.Alert
									color="error"
									title="Uh oh!"
									description={failureReason.message}
								/>
							)}

							<phoneForm.AppField
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

							<phoneForm.AppField
								name="password"
								children={(field) => (
									<field.Password
										isRequired
										label="Password"
										labelRight={
											<Link
												to="/account/forgot-password"
												className="hover:underline"
											>
												Forgot your password?
											</Link>
										}
										placeholder="Enter your password"
										field={field}
									/>
								)}
							/>

							<phoneForm.AppForm>
								<phoneForm.Subscribe
									selector={(state) => [state.canSubmit, state.isSubmitting]}
									children={([canSubmit, isSubmitting]) => (
										<phoneForm.Footer>
											<phoneForm.SubmitButton
												className="w-full"
												isDisabled={Boolean(!canSubmit || isSubmitting)}
											>
												Log in
											</phoneForm.SubmitButton>
										</phoneForm.Footer>
									)}
								/>
							</phoneForm.AppForm>
						</div>
					</form>
				</TabPanel>
			</Tabs>
		</div>
	);
}
