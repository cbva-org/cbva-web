import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sanctioning')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/sanctioning"!</div>
}
