import { CSSProperties } from "react";
import {
	UNSTABLE_ToastRegion as AriaToastRegion,
	UNSTABLE_Toast as AriaToast,
	UNSTABLE_ToastQueue as ToastQueue,
	UNSTABLE_ToastContent as AriaToastContent,
	ToastProps,
	Button,
	Text,
} from "react-aria-components";
import { XIcon } from "lucide-react";
import { composeTailwindRenderProps } from "./utils";
import { flushSync } from "react-dom";
import { alertVariants, AlertVariants } from "./alert";

export type ToastContent = {
	variant: AlertVariants["color"];
	title: string;
	description?: string;
};

// This is a global toast queue, to be imported and called where ever you want to queue a toast via queue.add().
export const queue = new ToastQueue<ToastContent>({
	// Wrap state updates in a CSS view transition.
	wrapUpdate(fn) {
		if ("startViewTransition" in document) {
			document.startViewTransition(() => {
				flushSync(fn);
			});
		} else {
			fn();
		}
	},
});

export function ToastRegion() {
	return (
		// The ToastRegion should be rendered at the root of your app.
		<AriaToastRegion
			queue={queue}
			className="fixed bottom-4 right-4 flex flex-col-reverse gap-2 rounded-lg outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
		>
			{({ toast }) => (
				<AriaToast
					toast={toast}
					className={alertVariants({
						color: toast.content.variant,
						className: "flex flex-row items-center pl-3 pr-0 space-y-0",
					})}
				>
					<AriaToastContent className="flex flex-col flex-1 min-w-0">
						<Text slot="title" className="font-semibold text-sm">
							{toast.content.title}
						</Text>
						{toast.content.description && (
							<Text slot="description" className="text-xs">
								{toast.content.description}
							</Text>
						)}
					</AriaToastContent>
					<Button
						slot="close"
						aria-label="Close"
						className="flex flex-none appearance-none w-8 h-8 rounded-sm bg-transparent border-none p-0 outline-none hover:bg-white/10 pressed:bg-white/15 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 items-center justify-center [-webkit-tap-highlight-color:transparent]"
					>
						<XIcon className="w-4 h-4" />
					</Button>
				</AriaToast>
			)}
		</AriaToastRegion>
	);
}

export function Toast(props: ToastProps<ToastContent>) {
	return (
		<AriaToast
			{...props}
			style={{ viewTransitionName: props.toast.key } as CSSProperties}
			className={composeTailwindRenderProps(
				props.className,
				"flex items-center gap-4 bg-blue-600 px-4 py-3 rounded-lg outline-none forced-colors:outline focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 [view-transition-class:toast] font-sans w-[230px]",
			)}
		/>
	);
}
