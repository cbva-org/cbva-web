import { createFileRoute } from "@tanstack/react-router"
import { DefaultLayout } from "@/layouts/default"

export const Route = createFileRoute("/")({
  component: App,
})

function App() {
  return (
    <DefaultLayout classNames={{ content: "text-center" }}>Hello</DefaultLayout>
  )
}
