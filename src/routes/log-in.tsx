import { createFileRoute } from "@tanstack/react-router";
import { Alert } from "@/components/base/alert";
import { Link } from "@/components/base/link";
import { title } from "@/components/base/primitives";
import { LoginForm } from "@/components/users/login-form";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/log-in")({
	validateSearch: (
		search: Record<string, unknown>,
	): {
		next?: string;
	} => {
		return {
			next: search.next?.toString(),
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { next } = Route.useSearch();

	return (
		<DefaultLayout>
			<div className="text-center flex flex-col px-3 space-y-6 max-w-xl mx-auto">
				<h1 className={title({ size: "lg" })}>Sign In To CBVA</h1>

				<p>
					Don’t have an account? <Link to="/sign-up">Sign Up</Link>
				</p>
			</div>

			<div className="px-3 w-full max-w-md mx-auto flex flex-col space-y-4">
				<Alert
					color="info"
					title="Important: Password Reset Required"
					description={
						<>
							We've recently migrated to a new system. To access your existing
							account, please use the{" "}
							<Link
								to="/account/forgot-password"
								className="underline font-medium"
							>
								Forgot Password
							</Link>{" "}
							option to set a new password.
						</>
					}
				/>

				<LoginForm next={next} className="bg-white rounded-lg p-8 w-full" />
			</div>
		</DefaultLayout>
	);
}
