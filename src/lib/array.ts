export function withoutItem<T>(arr: T[], a: T): T[] {
	return arr.filter((b) => a !== b);
}
