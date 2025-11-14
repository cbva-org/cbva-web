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

export function snake2<P extends { id: number }, B extends { id: number }>(
	participants: P[],
	buckets: B[],
): (B & { participants: P[] })[] {
	const result: (B & { participants: P[] })[] = buckets.map((bucket) => ({
		...bucket,
		participants: [],
	}));

	const rounds = Math.ceil(participants.length / buckets.length);
	let currentIndex = 0;

	for (let round = 0; round < rounds; round++) {
		if (round % 2 === 0) {
			for (let bucket = 0; bucket < buckets.length; bucket++) {
				if (currentIndex < participants.length) {
					result[bucket].participants.push(participants[currentIndex]);
					currentIndex++;
				}
			}
		} else {
			for (let bucket = buckets.length - 1; bucket >= 0; bucket--) {
				if (currentIndex < participants.length) {
					result[bucket].participants.push(participants[currentIndex]);
					currentIndex++;
				}
			}
		}
	}

	return result;
}

export function snakePlayoffs(
	size: number,
	pools: string[],
): [string, number][] {
	const pc = pools.length;

	return Array.from({ length: size / pc }, (_, i) => {
		const currentPools = [...pools];

		if (i % 2 === 1) {
			currentPools.reverse();
		}

		if (pc % 2 === 0 && i > 0) {
			if (i % 2 === 1) {
				// Reverse pairs
				for (let j = 0; j < currentPools.length; j += 2) {
					if (j + 1 < currentPools.length) {
						[currentPools[j], currentPools[j + 1]] = [
							currentPools[j + 1],
							currentPools[j],
						];
					}
				}
			}

			if ((i === 3 || i % 2 === 0) && pc % 4 === 0) {
				// Reverse quads
				for (let j = 0; j < currentPools.length; j += 4) {
					if (j + 3 < currentPools.length) {
						[currentPools[j], currentPools[j + 3]] = [
							currentPools[j + 3],
							currentPools[j],
						];
						[currentPools[j + 1], currentPools[j + 2]] = [
							currentPools[j + 2],
							currentPools[j + 1],
						];
					}
				}
			}
		}

		return currentPools.map((pool) => [pool, i + 1] as [string, number]);
	}).flat();
}
