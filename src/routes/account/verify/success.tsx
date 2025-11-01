import { createFileRoute } from "@tanstack/react-router";
import { useNotLoggedInRedirect, useRedirect, useViewer } from "@/hooks/auth";

export const Route = createFileRoute("/account/verify/success")({
  component: RouteComponent,
});

function RouteComponent() {
  const viewer = useViewer();

  useNotLoggedInRedirect("/log-in");

  useRedirect("/account/setup", viewer !== undefined && !viewer?.role);
  useRedirect("/account", Boolean(viewer?.role));

  return <div />;
}
