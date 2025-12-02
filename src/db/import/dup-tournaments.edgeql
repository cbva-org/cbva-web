with
  groups := (
    group Tournament
    by .start_at, .name, .gender, .division
  )
select groups {
  elements: {
    name,
    division,
    start_at,
    gender,
    teams := (
      with t_url := .url
      select Team filter .tournament.url = t_url
    )
  }
}
  filter count(.elements) > 1;
