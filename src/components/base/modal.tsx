import {
  Dialog,
  ModalOverlay,
  type ModalOverlayProps,
  Modal as RACModal,
} from "react-aria-components"
import { tv } from "tailwind-variants"

const overlayStyles = tv({
  base: "fixed top-0 left-0 w-full h-(--visual-viewport-height) isolate z-20 bg-black/[15%] flex items-center justify-center p-4 text-center backdrop-blur-lg",
  variants: {
    isEntering: {
      true: "animate-in fade-in duration-200 ease-out",
    },
    isExiting: {
      true: "animate-out fade-out duration-200 ease-in",
    },
  },
})

const modalStyles = tv({
  base: "w-full max-w-md max-h-full overflow-y-scroll rounded-2xl bg-white forced-colors:bg-[Canvas] text-left align-middle shadow-2xl bg-clip-padding border border-black/10 dark:border-white/10",
  variants: {
    isEntering: {
      true: "animate-in zoom-in-105 ease-out duration-200",
    },
    isExiting: {
      true: "animate-out zoom-out-95 ease-in duration-200",
    },
    size: {
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export function Modal({
  isDismissable = true,
  children,
  size,
  ...props
}: ModalOverlayProps & { size?: "2xl" | "xl" | "lg" | "md" }) {
  return (
    <ModalOverlay
      {...props}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isDismissable}
      className={overlayStyles}
    >
      <RACModal
        {...props}
        isDismissable={isDismissable}
        isKeyboardDismissDisabled={isDismissable}
        className={modalStyles({ size })}
      >
        <Dialog children={children} />
      </RACModal>
    </ModalOverlay>
  )
}
