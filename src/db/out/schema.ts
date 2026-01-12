import { pgEnum, pgTable, serial, text, integer, varchar, jsonb, timestamp, customType, date, boolean, time, bigint, uuid, doublePrecision, index, foreignKey, primaryKey, unique, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const role = pgEnum("role", ["user", "td", "admin", "superadmin"])
export const gender = pgEnum("gender", ["male", "female", "coed"])
export const matchStatus = pgEnum("match_status", ["scheduled", "in_progress", "completed", "cancelled"])
export const playerRole = pgEnum("player_role", ["blocker", "defender"])
export const rightLeft = pgEnum("right_left", ["right", "left"])
export const setStatus = pgEnum("set_status", ["not_started", "in_progress", "completed"])
export const teamStatus = pgEnum("team_status", ["registered", "waitlisted", "confirmed", "cancelled", "withdraw", "late-withdraw"])
export const tournamentStatus = pgEnum("tournament_status", ["closed", "running", "paused", "complete"])
export const venueStatus = pgEnum("venue_status", ["active", "hidden", "legacy"])


export const accounts = pgTable("accounts", {
	id: text().primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const blocks = pgTable("blocks", {
	key: text().primaryKey(),
	content: jsonb(),
	page: text().notNull().references(() => pages.path),
});

export const directors = pgTable("directors", {
	id: serial().primaryKey(),
	profileId: integer("profile_id").notNull().references(() => playerProfiles.id, { onDelete: "cascade" } ),
	email: text(),
	phoneNumber: text("phone_number"),
	externalRef: uuid("external_ref"),
}, (table) => [
	unique("directors_profileId_unique").on(table.profileId),]);

export const divisions = pgTable("divisions", {
	id: serial().primaryKey(),
	name: text().notNull(),
	display: text(),
	order: integer().notNull(),
	maxAge: integer("max_age"),
}, (table) => [
	unique("divisions_name_unique").on(table.name),]);

export const files = pgTable("files", {
	id: serial().primaryKey(),
	bytes: customType({ dataType: () => 'bytea' })().notNull(),
});

export const levels = pgTable("levels", {
	id: serial().primaryKey(),
	name: text().notNull(),
	abbreviated: text(),
	order: integer().notNull(),
}, (table) => [
	unique("levels_name_unique").on(table.name),]);

export const matchRefTeams = pgTable("match_ref_teams", {
	id: serial().primaryKey(),
	poolMatchId: integer("pool_match_id").references(() => poolMatches.id, { onDelete: "cascade" } ),
	playoffMatchId: integer("playoff_match_id").references(() => playoffMatches.id, { onDelete: "cascade" } ),
	teamId: integer("team_id").notNull().references(() => tournamentDivisionTeams.id, { onDelete: "cascade" } ),
	abandoned: boolean(),
}, (table) => [
	index("match_ref_teams_playoff_match_idx").using("btree", table.playoffMatchId.asc().nullsLast()),
	index("match_ref_teams_pool_match_idx").using("btree", table.poolMatchId.asc().nullsLast()),
check("match_ref_teams_type_exclusive", sql`(((pool_match_id IS NOT NULL) AND (playoff_match_id IS NULL)) OR ((pool_match_id IS NULL) AND (playoff_match_id IS NOT NULL)))`),]);

export const matchSets = pgTable("match_sets", {
	id: serial().primaryKey(),
	poolMatchId: integer("pool_match_id").references(() => poolMatches.id, { onDelete: "cascade" } ),
	playoffMatchId: integer("playoff_match_id").references(() => playoffMatches.id, { onDelete: "cascade" } ),
	setNumber: integer("set_number").notNull(),
	teamAScore: integer("team_a_score").default(0).notNull(),
	teamBScore: integer("team_b_score").default(0).notNull(),
	winScore: integer("win_score").default(21).notNull(),
	winnerId: integer("winner_id").references(() => tournamentDivisionTeams.id, { onDelete: "cascade" } ),
	status: setStatus().default("not_started").notNull(),
	startedAt: timestamp("started_at"),
	endedAt: timestamp("ended_at"),
	externalRef: uuid("external_ref"),
}, (table) => [
	index("match_sets_playoff_match_idx").using("btree", table.playoffMatchId.asc().nullsLast()),
	index("match_sets_pool_match_idx").using("btree", table.poolMatchId.asc().nullsLast()),
	unique("match_sets_externalRef_unique").on(table.externalRef),check("match_type_exclusive", sql`(((pool_match_id IS NOT NULL) AND (playoff_match_id IS NULL)) OR ((pool_match_id IS NULL) AND (playoff_match_id IS NOT NULL)))`),check("set_number_positive", sql`(set_number > 0)`),]);

export const pages = pgTable("pages", {
	path: text().primaryKey(),
});

export const playerProfiles = pgTable("player_profiles", {
	id: serial().primaryKey(),
	userId: text("user_id").references(() => users.id, { onDelete: "set null" } ),
	firstName: text("first_name").notNull(),
	preferredName: text("preferred_name"),
	lastName: text("last_name").notNull(),
	birthdate: date().notNull(),
	gender: gender().notNull(),
	levelId: integer("level_id").references(() => levels.id, { onDelete: "set null" } ),
	ratedPoints: doublePrecision("rated_points").default(0).notNull(),
	juniorsPoints: doublePrecision("juniors_points").default(0).notNull(),
	rank: integer(),
	bio: text(),
	imageSource: text("image_source"),
	heightFeet: integer("height_feet"),
	heightInches: integer("height_inches"),
	dominantArm: rightLeft("dominant_arm"),
	preferredRole: playerRole("preferred_role"),
	preferredSide: rightLeft("preferred_side"),
	club: text(),
	highSchoolGraduationYear: integer("high_school_graduation_year"),
	collegeTeam: text("college_team"),
	collegeTeamYearsParticipated: integer("college_team_years_participated"),
	externalRef: uuid("external_ref").defaultRandom().notNull(),
}, (table) => [
	unique("player_profiles_externalRef_unique").on(table.externalRef),check("height_feet_check", sql`((height_feet >= 0) AND (height_feet <= 8))`),check("height_inches_check", sql`((height_inches >= 0) AND (height_inches < 12))`),]);

export const playoffMatches = pgTable("playoff_matches", {
	id: serial().primaryKey(),
	tournamentDivisionId: integer("tournament_division_id").notNull().references(() => tournamentDivisions.id, { onDelete: "cascade" } ),
	round: integer().default(-1).notNull(),
	matchNumber: integer("match_number").notNull(),
	court: text(),
	teamAId: integer("team_a_id").references(() => tournamentDivisionTeams.id),
	teamBId: integer("team_b_id").references(() => tournamentDivisionTeams.id),
	teamAPoolId: integer("team_a_pool_id").references(() => pools.id, { onDelete: "cascade" } ),
	teamBPoolId: integer("team_b_pool_id").references(() => pools.id, { onDelete: "cascade" } ),
	teamAPreviousMatchId: integer("team_a_previous_match_id"),
	teamBPreviousMatchId: integer("team_b_previous_match_id"),
	scheduledTime: timestamp("scheduled_time"),
	status: matchStatus().default("scheduled").notNull(),
	winnerId: integer("winner_id").references(() => tournamentDivisionTeams.id),
	nextMatchId: integer("next_match_id"),
	externalRef: uuid("external_ref"),
}, (table) => [
	foreignKey({
		columns: [table.nextMatchId],
		foreignColumns: [table.id],
		name: "playoff_matches_next_match_id_playoff_matches_id_fk"
	}),
	foreignKey({
		columns: [table.teamAPreviousMatchId],
		foreignColumns: [table.id],
		name: "playoff_matches_team_a_previous_match_id_playoff_matches_id_fk"
	}),
	foreignKey({
		columns: [table.teamBPreviousMatchId],
		foreignColumns: [table.id],
		name: "playoff_matches_team_b_previous_match_id_playoff_matches_id_fk"
	}),
	index("playoff_matches_team_a_idx").using("btree", table.teamAId.asc().nullsLast()),
	index("playoff_matches_team_b_idx").using("btree", table.teamBId.asc().nullsLast()),
	index("playoff_matches_tournament_division_idx").using("btree", table.tournamentDivisionId.asc().nullsLast()),
	unique("playoff_matches_externalRef_unique").on(table.externalRef),check("team_a_team_b_different_or_null", sql`((team_a_id <> team_b_id) OR ((team_a_id IS NULL) AND (team_b_id IS NULL)))`),]);

export const poolMatches = pgTable("pool_matches", {
	id: serial().primaryKey(),
	poolId: integer("pool_id").notNull().references(() => pools.id, { onDelete: "cascade" } ),
	matchNumber: integer("match_number").notNull(),
	court: text(),
	teamAId: integer("team_a_id").references(() => tournamentDivisionTeams.id, { onDelete: "cascade" } ),
	teamBId: integer("team_b_id").references(() => tournamentDivisionTeams.id, { onDelete: "cascade" } ),
	scheduledTime: time("scheduled_time"),
	status: matchStatus().default("scheduled").notNull(),
	winnerId: integer("winner_id").references(() => tournamentDivisionTeams.id),
	externalRef: uuid("external_ref"),
}, (table) => [
	index("pool_matches_pool_idx").using("btree", table.poolId.asc().nullsLast()),
	index("pool_matches_team_a_idx").using("btree", table.teamAId.asc().nullsLast()),
	index("pool_matches_team_b_idx").using("btree", table.teamBId.asc().nullsLast()),
	unique("pool_matches_externalRef_unique").on(table.externalRef),	unique("pool_matches_pool_id_match_number").on(table.poolId, table.matchNumber),check("team_a_team_a_different", sql`(((team_a_id IS NULL) AND (team_b_id IS NULL)) OR (team_a_id <> team_b_id))`),]);

export const poolTeams = pgTable("pool_teams", {
	id: serial().primaryKey(),
	poolId: integer("pool_id").notNull().references(() => pools.id, { onDelete: "cascade" } ),
	teamId: integer("team_id").notNull().references(() => tournamentDivisionTeams.id, { onDelete: "cascade" } ),
	seed: integer(),
	finish: integer(),
}, (table) => [
	index("pool_teams_pool_idx").using("btree", table.poolId.asc().nullsLast()),
	index("pool_teams_team_idx").using("btree", table.teamId.asc().nullsLast()),
	unique("pool_team_unique").on(table.poolId, table.teamId),]);

export const pools = pgTable("pools", {
	id: serial().primaryKey(),
	name: text().notNull(),
	tournamentDivisionId: integer("tournament_division_id").notNull().references(() => tournamentDivisions.id, { onDelete: "cascade" } ),
	court: text(),
	done: boolean().default(false).notNull(),
	externalRef: uuid("external_ref"),
}, (table) => [
	unique("pool_tournament_division_name_unique").on(table.tournamentDivisionId, table.name),	unique("pools_externalRef_unique").on(table.externalRef),]);

export const projects = pgTable("projects", {
	id: serial().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	sharedUserIds: text("shared_user_ids").array().default([]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
	ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
});

export const rateLimiterFlexible = pgTable("rate_limiter_flexible", {
	key: text().primaryKey(),
	points: integer().notNull(),
	expire: timestamp(),
});

export const rateLimits = pgTable("rate_limits", {
	id: text().primaryKey(),
	key: text().notNull(),
	count: integer().notNull(),
	lastRequest: bigint("last_request", { mode: 'number' }).notNull(),
}, (table) => [
	unique("rate_limits_key_unique").on(table.key),]);

export const sessions = pgTable("sessions", {
	id: text().primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	impersonatedBy: text("impersonated_by").references(() => users.id),
}, (table) => [
	unique("sessions_token_unique").on(table.token),]);

export const teamPlayers = pgTable("team_players", {
	id: serial().primaryKey(),
	teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" } ),
	playerProfileId: integer("player_profile_id").notNull().references(() => playerProfiles.id, { onDelete: "cascade" } ),
}, (table) => [
	index("team_players_player_idx").using("btree", table.playerProfileId.asc().nullsLast()),
	index("team_players_team_idx").using("btree", table.teamId.asc().nullsLast()),
	unique("team_player_unique").on(table.teamId, table.playerProfileId),]);

export const teams = pgTable("teams", {
	id: serial().primaryKey(),
	name: text(),
});

export const todos = pgTable("todos", {
	id: serial().primaryKey(),
	text: varchar({ length: 500 }).notNull(),
	completed: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	projectId: serial("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	userIds: text("user_ids").array().default([]).notNull(),
});

export const tournamentDirectors = pgTable("tournament_directors", {
	id: serial().primaryKey(),
	tournamentId: integer("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" } ),
	directorId: integer("director_id").notNull().references(() => directors.id),
	order: integer().default(0).notNull(),
}, (table) => [
	unique("tournament_directors_unique").on(table.tournamentId, table.directorId),]);

export const tournamentDivisionRequirements = pgTable("tournament_division_requirements", {
	id: serial().primaryKey(),
	tournamentDivisionId: integer("tournament_division_id").notNull().references(() => tournamentDivisions.id, { onDelete: "cascade" } ),
	gender: gender(),
	qualifiedDivisionId: integer("qualified_division_id").references(() => divisions.id),
	minimum: integer(),
}, (table) => [
	index("tournament_division_req_idx").using("btree", table.tournamentDivisionId.asc().nullsLast()),
]);

export const tournamentDivisionTeams = pgTable("tournament_division_teams", {
	id: serial().primaryKey(),
	tournamentDivisionId: integer("tournament_division_id").notNull().references(() => tournamentDivisions.id, { onDelete: "cascade" } ),
	teamId: integer("team_id").notNull().references(() => teams.id),
	seed: integer(),
	finish: integer(),
	playoffsSeed: integer("playoffs_seed"),
	wildcard: boolean(),
	pointsEarned: doublePrecision("points_earned"),
	levelEarnedId: integer("level_earned_id").references(() => levels.id),
	status: teamStatus().default("registered").notNull(),
	externalRef: uuid("external_ref"),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
	order: integer(),
}, (table) => [
	unique("tournament_division_teams_externalRef_unique").on(table.externalRef),]);

export const tournamentDivisions = pgTable("tournament_divisions", {
	id: serial().primaryKey(),
	tournamentId: integer("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" } ),
	divisionId: integer("division_id").notNull().references(() => divisions.id),
	name: text(),
	gender: gender().notNull(),
	teamSize: integer("team_size").default(2).notNull(),
	capacity: integer().default(10).notNull(),
	waitlistCapacity: integer("waitlist_capacity").default(5).notNull(),
	autopromoteWaitlist: boolean("autopromote_waitlist").default(true).notNull(),
	externalRef: uuid("external_ref"),
	displayGender: boolean("display_gender"),
	displayDivision: boolean("display_division"),
}, (table) => [
	unique("tournament_division_name_gender_unique").on(table.tournamentId, table.divisionId, table.name, table.gender),	unique("tournament_divisions_externalRef_unique").on(table.externalRef),]);

export const tournaments = pgTable("tournaments", {
	id: serial().primaryKey(),
	name: text(),
	date: date().notNull(),
	startTime: time("start_time").notNull(),
	visible: boolean().default(false).notNull(),
	venueId: integer("venue_id").notNull().references(() => venues.id),
	externalRef: text("external_ref"),
	demo: boolean().default(false).notNull(),
});

export const users = pgTable("users", {
	id: text().primaryKey(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	phoneNumber: text("phone_number").notNull(),
	phoneNumberVerified: boolean("phone_number_verified").notNull(),
	image: text(),
	role: role(),
	banned: boolean(),
	banReason: text("ban_reason"),
	banDate: date("ban_date"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),	unique("users_phoneNumber_unique").on(table.phoneNumber),]);

export const venueDirectors = pgTable("venue_directors", {
	id: serial().primaryKey(),
	venueId: integer("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" } ),
	directorId: integer("director_id").notNull().references(() => directors.id),
	order: integer().default(0).notNull(),
}, (table) => [
	unique("venue_directors_unique").on(table.venueId, table.directorId),]);

export const venues = pgTable("venues", {
	id: serial().primaryKey(),
	slug: text().notNull(),
	name: text().notNull(),
	city: text().notNull(),
	description: jsonb().notNull(),
	directions: jsonb().notNull(),
	mapUrl: text("map_url").notNull(),
	status: venueStatus().notNull(),
	imageSource: text("image_source"),
	externalRef: uuid("external_ref"),
	directorId: text("director_id").references(() => users.id),
	headerImageSource: text("header_image_source"),
	thumbnailImageSource: text("thumbnail_image_source"),
}, (table) => [
	index("external_ref_idx").using("btree", table.externalRef.asc().nullsLast()),
	unique("name_city_unique").on(table.name, table.city),	unique("venues_externalRef_unique").on(table.externalRef),	unique("venues_slug_unique").on(table.slug),]);

export const verifications = pgTable("verifications", {
	id: text().primaryKey(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
});
