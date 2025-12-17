import { createFileRoute } from "@tanstack/react-router";
import { internalServerError } from "@/lib/responses";
import { getSupabaseServerClient } from "@/supabase/server";
import { isNotNullOrUndefined } from "@/utils/types";

async function walk(
	supabase: ReturnType<typeof getSupabaseServerClient>,
	bucketName: string,
	path?: string,
) {
	const files = await supabase.storage.from(bucketName).list(path);
	if (files.error) {
		throw internalServerError(files.error.message);
	}

	const paths: { path: string; createdAt: string; updatedAt: string }[] = [];

	for (const file of files.data) {
		const currPath = [path, file.name].filter(isNotNullOrUndefined).join("/");
		if (file.id === null) {
			const sub = await walk(supabase, bucketName, currPath);

			paths.push(...sub);
		} else {
			paths.push({
				path: currPath,
				createdAt: file.created_at,
				updatedAt: file.updated_at,
			});
		}
	}

	return paths;
}

const bucketLookupPaths: { [key: string]: string[] } = {
	venues: ["headerImageSource", "thumbnailImageSource"],
};

async function cleanupBucket(
	supabase: ReturnType<typeof getSupabaseServerClient>,
	bucketName: string,
	objects: { path: string; createdAt: string; updatedAt: string }[],
) {
	const lookupPaths = bucketLookupPaths[bucketName];

	// ...
}

export const Route = createFileRoute("/api/tasks/cleanup/storage")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				// TODO:
				// - read all objects in each bucket
				// - check each location a file is stored to see if it is referenced
				// - if not, delete the objects

				const supabase = getSupabaseServerClient();

				const result = await supabase.storage.listBuckets();
				if (result.error) {
					throw internalServerError(result.error.message);
				}

				for (const bucket of result.data) {
					const paths = await walk(supabase, bucket.name);

					console.log(bucket.name, paths);
				}

				return new Response(JSON.stringify({ success: true }), {
					headers: {
						"Content-Type": "application/json",
					},
				});
			},
		},
	},
});

// ---------------------------------
