import createClient from "gel";

async function main() {
	const gelClient = createClient({
		instanceName: "drizzle",
	});

	const res = await gelClient.query<{
		elements: {
			id: string;
			teams: { id: string };
		}[];
	}>(`
    with
      tournaments := (
        select Tournament
        filter .status = TournamentStatus.Complete
      ),
      groups := (
        group tournaments
        by .start_at, .name, .gender, .division, .beach
      )
    select groups {
      elements: {
        id,
        # status,
        # beach: { id },
        # url,
        # name,
        # division,
        # start_at,
        # gender,
        teams := (
          with t_url := .url
          select Team filter .tournament.url = t_url
        )
      },
      dup_count := count(.elements)
    }
      filter count(.elements) > 1;
  `);

	// console.log(JSON.stringify(res, null, 2));

	await gelClient.transaction(async (txn) => {
		for (const group of res) {
			const [keep, ...rest] = group.elements;

			for (const { id } of rest.flatMap(({ teams }) => teams)) {
				// insert team, set old to transferred
				const r = await txn.querySingle(
					`
					with
					  team := (select Team filter .id = <uuid>$teamId),
						tournament := (select Tournament filter .id = <uuid>$tournamentId limit 1)
					select {
					  status := TeamStatus.Active,
					  tournament := tournament,
					  transaction_key := team.transaction_key,
					  can_edit := team.can_edit,
					  players := team.players
					}
					`,
					{
						teamId: id,
						tournamentId: keep.id,
					},
				);
			}

			// set rest tournaments to Cancelled
		}
	});
}

await main();
