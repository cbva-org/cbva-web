import { createMiddleware } from "@tanstack/react-start";

/**
 * Middleware that logs the duration of a server function or route handler.
 *
 * @param label - Optional label to identify the function in logs
 *
 * @example
 * ```typescript
 * export const myServerFn = createServerFn({ method: "POST" })
 *   .middleware([withTiming("myServerFn")])
 *   .handler(async () => {
 *     // ... your logic
 *   });
 * ```
 *
 * @example
 * ```typescript
 * // In a route file
 * export const Route = createFileRoute("/api/tasks/ratings/rollup")({
 *   server: {
 *     middleware: [withTiming("ratings/rollup")],
 *     handlers: {
 *       POST: async () => { ... }
 *     }
 *   }
 * });
 * ```
 */
export function withTiming(label?: string) {
	return createMiddleware().server(async ({ next }) => {
		const startTime = performance.now();
		const prefix = label ? `[${label}]` : "";

		try {
			const result = await next();
			const duration = performance.now() - startTime;
			console.log(`${prefix} completed in ${duration.toFixed(0)}ms`);
			return result;
		} catch (error) {
			const duration = performance.now() - startTime;
			console.log(`${prefix} failed after ${duration.toFixed(0)}ms`);
			throw error;
		}
	});
}
