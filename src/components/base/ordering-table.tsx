import { GripVerticalIcon } from "lucide-react";
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
} from "./table";
import { DragAndDropHooks } from "react-aria-components";

export type Pokemon = {
	id: number;
	name: string;
	type: string;
	level?: number;
};

type OrderingTableProps = {
	items?: Pokemon[];
	dragAndDropHooks?: DragAndDropHooks<Pokemon>;
};

export const defaultItems: Pokemon[] = [
	{ id: 1, name: "Charizard", type: "Fire, Flying", level: 67 },
	{ id: 2, name: "Blastoise", type: "Water", level: 56 },
	{ id: 3, name: "Venusaur", type: "Grass, Poison", level: 83 },
	{ id: 4, name: "Pikachu", type: "Electric", level: 100 },
];

export function OrderingTable(props: OrderingTableProps) {
	const { items = defaultItems, dragAndDropHooks } = props;

	return (
		<Table
			aria-label="Ordering table"
			selectionMode="multiple"
			dragAndDropHooks={dragAndDropHooks}
		>
			<TableHeader>
				<TableColumn width={1} />
				<TableColumn isRowHeader>Name</TableColumn>
				<TableColumn>Type</TableColumn>
				<TableColumn>Level</TableColumn>
			</TableHeader>
			<TableBody items={items}>
				{(item) => (
					<TableRow>
						<TableCell>
							<GripVerticalIcon />
						</TableCell>
						<TableCell>{item.name}</TableCell>
						<TableCell>{item.type}</TableCell>
						<TableCell>{item.level}</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
