import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/base/link";
import { title } from "@/components/base/primitives";
import { DefaultLayout } from "@/layouts/default";
import { ForgotPasswordPhoneForm } from "@/components/users/forgot-password-phone-form";
import { Alert } from "@/components/base/alert";

export const Route = createFileRoute("/account/forgot-password/phone")({
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
					Fill out the form below and we'll send you text message with a
					verification code.
				</p>
			</div>

			<div className="px-3 w-full max-w-sm mx-auto flex flex-col space-y-4">
				<Alert
					color="info"
					title="Phone Verification Notice"
					description={
						<div className="flex flex-col gap-y-2">
							<p>
								This option is only available for phone numbers that were
								previously verified in our system.
							</p>
							<p>If you're not receiving a text message, you may have:</p>
							<ul className="list-disc list-inside">
								<li>Not previously verified your phone number</li>
								<li>
									Entered your phone number in an unsupported format
								</li>
							</ul>
							<p>
								If you're unable to receive text messages, please{" "}
								<Link
									to="/account/forgot-password/email"
									className="underline font-medium"
								>
									reset your password via email
								</Link>{" "}
								instead.
							</p>
						</div>
					}
				/>
			</div>

			<ForgotPasswordPhoneForm className="bg-white rounded-lg p-8 w-full max-w-sm mx-auto" />

			<p className="text-center text-gray-600 mt-4">
				<Link to="/account/forgot-password/email">
					Receive an email instead
				</Link>
			</p>
		</DefaultLayout>
	);
}
