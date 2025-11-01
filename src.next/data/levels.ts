import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";

const getLevels = createServerFn({
  method: "GET",
}).handler(
  async () =>
    await db.query.levels.findMany({
      orderBy: (t, { desc }) => desc(t.order),
    }),
);

export const levelsQueryOptions = () =>
  queryOptions({
    queryKey: ["levels"],
    queryFn: () => getLevels(),
  });
