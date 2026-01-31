import { createFileRoute } from "@tanstack/react-router";
import { Alert } from "@/components/base/alert";
import {
	Disclosure,
	DisclosureHeader,
	DisclosurePanel,
} from "@/components/base/disclosure";
import { Link } from "@/components/base/link";
import { title } from "@/components/base/primitives";
import { ForgotPasswordEmailForm } from "@/components/users/forgot-password-email-form";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/account/forgot-password/email")({
	head: () => ({
		meta: [{ title: "Forgot Password" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<DefaultLayout>
			<div className="text-center flex flex-col space-y-6 max-w-xl mx-auto">
				<h1 className={title({ size: "lg" })}>Forgot your password?</h1>

				<p className="max-w-md mx-auto">
					Fill out the form below and we'll send you a link to reset your
					password.
				</p>
			</div>

			<div className="px-3 w-full max-w-sm mx-auto flex flex-col space-y-4">
				<Alert
					color="info"
					title="Returning User?"
					description={
						<div>
							<p>
								If you had an account on our previous system, use this form to
								set a new password. Enter the email address associated with your
								account and check your inbox for a reset link.
							</p>

							<Disclosure card={false} className="text-inherit">
								<DisclosureHeader
									card={false}
									size="sm"
									className="text-inherit"
								>
									Not getting an email?
								</DisclosureHeader>
								<DisclosurePanel card={false}>
									<div>
										<ul className="list-disc list-inside text-sm text-inherit space-y-1">
											<li>Check your spam or junk folder</li>
											<li>
												Verify you're using the same email address from your
												original account
											</li>
											<li>Wait a few minutes and try again</li>
											<li>
												Contact{" "}
												<Link to="mailto:info@cbva.com" className="underline">
													info@cbva.com
												</Link>{" "}
												for assistance
											</li>
										</ul>
										<p className="mt-4">
											<span className="font-semibold">Note:</span> some email
											providers such as Yahoo might take up to 10 minutes or
											more to receive our emails.
										</p>
									</div>
								</DisclosurePanel>
							</Disclosure>
						</div>
					}
				/>
			</div>

			<ForgotPasswordEmailForm className="bg-white rounded-lg p-8 w-full max-w-sm mx-auto" />

			<p className="text-center text-gray-600 mt-4">
				<Link to="/account/forgot-password/phone">
					Receive a text message instead
				</Link>
			</p>
		</DefaultLayout>
	);
}
