import { getViewer } from "@/auth/server";
import { db } from "@/db/connection";
import { playerProfiles, updatePlayerProfileSchema } from "@/db/schema";
import { forbidden, notFound } from "@/lib/responses";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";

const updateProfileSchema = updatePlayerProfileSchema.extend({
	id: z.number(),
});

export const updateProfileFn = createServerFn({ method: "POST" })
	.inputValidator(updateProfileSchema)
	.handler(async ({ data }) => {
		const viewer = await getViewer();

		if (!viewer) {
			throw new Error("UNAUTHENTICATED");
		}

		const {
			id,
			preferredName,
			gender,
			bio,
			imageSource,
			heightFeet,
			heightInches,
			dominantArm,
			preferredRole,
			preferredSide,
			club,
			highSchoolGraduationYear,
			collegeTeam,
			collegeTeamYearsParticipated,
		} = data;

		const profile = await db._query.playerProfiles.findFirst({
			columns: {
				userId: true,
			},
			where: (t, { eq }) => eq(t.id, id),
		});

		if (!profile) {
			throw notFound();
		}

		if (viewer.role !== "admin" && viewer.id !== profile.userId) {
			throw forbidden();
		}

		const [result] = await db
			.update(playerProfiles)
			.set({
				preferredName,
				gender,
				bio,
				imageSource,
				heightFeet,
				heightInches,
				dominantArm,
				preferredRole,
				preferredSide,
				club,
				highSchoolGraduationYear,
				collegeTeam,
				collegeTeamYearsParticipated,
			})
			.where(eq(playerProfiles.id, id))
			.returning({
				id: playerProfiles.id,
			});

		return result;
	});

export const updateProfileMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof updateProfileSchema>) =>
			updateProfileFn({ data }),
	});
