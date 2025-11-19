import { notFound as notFoundResult } from "@tanstack/react-router";
import { setResponseStatus } from "@tanstack/react-start/server";

export function badRequest(message = "BAD_REQUEST") {
	setResponseStatus(400);

	return new Error(message);
}

export function notFound() {
	setResponseStatus(404);

	throw notFoundResult();
}

export function internalServerError(message: string) {
	setResponseStatus(500);

	// Error message is for internal usage.
	console.log("INTERNAL_SERVER_ERROR:", message);

	throw new Error("Internal Server Error");
}
