import { Header } from "react-aria-components";
import {
	Disclosure,
	DisclosureGroup,
	DisclosureHeader,
	DisclosurePanel,
} from "../../base/disclosure";
import { title } from "../../base/primitives";
import { CopyScheduleForm } from "./copy";
import { DeleteScheduleForm } from "./delete";

export function ScheduleDashboard() {
	return (
		<section className="flex flex-col space-y-8">
			<Header className={title({ size: "sm" })}>Schedule</Header>

			<DisclosureGroup>
				<Disclosure className="bg-white">
					<DisclosureHeader className={title({ size: "xs" })}>
						Copy Schedule
					</DisclosureHeader>
					<DisclosurePanel>
						<CopyScheduleForm />
					</DisclosurePanel>
				</Disclosure>

				<Disclosure className="bg-white">
					<DisclosureHeader className={title({ size: "xs" })}>
						Delete Schedule
					</DisclosureHeader>
					<DisclosurePanel>
						<DeleteScheduleForm />
					</DisclosurePanel>
				</Disclosure>
			</DisclosureGroup>
		</section>
	);
}
