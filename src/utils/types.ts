export function isNotNull<T>(t: T | null): t is T {
	return t !== null;
}

export function isNotNullOrUndefined<T>(t: T | null | undefined): t is T {
	return t !== null && t !== undefined;
}

export class ValidationError extends Error {
	kind: string;

	constructor(message: string) {
		super(message);

		this.kind = "validation";
		this.message = message;
	}
}
