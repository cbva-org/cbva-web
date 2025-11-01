import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/log-in')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/log-in"!</div>
}
