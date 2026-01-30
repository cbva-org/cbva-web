import { createFileRoute } from "@tanstack/react-router";
import { card, title } from "@/components/base/primitives";
import { DefaultLayout } from "@/layouts/default";
import { Link } from "@/components/base/link";
import { button } from "@/components/base/button";

export const Route = createFileRoute("/account/forgot-password/")({
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
					How would you like to reset your password?
				</p>
			</div>

			<div
				className={card({
					size: "sm",
					className: "max-w-md mx-auto border-0 flex flex-col gap-y-3",
				})}
			>
				<Link
					to="/account/forgot-password/email"
					className={button({ radius: "full", color: "primary" })}
				>
					Receive an email
				</Link>
				<Link
					to="/account/forgot-password/phone"
					className={button({ radius: "full", color: "primary" })}
				>
					Receive a text message
				</Link>
			</div>
		</DefaultLayout>
	);
}
