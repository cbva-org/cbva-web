export function isNotNull<T>(t: T | null): t is T {
  return t !== null;
}

export function isNotNullOrUndefined<T>(t: T | null | undefined): t is T {
  return t !== null && t !== undefined;
}
