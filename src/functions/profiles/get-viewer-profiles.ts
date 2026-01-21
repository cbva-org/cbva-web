import { queryOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { authMiddleware } from "@/auth/shared";
import { db } from "@/db/connection";
import { unauthorized } from "@/lib/responses";
import { Viewer } from "@/auth";

export const getViewerProfilesHandler = createServerOnlyFn(
	async (viewerId: Viewer["id"]) => {
		return await db.query.playerProfiles.findMany({
			with: {
				activeMembership: true,
			},
			where: { userId: viewerId },
			orderBy: {
				createdAt: "asc",
			},
		});
	},
);

const getViewerProfilesFn = createServerFn({
	method: "GET",
})
	.middleware([authMiddleware])
	.handler(({ context: { viewer } }) => {
		if (!viewer) {
			throw unauthorized();
		}

		return getViewerProfilesHandler(viewer.id);
	});

export const getViewerProfilesQueryOptions = () =>
	queryOptions({
		queryKey: ["viewer_profiles"],
		queryFn: () => getViewerProfilesFn(),
	});
