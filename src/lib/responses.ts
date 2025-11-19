import { notFound as notFoundResult } from "@tanstack/react-router";
import { setResponseStatus } from "@tanstack/react-start/server";

export function badRequest(message?: string) {
	setResponseStatus(400);

	return new Error(message || "BAD_REQUEST");
}

export function notFound() {
	setResponseStatus(404);

	throw notFoundResult();
}
