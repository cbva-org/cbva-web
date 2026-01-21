import { db } from "@/db/connection";
import { createProfiles, createUsers } from "@/tests/utils/users";
import { assert, describe, expect, test } from "vitest";
import { getViewerProfilesHandler } from "./get-viewer-profiles";
import { memberships } from "@/db/schema";
import { today } from "@internationalized/date";
import { getDefaultTimeZone } from "@/lib/dates";

describe("getViewerProfiles", () => {
	test("gets membership status", async () => {
		const [user] = await createUsers(db, 1);

		await createProfiles(db, [{ userId: user.id }, { userId: user.id }]);

		const profiles = await getViewerProfilesHandler(user.id);

		assert(profiles.every(({ activeMembership }) => activeMembership === null));

		await db.insert(memberships).values({
			transactionKey: "test",
			purchaserId: user.id,
			profileId: profiles[0].id,
			validUntil: today(getDefaultTimeZone())
				.add({
					years: 1,
				})
				.toString(),
		});

		const [active, inactive] = await getViewerProfilesHandler(user.id);

		expect(active.activeMembership).not.toBeNull();
		expect(inactive.activeMembership).toBeNull();
	});
});
