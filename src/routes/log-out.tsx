import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useAsyncEffect } from "ahooks"

import { authClient } from "@/auth/client"

export const Route = createFileRoute("/log-out")({
  beforeLoad: async () => {},
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  useAsyncEffect(async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: "/log-in" })
        },
      },
    })
  }, [navigate])

  return null
}
