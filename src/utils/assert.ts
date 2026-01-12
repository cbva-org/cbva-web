import { isDefined } from "./types";

export function assert<T>(
	value: T | null | undefined | false,
	message?: string,
): asserts value is T {
	if (!isDefined(value) || value === false) {
		throw new Error(message || `assertion failed with value: ${typeof value}`);
	}
}
