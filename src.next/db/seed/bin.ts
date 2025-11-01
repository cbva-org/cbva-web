import { db } from "../connection";

import { pages } from "../schema";
import { example } from "./claude";
import { seedRatingsPage } from "./lexical";

async function main() {
  await db
    .insert(pages)
    .values([
      {
        path: "ratings",
      },
      {
        path: "juniors",
      },
    ])
    .onConflictDoNothing();

  // await example();
  await seedRatingsPage();
  // await seedRatingsPage2();
}

main()
  .then(() => {
    console.log("success");

    process.exit(0);
  })
  .catch((err) => {
    console.error(err);

    process.exit(1);
  });
