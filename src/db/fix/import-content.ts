import "dotenv/config";

import { readFileSync } from "node:fs";
import { blocks, pages, type Block } from "../schema";
import { db } from "../connection";

async function main() {
	const keys = ["prize-pool"];

	await db
		.insert(pages)
		.values(
			keys.map((path) => ({
				path,
			})),
		)
		.onConflictDoNothing();

	for (const page of keys) {
		const buffer = readFileSync(`./.export/${page}.json`);

		const parsed = JSON.parse(buffer.toString()) as Block[];

		await db.insert(blocks).values(parsed).onConflictDoNothing();
	}

	process.exit(0);
}

await main();
