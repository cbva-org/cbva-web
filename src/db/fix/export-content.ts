import "dotenv/config";

import { blocks } from "../schema";
import { db } from "../connection";
import { eq } from "drizzle-orm";
import { writeFileSync } from "node:fs";

async function main() {
	const juniors = await db
		.select()
		.from(blocks)
		.where(eq(blocks.page, "juniors"));

	writeFileSync("./.export/juniors.json", JSON.stringify(juniors));

	const calCup = await db
		.select()
		.from(blocks)
		.where(eq(blocks.page, "cal-cup"));

	writeFileSync("./.export/cal-cup.json", JSON.stringify(calCup));

	process.exit(0);
}

await main();
