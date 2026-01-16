import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import type { PlayerProfile } from "@/db/schema";
import { tv } from "tailwind-variants";

export type ProfileNameProps = Pick<
	PlayerProfile,
	"id" | "preferredName" | "firstName" | "lastName"
> & {
	className?: string;
	showFirst?: boolean;
	abbreviateLast?: boolean;
	link?: boolean;
};

const lastNameStyles = tv({
	variants: {
		showFirst: {
			true: "hidden sm:inline",
		},
		abbreviateLast: {
			false: "inline",
		},
	},
});

export function ProfileName({
	className,
	id,
	preferredName,
	firstName,
	lastName,
	showFirst = true,
	abbreviateLast = true,
	link = true,
}: ProfileNameProps) {
	const content = (
		<>
			{showFirst ? `${preferredName ? preferredName : firstName} ` : null}

			<span className={lastNameStyles({ showFirst, abbreviateLast })}>
				{lastName}
			</span>

			{showFirst && abbreviateLast && (
				<span className={clsx("sm:hidden")}>{lastName.slice(0, 1)}.</span>
			)}
		</>
	);

	if (link) {
		return (
			<Link
				className={clsx("hover:underline", className)}
				to="/profile/$profileId"
				params={{ profileId: id.toString() }}
			>
				{content}
			</Link>
		);
	}

	return <span className={className}>{content}</span>;
}
