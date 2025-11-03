import { useState } from "react"
import { useViewerHasPermission, useViewerRole } from "@/auth/shared"
import { DropdownMenu, DropdownMenuItem } from "@/components/base/dropdown-menu"
import { Modal } from "../base/modal"
import { title } from "../base/primitives"
import { DuplicateForm } from "./duplicate"

export type TournamentAdminControlsProps = {
  tournamentId: number
  divisionId: number
}

export function TournamentControls({
  tournamentId,
  divisionId,
}: TournamentAdminControlsProps) {
  const canCreate = useViewerHasPermission({
    tournament: ["create"],
  })

  const [isDuplicating, setDuplicating] = useState<boolean>()

  if (![canCreate].some(Boolean)) {
    return null
  }

  return (
    <>
      <DropdownMenu buttonClassName="absolute top-6 right-6">
        {canCreate && (
          <DropdownMenuItem onPress={() => setDuplicating(true)}>
            Duplicate
          </DropdownMenuItem>
        )}
      </DropdownMenu>
      <DuplicateForm isOpen={isDuplicating} onOpenChange={setDuplicating} />
    </>
  )
}
