import {
  queryOptions,
  type UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { type Division, db } from "@/db";

async function readDivisions(includeJuniors = true) {
  return await db.query.divisions.findMany({
    where: includeJuniors ? undefined : (t, { isNull }) => isNull(t.maxAge),
  });
}

const getDivisions = createServerFn({
  method: "GET",
})
  .inputValidator(
    (data: { includeJuniors: boolean } = { includeJuniors: true }) => data,
  )
  .handler(
    async ({ data: { includeJuniors } }) => await readDivisions(includeJuniors),
  );

export const divisionsQueryOptions = (includeJuniors: boolean) =>
  queryOptions({
    queryKey: ["divisions", includeJuniors],
    queryFn: () => getDivisions({ data: { includeJuniors } }),
  });

export function useDivisions<Out = Division[]>(
  options: Omit<
    UseQueryOptions<Division[], unknown, Out>,
    "queryFn" | "queryKey"
  >,
) {
  const fetchDivisions = useServerFn(getDivisions);

  return useQuery({
    ...options,
    queryKey: ["divisions"],
    queryFn: () => fetchDivisions(),
  });
}
