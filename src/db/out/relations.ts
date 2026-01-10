import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	accounts: {
		user: r.one.users({
			from: r.accounts.userId,
			to: r.users.id
		}),
	},
	users: {
		accounts: r.many.accounts(),
		levels: r.many.levels(),
		projectsOwnerId: r.many.projects({
			alias: "projects_ownerId_users_id"
		}),
		projectsViaTodos: r.many.projects({
			alias: "projects_id_users_id_via_todos"
		}),
		venues: r.many.venues(),
	},
	blocks: {
		page: r.one.pages({
			from: r.blocks.page,
			to: r.pages.path
		}),
	},
	pages: {
		blocks: r.many.blocks(),
	},
	directors: {
		playerProfile: r.one.playerProfiles({
			from: r.directors.profileId,
			to: r.playerProfiles.id
		}),
		tournaments: r.many.tournaments({
			from: r.directors.id.through(r.tournamentDirectors.directorId),
			to: r.tournaments.id.through(r.tournamentDirectors.tournamentId)
		}),
		venues: r.many.venues({
			from: r.directors.id.through(r.venueDirectors.directorId),
			to: r.venues.id.through(r.venueDirectors.venueId)
		}),
	},
	playerProfiles: {
		directors: r.many.directors(),
		teams: r.many.teams({
			from: r.playerProfiles.id.through(r.teamPlayers.playerProfileId),
			to: r.teams.id.through(r.teamPlayers.teamId)
		}),
	},
	matchRefTeams: {
		playoffMatch: r.one.playoffMatches({
			from: r.matchRefTeams.playoffMatchId,
			to: r.playoffMatches.id
		}),
		poolMatch: r.one.poolMatches({
			from: r.matchRefTeams.poolMatchId,
			to: r.poolMatches.id
		}),
		tournamentDivisionTeam: r.one.tournamentDivisionTeams({
			from: r.matchRefTeams.teamId,
			to: r.tournamentDivisionTeams.id
		}),
	},
	playoffMatches: {
		matchRefTeams: r.many.matchRefTeams(),
		matchSets: r.many.matchSets(),
		playoffMatchNextMatchId: r.one.playoffMatches({
			from: r.playoffMatches.nextMatchId,
			to: r.playoffMatches.id,
			alias: "playoffMatches_nextMatchId_playoffMatches_id"
		}),
		playoffMatchesNextMatchId: r.many.playoffMatches({
			alias: "playoffMatches_nextMatchId_playoffMatches_id"
		}),
		tournamentDivisionTeamTeamAid: r.one.tournamentDivisionTeams({
			from: r.playoffMatches.teamAId,
			to: r.tournamentDivisionTeams.id,
			alias: "playoffMatches_teamAId_tournamentDivisionTeams_id"
		}),
		poolTeamApoolId: r.one.pools({
			from: r.playoffMatches.teamAPoolId,
			to: r.pools.id,
			alias: "playoffMatches_teamAPoolId_pools_id"
		}),
		playoffMatchTeamApreviousMatchId: r.one.playoffMatches({
			from: r.playoffMatches.teamAPreviousMatchId,
			to: r.playoffMatches.id,
			alias: "playoffMatches_teamAPreviousMatchId_playoffMatches_id"
		}),
		playoffMatchesTeamApreviousMatchId: r.many.playoffMatches({
			alias: "playoffMatches_teamAPreviousMatchId_playoffMatches_id"
		}),
		tournamentDivisionTeamTeamBid: r.one.tournamentDivisionTeams({
			from: r.playoffMatches.teamBId,
			to: r.tournamentDivisionTeams.id,
			alias: "playoffMatches_teamBId_tournamentDivisionTeams_id"
		}),
		poolTeamBpoolId: r.one.pools({
			from: r.playoffMatches.teamBPoolId,
			to: r.pools.id,
			alias: "playoffMatches_teamBPoolId_pools_id"
		}),
		playoffMatchTeamBpreviousMatchId: r.one.playoffMatches({
			from: r.playoffMatches.teamBPreviousMatchId,
			to: r.playoffMatches.id,
			alias: "playoffMatches_teamBPreviousMatchId_playoffMatches_id"
		}),
		playoffMatchesTeamBpreviousMatchId: r.many.playoffMatches({
			alias: "playoffMatches_teamBPreviousMatchId_playoffMatches_id"
		}),
		tournamentDivision: r.one.tournamentDivisions({
			from: r.playoffMatches.tournamentDivisionId,
			to: r.tournamentDivisions.id
		}),
		tournamentDivisionTeamWinnerId: r.one.tournamentDivisionTeams({
			from: r.playoffMatches.winnerId,
			to: r.tournamentDivisionTeams.id,
			alias: "playoffMatches_winnerId_tournamentDivisionTeams_id"
		}),
	},
	poolMatches: {
		matchRefTeams: r.many.matchRefTeams(),
		matchSets: r.many.matchSets(),
		pool: r.one.pools({
			from: r.poolMatches.poolId,
			to: r.pools.id
		}),
		tournamentDivisionTeamTeamAid: r.one.tournamentDivisionTeams({
			from: r.poolMatches.teamAId,
			to: r.tournamentDivisionTeams.id,
			alias: "poolMatches_teamAId_tournamentDivisionTeams_id"
		}),
		tournamentDivisionTeamTeamBid: r.one.tournamentDivisionTeams({
			from: r.poolMatches.teamBId,
			to: r.tournamentDivisionTeams.id,
			alias: "poolMatches_teamBId_tournamentDivisionTeams_id"
		}),
		tournamentDivisionTeamWinnerId: r.one.tournamentDivisionTeams({
			from: r.poolMatches.winnerId,
			to: r.tournamentDivisionTeams.id,
			alias: "poolMatches_winnerId_tournamentDivisionTeams_id"
		}),
	},
	tournamentDivisionTeams: {
		matchRefTeams: r.many.matchRefTeams(),
		matchSets: r.many.matchSets(),
		playoffMatchesTeamAid: r.many.playoffMatches({
			alias: "playoffMatches_teamAId_tournamentDivisionTeams_id"
		}),
		playoffMatchesTeamBid: r.many.playoffMatches({
			alias: "playoffMatches_teamBId_tournamentDivisionTeams_id"
		}),
		playoffMatchesWinnerId: r.many.playoffMatches({
			alias: "playoffMatches_winnerId_tournamentDivisionTeams_id"
		}),
		poolMatchesTeamAid: r.many.poolMatches({
			alias: "poolMatches_teamAId_tournamentDivisionTeams_id"
		}),
		poolMatchesTeamBid: r.many.poolMatches({
			alias: "poolMatches_teamBId_tournamentDivisionTeams_id"
		}),
		poolMatchesWinnerId: r.many.poolMatches({
			alias: "poolMatches_winnerId_tournamentDivisionTeams_id"
		}),
		pools: r.many.pools(),
		level: r.one.levels({
			from: r.tournamentDivisionTeams.levelEarnedId,
			to: r.levels.id
		}),
		team: r.one.teams({
			from: r.tournamentDivisionTeams.teamId,
			to: r.teams.id
		}),
		tournamentDivision: r.one.tournamentDivisions({
			from: r.tournamentDivisionTeams.tournamentDivisionId,
			to: r.tournamentDivisions.id
		}),
	},
	matchSets: {
		playoffMatch: r.one.playoffMatches({
			from: r.matchSets.playoffMatchId,
			to: r.playoffMatches.id
		}),
		poolMatch: r.one.poolMatches({
			from: r.matchSets.poolMatchId,
			to: r.poolMatches.id
		}),
		tournamentDivisionTeam: r.one.tournamentDivisionTeams({
			from: r.matchSets.winnerId,
			to: r.tournamentDivisionTeams.id
		}),
	},
	levels: {
		users: r.many.users({
			from: r.levels.id.through(r.playerProfiles.levelId),
			to: r.users.id.through(r.playerProfiles.userId)
		}),
		tournamentDivisionTeams: r.many.tournamentDivisionTeams(),
	},
	pools: {
		playoffMatchesTeamApoolId: r.many.playoffMatches({
			alias: "playoffMatches_teamAPoolId_pools_id"
		}),
		playoffMatchesTeamBpoolId: r.many.playoffMatches({
			alias: "playoffMatches_teamBPoolId_pools_id"
		}),
		poolMatches: r.many.poolMatches(),
		tournamentDivisionTeams: r.many.tournamentDivisionTeams({
			from: r.pools.id.through(r.poolTeams.poolId),
			to: r.tournamentDivisionTeams.id.through(r.poolTeams.teamId)
		}),
		tournamentDivision: r.one.tournamentDivisions({
			from: r.pools.tournamentDivisionId,
			to: r.tournamentDivisions.id
		}),
	},
	tournamentDivisions: {
		playoffMatches: r.many.playoffMatches(),
		pools: r.many.pools(),
		divisions: r.many.divisions(),
		tournamentDivisionTeams: r.many.tournamentDivisionTeams(),
	},
	projects: {
		user: r.one.users({
			from: r.projects.ownerId,
			to: r.users.id,
			alias: "projects_ownerId_users_id"
		}),
		users: r.many.users({
			from: r.projects.id.through(r.todos.projectId),
			to: r.users.id.through(r.todos.userId),
			alias: "projects_id_users_id_via_todos"
		}),
	},
	teams: {
		playerProfiles: r.many.playerProfiles(),
		tournamentDivisionTeams: r.many.tournamentDivisionTeams(),
	},
	tournaments: {
		directors: r.many.directors(),
		divisions: r.many.divisions(),
		venue: r.one.venues({
			from: r.tournaments.venueId,
			to: r.venues.id
		}),
	},
	divisions: {
		tournamentDivisions: r.many.tournamentDivisions({
			from: r.divisions.id.through(r.tournamentDivisionRequirements.qualifiedDivisionId),
			to: r.tournamentDivisions.id.through(r.tournamentDivisionRequirements.tournamentDivisionId)
		}),
		tournaments: r.many.tournaments({
			from: r.divisions.id.through(r.tournamentDivisions.divisionId),
			to: r.tournaments.id.through(r.tournamentDivisions.tournamentId)
		}),
	},
	venues: {
		tournaments: r.many.tournaments(),
		directors: r.many.directors(),
		user: r.one.users({
			from: r.venues.directorId,
			to: r.users.id
		}),
	},
}))