import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/auth/shared";
import { db } from "@/db/connection";
import { unauthorized } from "@/lib/responses";

const getViewerProfiles = createServerFn({
	method: "GET",
})
	.middleware([authMiddleware])
	.handler(async ({ context: { viewer } }) => {
		if (!viewer) {
			throw unauthorized();
		}

		return await db.query.playerProfiles.findMany({
			where: { userId: viewer.id },
		});
	});

export const getViewerProfilesQueryOptions = () =>
	queryOptions({
		queryKey: ["viewer_profiles"],
		queryFn: () => getViewerProfiles(),
	});
