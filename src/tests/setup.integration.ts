import type { MailDataRequired } from "@sendgrid/mail";
import { vi } from "vitest";

vi.mock("@/db/connection", async () => {
	const { getMockDb } = await import("@/tests/db");

	return await getMockDb();
});

vi.mock("@tanstack/react-start/server", () => {
	return {
		getRequestHeaders: () => new Headers(),
		setResponseStatus: () => {},
		getCookies: () => ({}),
		setCookie: () => {},
	};
});

vi.mock("@/auth/server", () => {
	return {
		getViewer: async () => ({
			id: "test-user-id",
			name: "Test User",
			role: "admin",
			email: "test@example.com",
			emailVerified: true,
			phoneNumber: null,
			phoneNumberVerified: false,
			needsPasswordChange: false,
			impersonatedBy: undefined,
		}),
	};
});

vi.mock("@/services/email", () => {
	return {
		sendSms: (message: MailDataRequired) => {
			console.log(message);
		},
	};
});

vi.mock("@/services/sms", () => {
	return {
		sendSms: (to: string, message: string) => {
			console.log({ to, message });
		},
	};
});
