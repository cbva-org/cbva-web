import { ConstructionIcon } from "lucide-react"
import { Alert } from "./base/alert"

export function UnderConstruction() {
  return (
    <Alert
      color="warning"
      title={
        <span className="flex flex-row gap-2 items-center">
          <ConstructionIcon size={32} /> <span>Under Construction!</span>
        </span>
      }
      description={<>This area is under construction.</>}
    />
  )
}
