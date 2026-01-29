import { createFileRoute, Link } from "@tanstack/react-router";
import { title } from "@/components/base/primitives";
import { DefaultLayout } from "@/layouts/default";
import {
	registrationPageSchema,
	useCartItems,
	useCartTotal,
} from "@/components/registrations/context";
import { ProfileName } from "@/components/profiles/name";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { parseDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { getDefaultTimeZone } from "@/lib/dates";
import { button } from "@/components/base/button";
import { CheckCircleIcon } from "lucide-react";

export const Route = createFileRoute("/account/registrations/success")({
	validateSearch: registrationPageSchema,
	head: () => ({
		meta: [{ title: "Checkout Success" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const items = useCartItems("success");
	const total = useCartTotal("success");
	const dateFormatter = useDateFormatter();

	return (
		<DefaultLayout>
			<div className="text-center flex flex-col space-y-6 max-w-xl mx-auto py-8">
				<div className="flex justify-center">
					<CheckCircleIcon className="w-16 h-16 text-green-500" />
				</div>
				<h1 className={title({ size: "lg" })}>Payment Successful!</h1>
				<p className="text-gray-600">
					Thank you for your purchase. A confirmation email has been sent to
					your email address.
				</p>
			</div>

			<div className="rounded-lg bg-white p-6 max-w-lg mx-auto">
				<h2 className={title({ size: "sm", className: "mb-4" })}>
					Order Summary
				</h2>

				<div className="divide-y divide-gray-200">
					{items.map((item, index) => (
						<div
							key={`${item.type}-${index}`}
							className="py-3 flex flex-row justify-between items-start gap-2"
						>
							<div>
								<div className="font-medium">
									{item.type === "team"
										? `${getTournamentDivisionDisplay(item.division)} ${item.division.tournament.venue.slug}: ${dateFormatter.format(parseDate(item.division.tournament.date).toDate(getDefaultTimeZone()))}`
										: item.title}
								</div>
								<div className="text-gray-600 text-sm">
									{item.profiles.map((profile, i) => (
										<span key={profile.id}>
											{i > 0 && ", "}
											<ProfileName {...profile} link={false} />
										</span>
									))}
								</div>
							</div>
							<span className="font-semibold shrink-0">${item.price}</span>
						</div>
					))}
				</div>

				<div className="border-t border-gray-300 mt-4 pt-4 flex flex-row justify-between font-bold text-lg">
					<span>Total Paid</span>
					<span>${total}</span>
				</div>

				<div className="mt-6 flex flex-col gap-3">
					<Link
						to="/tournaments"
						className={button({ color: "primary", radius: "full" })}
					>
						Browse Tournaments
					</Link>
					<Link
						to="/account"
						className={button({ variant: "outline", radius: "full" })}
					>
						Go to Account
					</Link>
				</div>
			</div>
		</DefaultLayout>
	);
}
