import type { PlayerProfile } from "@/db/schema"

export function ProfileName({
  preferredName,
  firstName,
  lastName,
}: Pick<PlayerProfile, "preferredName" | "firstName" | "lastName">) {
  return (
    <span>
      {preferredName ?? firstName}{" "}
      <span className="hidden sm:inline-block">{lastName}</span>
      <span className="sm:hidden">{lastName.slice(0, 1)}.</span>
    </span>
  )
}
