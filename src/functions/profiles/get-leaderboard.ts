import { db } from "@/db/connection";
import { findPaged } from "@/db/pagination";
import { publicProfileColumns } from "@/db/schema";
import { genderSchema } from "@/db/schema/shared";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

export const juniorsDivisionSchema = z.xor([
	z.literal(12),
	z.literal(14),
	z.literal(16),
	z.literal(18),
	z.literal(true),
]);

export const getLeaderboardSchema = z.object({
	gender: genderSchema.optional(),
	query: z.string().optional(),
	levels: z.array(z.number()).optional(),
	// juniors: z.enum(["12", "14", "16", "18"]).optional(),
	juniors: z
		.xor([
			z.literal(12),
			z.literal(14),
			z.literal(16),
			z.literal(18),
			z.literal(true),
		])
		.optional(),
	page: z.number(),
	pageSize: z.number(),
});

// Divisions go by high school graduation year and update 9/1. Until 9/1/26, they are:
//
// 12u: 2032 or after
// 14u: 2030 or after
// 16u: 2028 or after
// 18u: 2026 or after

const juniorsGraduationYear: Record<string, number> = {
	true: 2026,
	"12": 2032,
	"14": 2030,
	"16": 2028,
	"18": 2026,
};

export const getLeaderboardFn = createServerFn()
	.inputValidator(getLeaderboardSchema)
	.handler(({ data: { query, gender, levels, juniors, page, pageSize } }) => {
		const minGraduationYear = juniors
			? juniorsGraduationYear[juniors === true ? "true" : juniors]
			: undefined;

		return findPaged(db, "playerProfiles", {
			paging: {
				page,
				size: pageSize,
			},
			countColumn: "id",
			query: {
				columns: publicProfileColumns,
				with: {
					level: true,
				},
				where: {
					gender,
					levelId:
						levels && levels.length > 0
							? {
									in: levels,
								}
							: undefined,
					highSchoolGraduationYear: minGraduationYear
						? { gte: minGraduationYear }
						: undefined,
					RAW: query
						? (t, { sql, ilike }) =>
								ilike(
									sql`
                  CASE
                    WHEN ${t.preferredName} IS NOT NULL and ${t.preferredName} != ''
                    THEN ${t.preferredName} || ' ' || ${t.lastName}
                    ELSE ${t.firstName} || ' ' || ${t.lastName}
                  END
                  `,
									`%${query}%`,
								)
						: undefined,
				},
				orderBy: (t, { asc }) => [
					asc(t.rank),
					asc(juniors ? t.juniorsPoints : t.ratedPoints),
				],
			},
		});
	});

export const getLeaderboardQueryOptions = (
	data: z.infer<typeof getLeaderboardSchema>,
) =>
	queryOptions({
		queryKey: ["getLeaderboardQueryOptions", JSON.stringify(data)],
		queryFn: () => getLeaderboardFn({ data }),
	});
