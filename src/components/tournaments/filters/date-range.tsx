import { parseDate } from "@internationalized/date";
import { Link, useRouter } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import {
	DateField,
	DateInput,
	DateSegment,
	Label,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { fieldGroupStyles } from "@/components/base/form/fields/shared";

type FilterDateRangeProps = {
	startDate: string | null;
	endDate: string | null;
};

const segmentStyles = tv({
	base: "inline p-0.5 type-literal:px-0 rounded-xs outline outline-0 forced-color-adjust-none caret-transparent text-gray-800",
	variants: {
		isPlaceholder: {
			true: "text-gray-400 italic",
		},
		isFocused: {
			true: "bg-blue-200 text-black",
		},
	},
});

export function FilterDateRange({ startDate, endDate }: FilterDateRangeProps) {
	const router = useRouter();

	const handleStartDateChange = (value: { toString: () => string } | null) => {
		const newStartDate = value?.toString() ?? null;
		router.navigate({
			to: "/tournaments",
			search: (prev) => ({
				...prev,
				page: 1,
				startDate: newStartDate,
			}),
		});
	};

	const handleEndDateChange = (value: { toString: () => string } | null) => {
		const newEndDate = value?.toString() ?? null;
		router.navigate({
			to: "/tournaments",
			search: (prev) => ({
				...prev,
				page: 1,
				endDate: newEndDate,
			}),
		});
	};

	return (
		<div className="flex flex-col gap-2">
			<Label className="text-sm font-medium">Date Range</Label>
			<div className="flex flex-row gap-2 items-center">
				<DateField
					value={startDate ? parseDate(startDate) : null}
					onChange={handleStartDateChange}
					aria-label="Start date"
					className="flex-1"
				>
					<DateInput
						className={(renderProps) =>
							fieldGroupStyles({
								...renderProps,
								class: "bg-white block w-full px-2 py-1.5 text-sm",
							})
						}
					>
						{(segment) => (
							<DateSegment segment={segment} className={segmentStyles} />
						)}
					</DateInput>
				</DateField>
				<span className="text-gray-500">to</span>
				<DateField
					value={endDate ? parseDate(endDate) : null}
					onChange={handleEndDateChange}
					aria-label="End date (optional)"
					className="flex-1"
				>
					<DateInput
						className={(renderProps) =>
							fieldGroupStyles({
								...renderProps,
								class: "bg-white block w-full px-2 py-1.5 text-sm",
							})
						}
					>
						{(segment) => (
							<DateSegment segment={segment} className={segmentStyles} />
						)}
					</DateInput>
				</DateField>
				{(startDate || endDate) && (
					<Link
						to="/tournaments"
						search={(search) => ({
							...search,
							page: 1,
							startDate: null,
							endDate: null,
						})}
						className="p-1 text-gray-500 hover:text-gray-700"
						aria-label="Clear date range"
					>
						<XIcon size={16} />
					</Link>
				)}
			</div>
		</div>
	);
}
