import { parseDate, type CalendarDate } from "@internationalized/date";
import { Link, useRouter } from "@tanstack/react-router";
import { CalendarIcon, XIcon } from "lucide-react";
import {
	Button,
	CalendarCell,
	CalendarGrid,
	DateInput,
	DateRangePicker,
	DateSegment,
	Dialog,
	Group,
	Heading,
	Label,
	RangeCalendar,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { Popover } from "@/components/base/popover";
import {
	fieldGroupStyles,
	baseInputStyles,
} from "@/components/base/form/fields/shared";

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

const calendarCellStyles = tv({
	base: "w-8 h-8 text-sm rounded-lg text-center cursor-default forced-colors:text-[ButtonText]",
	variants: {
		isHovered: {
			true: "bg-gray-200",
		},
		isFocused: {
			true: "bg-blue-200 text-black",
		},
		isSelected: {
			true: "bg-blue-600 text-white",
		},
		isSelectionStart: {
			true: "rounded-l-lg",
		},
		isSelectionEnd: {
			true: "rounded-r-lg",
		},
		isOutsideMonth: {
			true: "text-gray-300",
		},
		isDisabled: {
			true: "text-gray-300",
		},
	},
	compoundVariants: [
		{
			isSelected: true,
			isSelectionStart: false,
			isSelectionEnd: false,
			class: "bg-blue-100 text-blue-900 rounded-none",
		},
	],
});

export function FilterDateRange({ startDate, endDate }: FilterDateRangeProps) {
	const router = useRouter();

	const value =
		startDate && endDate
			? {
					start: parseDate(startDate),
					end: parseDate(endDate),
				}
			: null;

	const handleChange = (
		range: { start: CalendarDate; end: CalendarDate } | null,
	) => {
		router.navigate({
			to: "/tournaments",
			search: (prev) => ({
				...prev,
				page: 1,
				startDate: range?.start.toString() ?? null,
				endDate: range?.end.toString() ?? null,
			}),
		});
	};

	return (
		<div className="flex flex-col gap-2">
			<Label className="text-sm font-medium">Date Range</Label>
			<div className="flex flex-row gap-2 items-center">
				<DateRangePicker
					value={value}
					onChange={handleChange}
					aria-label="Tournament date range"
					className="flex-1"
				>
					<Group
						className={fieldGroupStyles({
							class: "bg-white flex items-center text-sm gap-1 w-full",
						})}
					>
						<DateInput slot="start" className={baseInputStyles}>
							{(segment) => (
								<DateSegment segment={segment} className={segmentStyles} />
							)}
						</DateInput>
						<span className="text-gray-500 px-1">–</span>
						<DateInput slot="end" className={baseInputStyles}>
							{(segment) => (
								<DateSegment segment={segment} className={segmentStyles} />
							)}
						</DateInput>
						<Button className="flex items-center px-1 text-gray-600 hover:text-gray-800">
							<CalendarIcon size={16} />
						</Button>
					</Group>
					<Popover>
						<Dialog className="p-4">
							<RangeCalendar className="min-w-[280px]">
								<header className="flex items-center justify-between mb-2">
									<Button
										slot="previous"
										className="rounded-lg hover:bg-gray-200 p-2"
									>
										◀
									</Button>
									<Heading className="font-semibold" />
									<Button
										slot="next"
										className="rounded-lg hover:bg-gray-200 p-2"
									>
										▶
									</Button>
								</header>
								<CalendarGrid className="w-full">
									{(date) => (
										<CalendarCell className={calendarCellStyles} date={date} />
									)}
								</CalendarGrid>
							</RangeCalendar>
						</Dialog>
					</Popover>
				</DateRangePicker>
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
