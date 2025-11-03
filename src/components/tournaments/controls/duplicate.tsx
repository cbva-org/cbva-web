import {
  type CalendarDate,
  getLocalTimeZone,
  today,
} from "@internationalized/date"
import z from "zod"
import { Button } from "@/components/base/button"
import { useAppForm } from "@/components/base/form"
import { Modal } from "@/components/base/modal"
import { title } from "@/components/base/primitives"

export type DuplicateFormProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const schema = z.object({
  date: z
    .any()
    .refine((value) => Boolean(value), {
      message: "This field is required",
    })
    .refine(
      (value: CalendarDate) => {
        if (!value) {
          return true
        }

        const todayDate = today(getLocalTimeZone())

        return value > todayDate
      },
      {
        message: "Date must be in the future",
      }
    ),
})

export function DuplicateForm(props: DuplicateFormProps) {
  const form = useAppForm({
    defaultValues: {
      date: today(getLocalTimeZone()).add({ days: 1 }),
    },
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: ({ value: { date } }) => {
      console.log("here")
    },
  })

  return (
    <Modal {...props}>
      <div className="p-3 flex flex-col space-y-4 relative">
        <h3 className={title({ size: "sm" })}>Duplicate Tournament</h3>

        <form
          onSubmit={(e) => {
            e.preventDefault()

            form.handleSubmit()
          }}
        >
          <form.AppField
            name="date"
            children={(field) => (
              <field.DatePicker
                isRequired
                className="col-span-3"
                label="Date"
                field={field}
                minValue={today(getLocalTimeZone())}
              />
            )}
          />

          <form.AppForm>
            <form.Footer className="col-span-full">
              <Button onPress={() => onOpenChange(false)}>Cancel</Button>

              <form.SubmitButton>Create</form.SubmitButton>
            </form.Footer>
          </form.AppForm>
        </form>
      </div>
    </Modal>
  )
}
