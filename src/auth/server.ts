import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "./index";
import type { Session, Viewer } from "./index";

export async function getViewer(): Promise<Viewer | null | undefined> {
  const headers = getRequestHeaders();

  const session = await auth.api.getSession({
    headers,
  });

  return session?.user;
}

export { type Session, type Viewer };