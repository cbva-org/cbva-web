import {
	accounts,
	userRelations,
	users,
	// usersRelationsDefinitions,
} from "./auth";
import { blocks, pages } from "./blocks";
import { directorRelations, directors } from "./directors";
import { divisionRelations, divisions } from "./divisions";
import { levels } from "./levels";
import { matchRefTeams, matchRefTeamsRelations } from "./match-ref-teams";
import { matchSets, matchSetsRelations } from "./match-sets";
import {
	playerProfileRelations,
	playerProfiles,
	// playerProfilesRelationsDefinitions,
} from "./player-profiles";
import { playoffMatches, playoffMatchRelations } from "./playoff-matches";
import { poolMatches, poolMatchRelations } from "./pool-matches";
import { poolTeams, poolTeamsRelations } from "./pool-teams";
import { poolRelations, pools } from "./pools";
import { rateLimiterFlexibleSchema } from "./rate-limits";
import { teamPlayerRelations, teamPlayers } from "./team-players";
import { teamRelations, teams } from "./teams";
import {
	tournamentDirectorRelations,
	tournamentDirectors,
} from "./tournament-directors";
import {
	tournamentDivisionRequirements,
	tournamentDivisionRequirementsRelations,
} from "./tournament-division-requirements";
import {
	tournamentDivisionTeams,
	tournamentDivisionTeamsRelations,
} from "./tournament-division-teams";
import {
	tournamentDivisionRelations,
	tournamentDivisions,
} from "./tournament-divisions";
import { tournamentRelations, tournaments } from "./tournaments";
import { venueDirectorRelations, venueDirectors } from "./venue-directors";
import { venuesRelations, venues } from "./venues";
import { defineRelations } from "drizzle-orm";

export const tables = {
	blocks,
	directors,
	divisions,
	levels,
	matchSets,
	matchRefTeams,
	pages,
	playerProfiles,
	playoffMatches,
	poolMatches,
	pools,
	poolTeams,
	teamPlayers,
	teams,
	tournamentDirectors,
	tournamentDivisionRequirements,
	tournamentDivisions,
	tournamentDivisionTeams,
	tournaments,
	users,
	accounts,
	venues,
	venueDirectors,
	rateLimiterFlexibleSchema,
};
