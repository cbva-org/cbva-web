import { SettingsIcon } from "lucide-react"
import { useState } from "react"

import { useViewerHasPermission } from "@/auth/shared"
import { DropdownMenu, DropdownMenuItem } from "@/components/base/dropdown-menu"
import type { Division, TournamentDivision } from "@/db/schema"

import { AddTeamForm } from "./add-team"
import { CalculateSeedsForm } from "./calculate-seeds"
import { CreatePoolsForm } from "./create-pools"
import { DuplicateForm } from "./duplicate"

export type TournamentAdminControlsProps = {
  tournamentId: number
  division: TournamentDivision & { division: Division }
}

type ModalKind = "duplicate" | "add-team" | "calc-seeds" | "gen-pools"

export function TournamentControls({
  tournamentId,
  division,
}: TournamentAdminControlsProps) {
  const canCreate = useViewerHasPermission({
    tournament: ["create"],
  })

  const canUpdate = useViewerHasPermission({
    tournament: ["update"],
  })

  const [activeModal, setActiveModal] = useState<ModalKind>()

  if (![canCreate, canUpdate].some(Boolean)) {
    return null
  }

  return (
    <>
      <DropdownMenu
        buttonClassName="absolute top-6 right-6"
        buttonIcon={<SettingsIcon />}
      >
        {canCreate && (
          <DropdownMenuItem onPress={() => setActiveModal("duplicate")}>
            Duplicate
          </DropdownMenuItem>
        )}

        {canUpdate && (
          <>
            <DropdownMenuItem onPress={() => setActiveModal("add-team")}>
              Add Team
            </DropdownMenuItem>
            <DropdownMenuItem onPress={() => setActiveModal("gen-pools")}>
              Create Pools
            </DropdownMenuItem>
            <DropdownMenuItem onPress={() => setActiveModal("calc-seeds")}>
              Calculate Seeds
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenu>

      <DuplicateForm
        tournamentId={tournamentId}
        isOpen={activeModal === "duplicate"}
        onOpenChange={(open) => {
          const next = open ? "duplicate" : undefined

          setActiveModal(next)
        }}
      />

      <AddTeamForm
        tournamentId={tournamentId}
        division={division}
        isOpen={activeModal === "add-team"}
        onOpenChange={(open) => {
          const next = open ? "add-team" : undefined

          setActiveModal(next)
        }}
      />

      <CreatePoolsForm
        tournamentId={tournamentId}
        division={division}
        isOpen={activeModal === "gen-pools"}
        onOpenChange={(open) => {
          const next = open ? "gen-pools" : undefined

          setActiveModal(next)
        }}
      />

      <CalculateSeedsForm
        tournamentId={tournamentId}
        division={division}
        isOpen={activeModal === "calc-seeds"}
        onOpenChange={(open) => {
          const next = open ? "calc-seeds" : undefined

          setActiveModal(next)
        }}
      />
    </>
  )
}
