import type { Division, Level, TournamentDivision } from "@/db/schema";

export function getLevelDisplay(level: Level | null) {
	return (level?.abbreviated || level?.name)?.toUpperCase() || "N";
}

export function getTournamentDivisionDisplay({
	teamSize,
	gender,
	division: { maxAge, name },
}: Pick<TournamentDivision, "name" | "teamSize" | "gender"> & {
	division: Pick<Division, "maxAge" | "name">;
}) {
	let display = maxAge
		? gender === "male"
			? "Boy's"
			: "Girl's"
		: gender === "male"
			? "Men's"
			: "Women's";

	display += ` ${name === "open" ? "Open" : name.toUpperCase()}`;

	if (teamSize === 4) {
		display += " quads";
	} else if (teamSize === 6) {
		display += " sixes";
	}

	return display;
}
