import {
	ArrowDownIcon,
	ArrowDownWideNarrowIcon,
	ArrowUpIcon,
	ArrowUpWideNarrowIcon,
	GripVerticalIcon,
} from "lucide-react";
import {
	type DragAndDropHooks,
	DropIndicator,
	type Key,
	Text,
	useDragAndDrop,
} from "react-aria-components";
import { useListData } from "react-stately";
import { ListBox, ListBoxItem } from "./list-box";
import type { Option } from "./select";
import { Button } from "./button";

type ListBoxProps<V extends Key> = {
	items?: Option<V>[];
	dragAndDropHooks?: DragAndDropHooks<Option<V>>;
};

export function OrderingList<V extends Key>(props: ListBoxProps<V>) {
	const { items: defaultItems } = props;

	const list = useListData({
		initialItems: defaultItems,
		getKey: (item) => item.value,
	});

	const { dragAndDropHooks } = useDragAndDrop<Option<V>>({
		getItems(keys, items) {
			return items.map((item) => {
				return {
					"text/plain": `${item.display}`,
					"text/html": `<strong>${item.display}</strong>`,
					item: JSON.stringify(item),
				};
			});
		},
		renderDropIndicator(target) {
			return (
				<DropIndicator
					target={target}
					className={({ isDropTarget }) =>
						`h-0.5 mx-1 rounded-full ${isDropTarget ? "bg-blue-500" : "bg-transparent"}`
					}
				/>
			);
		},
		onReorder(e) {
			if (e.target.dropPosition === "before") {
				list.moveBefore(e.target.key, e.keys);
			} else if (e.target.dropPosition === "after") {
				list.moveAfter(e.target.key, e.keys);
			}
		},
	});

	return (
		<ListBox
			aria-label="Ordering list"
			selectionMode="multiple"
			items={list.items}
			renderEmptyState={() => "Drop items here"}
			dragAndDropHooks={dragAndDropHooks}
		>
			{(item) => (
				<ListBoxItem id={item.value} textValue={item.display}>
					<span className="flex flex-row gap-2">
						<span>
							<GripVerticalIcon />
						</span>
						<Text slot="label">{item.display}</Text>
					</span>
					<span className="flex flex-row gap-2">
						<Button variant="icon" size="sm">
							<ArrowUpIcon size={24} />
						</Button>
						<Button variant="icon" size="sm">
							<ArrowDownIcon />
						</Button>
					</span>
				</ListBoxItem>
			)}
		</ListBox>
	);
}
