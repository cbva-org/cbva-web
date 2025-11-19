import { groupBy, sortBy } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { db, schema } from "../connection";
import { legacy } from "../legacy";
import type { PlayerProfile } from "../schema";
import { mapDivision } from "./shared";

export async function importUsers(levels: Map<string, number>) {
	const hasMore = true;
	const offset = 0;

	const existing = (
		await db.query.users.findMany({
			columns: {
				id: true,
			},
		})
	).map(({ id }) => id);

	while (hasMore) {
		const legacyUsers = await legacy.query.users.findMany({
			with: {
				phoneVerifications: true,
			},
			where: (t, { and, not, inArray }) =>
				and(
					not(inArray(t.id, existing)),
					not(inArray(t.username, ["kempervball", "cjpkxwysetztmzq"])),
				),
			limit: 5000,
			offset,
		});

		const userProfileGroups = groupBy(legacyUsers, "email");

		const info: {
			user: typeof schema.users.$inferInsert;
			account: typeof schema.accounts.$inferInsert;
			profiles: (typeof schema.playerProfiles.$inferInsert)[];
		}[] = Object.keys(userProfileGroups).map((email) => {
			const profiles = sortBy(userProfileGroups[email], "created");

			const [accountUser] = profiles;

			return {
				user: {
					id: accountUser.id,
					name: accountUser.legalName,
					email: accountUser.email,
					emailVerified: true,
					phone: accountUser.phone === "" ? uuidv4() : accountUser.phone,
					phoneVerified: accountUser.phoneVerifications.some(
						({ phone }) => phone === accountUser.phone,
					),
					role: "user",
				},
				account: {
					id: uuidv4(),
					userId: accountUser.id,
					accountId: accountUser.id,
					providerId: "credential",
					createdAt: new Date(accountUser.created.toString()),
					updatedAt: new Date(),
				},
				profiles: profiles.map((user) => ({
					userId: accountUser.id,
					firstName: user.firstName,
					preferredName:
						user.username === "sinjinjr" ? "Sinjin Jr." : user.firstName,
					lastName: user.lastName,
					birthdate: user.birthdate.toString(),
					gender: user.gender.toLowerCase() as PlayerProfile["gender"],
					levelId: levels.get(mapDivision(user.rating)),
					ratedPoints: user.ratedPoints,
					juniorsPoints: user.juniorsPoints,
					rank: user.rank,
					externalRef: user.id,
				})),
			};
		});

		const usersToCreate: (typeof schema.users.$inferInsert)[] = info.map(
			({ user }) => user,
		);

		const accountsToCreate: (typeof schema.accounts.$inferInsert)[] = info.map(
			({ account }) => account,
		);

		const profilesToCreate: (typeof schema.playerProfiles.$inferInsert)[] =
			info.flatMap(({ profiles }) => profiles);

		await db.transaction(async (txn) => {
			await txn.insert(schema.users).values(usersToCreate);
			await txn.insert(schema.accounts).values(accountsToCreate);
			await txn.insert(schema.playerProfiles).values(profilesToCreate);
		});

		// const usersToCreate: (typeof schema.users.$inferInsert)[] = legacyUsers.map(
		// 	(user) => ({
		// 		id: user.id,
		// 		name: user.legalName,
		// 		email: user.email,
		// 		emailVerified: true,
		// 		phone: user.phone,
		// 		phoneVerified: user.phoneVerifications.some(
		// 			({ phone }) => phone === user.phone,
		// 		),
		// 		role: "user",
		// 	}),
		// );

		// const accountsToCreate: (typeof schema.accounts.$inferInsert)[] =
		// 	legacyUsers.map((user) => ({
		// 		id: uuidv4(),
		// 		userId: user.id,
		// 		accountId: user.id,
		// 		providerId: "credential",
		// 		createdAt: new Date(user.created.toString()),
		// 		updatedAt: new Date(),
		// 	}));

		existing.push(...legacyUsers.map(({ id }) => id));
	}
}
