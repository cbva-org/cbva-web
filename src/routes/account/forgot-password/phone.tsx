import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/base/link";
import { title } from "@/components/base/primitives";
import { DefaultLayout } from "@/layouts/default";
import { ForgotPasswordPhoneForm } from "@/components/users/forgot-password-phone-form";

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

			<ForgotPasswordPhoneForm className="bg-white rounded-lg p-8 w-full max-w-sm mx-auto" />

			<p className="text-center text-gray-600 mt-4">
				Or{" "}
				<Link
					to="/account/forgot-password/email"
					className="text-primary underline hover:no-underline"
				>
					receive an email instead
				</Link>
			</p>
		</DefaultLayout>
	);
}
