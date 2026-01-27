import { getDefaultTimeZone } from "@/lib/dates";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { parseDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { ProfileName } from "../profiles/name";
import { useCartItems, useCartTotal } from "./context";
import { Link } from "../base/link";
import { button } from "../base/button";
import { useSearch } from "@tanstack/react-router";

export function Cart() {
	const items = useCartItems();
	const total = useCartTotal();
	const dateFormatter = useDateFormatter();

	const search = useSearch({
		from: "/account/registrations/",
	});

	return (
		<div className="col-span-2 bg-white rounded-lg py-3 flex flex-col">
			<h2 className="px-4">Cart</h2>

			<div className="p-4 flex-1 border-b border-gray-300">
				{items.length === 0 ? (
					<div className="text-center text-gray-500">Your cart is empty</div>
				) : (
					items.map((item, index) => (
						<div
							key={`${item.type}-${index}`}
							className="py-2 border-b border-gray-300 last-of-type:border-b-0"
						>
							<div className="flex flex-row justify-between items-start gap-2">
								<span>
									{item.type === "team"
										? `${getTournamentDivisionDisplay(item.division)} ${item.division.tournament.venue.slug}: ${dateFormatter.format(parseDate(item.division.tournament.date).toDate(getDefaultTimeZone()))}`
										: item.title}
								</span>
								<span className="font-semibold shrink-0">${item.price}</span>
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
					))
				)}
			</div>
			<div className="p-4 border-b border-gray-300 flex flex-row justify-between">
				<div className="text-lg text-gray-600">Subtotal</div>
				<div>${total}</div>
			</div>
			<div className="p-4 font-bold flex flex-row justify-between">
				<div className="text-lg">Total</div>
				<div>${total}</div>
			</div>
			<div className="p-4 font-bold flex flex-row justify-between">
				<Link
					className={button({
						color: "primary",
						radius: "full",
						className: "w-full",
					})}
					to="/account/registrations/checkout"
					search={search}
				>
					Checkout
				</Link>
			</div>
		</div>
	);
}
