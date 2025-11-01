import {
  queryOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { createServerFn, useServerFn } from "@tanstack/react-start"

import type { Viewer } from "@/auth"
import { getViewer } from "@/auth/server"
import { db } from "@/db/connection"
import {
  type CreatePlayerProfile,
  createPlayerProfileSchema,
  playerProfiles,
  selectPlayerProfileSchema,
  updatePlayerProfileSchema,
} from "@/db/schema/player-profiles"

async function readViewerProfiles(userId: Viewer["id"]) {
  return await db.query.playerProfiles.findMany({
    where: (t, { eq }) => eq(t.userId, userId),
  })
}

const getViewerProfiles = createServerFn({
  method: "GET",
}).handler(async () => {
  const viewer = await getViewer()

  if (!viewer) {
    throw new Error("UNAUTHENTICATED")
  }

  return await readViewerProfiles(viewer.id)
})

export const viewerProfileQueryOptions = () =>
  queryOptions({
    queryKey: ["viewer_profiles"],
    queryFn: () => getViewerProfiles(),
  })

export const insertPlayerProfileFn = createServerFn({ method: "POST" })
  .inputValidator(createPlayerProfileSchema)
  .handler(async ({ data }) => {
    const viewer = await getViewer()

    if (!viewer) {
      throw new Error("UNAUTHENTICATED")
    }

    await db.insert(playerProfiles).values({
      ...data,
      userId: viewer.id,
    })
  })

export function useInsertPlayerProfile() {
  const mutationFn = useServerFn(insertPlayerProfileFn)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePlayerProfile) => {
      return mutationFn({ data: input })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["viewer_profiles"],
      })
    },
  })
}

async function readProfile(id: number, viewerId: Viewer["id"]) {
  const result = await db.query.playerProfiles.findFirst({
    where: (t, { eq, and }) => and(eq(t.id, id), eq(t.userId, viewerId)),
  })

  if (!result) {
    throw new Error("NOT_FOUND")
  }

  return result
}

const getProfile = createServerFn({
  method: "GET",
})
  .inputValidator(selectPlayerProfileSchema.pick({ id: true }))
  .handler(async ({ data: { id } }) => {
    const viewer = await getViewer()

    if (!viewer) {
      throw new Error("UNAUTHENTICATED")
    }

    return await readProfile(id, viewer.id)
  })

export const profileQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["profile", id],
    queryFn: () => getProfile({ data: { id } }),
  })

export const updatePlayerProfileFn = createServerFn({ method: "POST" })
  .inputValidator(updatePlayerProfileSchema)
  .handler(async ({ data }) => {
    const viewer = await getViewer()

    if (!viewer) {
      throw new Error("UNAUTHENTICATED")
    }

    const {
      preferredName,
      gender,
      bio,
      imageSource,
      heightFeet,
      heightInches,
      dominantArm,
      preferredRole,
      preferredSide,
      club,
      highSchoolGraduationYear,
      collegeTeam,
      collegeTeamYearsParticipated,
    } = data

    const [result] = await db
      .update(playerProfiles)
      .set({
        preferredName,
        gender,
        bio,
        imageSource,
        heightFeet,
        heightInches,
        dominantArm,
        preferredRole,
        preferredSide,
        club,
        highSchoolGraduationYear,
        collegeTeam,
        collegeTeamYearsParticipated,
      })
      .returning({
        id: playerProfiles.id,
      })

    return result
  })

export function useUpdatePlayerProfile() {
  const mutationFn = useServerFn(updatePlayerProfileFn)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePlayerProfile) => {
      return mutationFn({ data: input })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["viewer_profiles"],
      })

      queryClient.invalidateQueries({
        queryKey: ["profile", data.id],
      })
    },
  })
}
