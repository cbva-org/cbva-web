import "dotenv/config";

import { createClient } from "gel";
import { groupBy, sortBy } from "lodash-es";
import { v4 as uuidv4 } from "uuid";
import { db } from "../connection";
import { accounts, playerProfiles, users } from "../schema";

interface LegacyUser {
	id: string;
	first_name: string;
	last_name: string;
	legal_name: string;
	birthdate: { toString(): string };
	gender: "Male" | "Female";
	email: string;
	phone: string;
	created: string;
}

async function main() {
	console.log("Connecting to legacy EdgeDB...");

	const legacy = createClient({
		instanceName: "legacy",
		tlsSecurity: "insecure",
	});

	console.log("Connected to legacy DB");

	console.log("Fetching legacy users...");

	const legacyUsers = await legacy.query<LegacyUser>(`
		select User {
			id,
			first_name,
			last_name,
			legal_name,
			birthdate,
			gender,
			email,
			phone,
			created,
		}
	`);

	console.log(`Found ${legacyUsers.length} legacy users`);

	// Fetch all existing profiles by externalRef
	console.log("Fetching current player profiles...");

	const currentProfiles = await db.query.playerProfiles.findMany({
		where: { externalRef: { isNotNull: true } },
		columns: {
			externalRef: true,
		},
	});

	// Fetch existing users and their phone numbers/emails
	const existingUsers = await db.query.users.findMany({
		columns: {
			id: true,
			email: true,
			phoneNumber: true,
		},
	});

	const existingUserIds = new Set(existingUsers.map((u) => u.id));
	const existingEmails = new Set(existingUsers.map((u) => u.email));
	const existingPhones = new Set(existingUsers.map((u) => u.phoneNumber));

	console.log(`Found ${currentProfiles.length} current profiles`);

	// Create lookup set of existing externalRefs
	const existingRefs = new Set(currentProfiles.map((p) => p.externalRef));

	// Find missing users
	const missingLegacyUsers = legacyUsers.filter((u) => !existingRefs.has(u.id));

	console.log(`Found ${missingLegacyUsers.length} missing users`);

	if (missingLegacyUsers.length === 0) {
		console.log("No missing users to add");
		return;
	}

	// Group missing users by email (one user account can have multiple profiles)
	const userGroups = groupBy(missingLegacyUsers, "email");

	const usersToCreate: (typeof users.$inferInsert)[] = [];
	const accountsToCreate: (typeof accounts.$inferInsert)[] = [];
	const profilesToCreate: (typeof playerProfiles.$inferInsert)[] = [];

	for (const email of Object.keys(userGroups)) {
		const profiles = sortBy(userGroups[email], "created");
		const [accountUser] = profiles;

		// Skip if this user account already exists (by ID or email)
		if (existingUserIds.has(accountUser.id) || existingEmails.has(accountUser.email)) {
			// User exists, just add the profiles (linked to existing user if we can find them)
			const existingUserId = existingUserIds.has(accountUser.id)
				? accountUser.id
				: existingUsers.find((u) => u.email === accountUser.email)?.id;

			for (const user of profiles) {
				profilesToCreate.push({
					userId: existingUserId,
					firstName: user.first_name,
					lastName: user.last_name,
					birthdate: user.birthdate.toString(),
					gender: user.gender.toLowerCase() as "male" | "female",
					externalRef: user.id,
				});
			}
			continue;
		}

		// Create user account
		usersToCreate.push({
			id: accountUser.id,
			name: accountUser.legal_name,
			email: accountUser.email === "" ? `empty:${uuidv4()}` : accountUser.email,
			emailVerified: true,
			phoneNumber:
				accountUser.phone === "" ? `empty:${uuidv4()}` : accountUser.phone,
			phoneNumberVerified: false,
			role: "user",
			createdAt: new Date(accountUser.created),
		});

		// Create account record
		accountsToCreate.push({
			id: uuidv4(),
			userId: accountUser.id,
			accountId: accountUser.id,
			providerId: "credential",
			createdAt: new Date(accountUser.created),
			updatedAt: new Date(),
		});

		// Create profiles for all users in this group
		for (const user of profiles) {
			profilesToCreate.push({
				userId: accountUser.id,
				firstName: user.first_name,
				lastName: user.last_name,
				birthdate: user.birthdate.toString(),
				gender: user.gender.toLowerCase() as "male" | "female",
				externalRef: user.id,
			});
		}
	}

	// Handle duplicate phone numbers
	const duplicatePhones = groupBy(usersToCreate, "phoneNumber");

	console.log(`Creating ${usersToCreate.length} user accounts...`);
	if (usersToCreate.length > 0) {
		await db.insert(users).values(
			usersToCreate.map((user) => ({
				...user,
				phoneNumber:
					(duplicatePhones[user.phoneNumber ?? ""]?.length ?? 0) > 1 ||
					existingPhones.has(user.phoneNumber)
						? `duplicate:${uuidv4()}`
						: user.phoneNumber,
				phoneNumberVerified:
					(duplicatePhones[user.phoneNumber ?? ""]?.length ?? 0) > 1 ||
					existingPhones.has(user.phoneNumber)
						? false
						: user.phoneNumberVerified,
			})),
		);
	}

	console.log(`Creating ${accountsToCreate.length} accounts...`);
	if (accountsToCreate.length > 0) {
		await db.insert(accounts).values(accountsToCreate);
	}

	console.log(`Creating ${profilesToCreate.length} profiles...`);
	if (profilesToCreate.length > 0) {
		await db.insert(playerProfiles).values(profilesToCreate);
	}

	console.log("\nAdded profiles:");
	for (const profile of profilesToCreate) {
		console.log(`  - ${profile.firstName} ${profile.lastName}`);
	}
}

await main();

process.exit(0);
