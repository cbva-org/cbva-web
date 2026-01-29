import "dotenv/config";

import { blocks } from "../schema";
import { db } from "../connection";
import { eq } from "drizzle-orm";
import { writeFileSync } from "node:fs";

async function main() {
	const pages = ["prize-pool"];

	for (const page of pages) {
		const block = await db.select().from(blocks).where(eq(blocks.page, page));

		writeFileSync(`./.export/${page}.json`, JSON.stringify(block));
	}

	process.exit(0);
}

await main();
