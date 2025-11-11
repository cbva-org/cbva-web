export function snake(spots: number, buckets: number): number[][] {
	const result: number[][] = Array.from({ length: buckets }, () => []);
	const rounds = Math.ceil(spots / buckets);

	let currentSpot = 1;

	for (let round = 0; round < rounds; round++) {
		if (round % 2 === 0) {
			for (let bucket = 0; bucket < buckets; bucket++) {
				if (currentSpot <= spots) {
					result[bucket].push(currentSpot);
					currentSpot++;
				}
			}
		} else {
			for (let bucket = buckets - 1; bucket >= 0; bucket--) {
				if (currentSpot <= spots) {
					result[bucket].push(currentSpot);
					currentSpot++;
				}
			}
		}
	}

	return result;
}
