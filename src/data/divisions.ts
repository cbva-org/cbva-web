import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"

import { db } from "@/db/connection"

async function readDivisions(includeJuniors = true) {
  return await db.query.divisions.findMany({
    where: includeJuniors ? undefined : (t, { isNull }) => isNull(t.maxAge),
  })
}

const getDivisions = createServerFn({
  method: "GET",
})
  .inputValidator(
    (data: { includeJuniors?: boolean } = { includeJuniors: true }) => data
  )
  .handler(async ({ data: { includeJuniors } }) => {
    return await readDivisions(includeJuniors)
  })

export const divisionsQueryOptions = (includeJuniors?: boolean) =>
  queryOptions({
    queryKey: ["divisions", includeJuniors],
    queryFn: () => getDivisions({ data: { includeJuniors } }),
  })
