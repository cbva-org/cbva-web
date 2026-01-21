import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { title } from "@/components/base/primitives";
import { DefaultLayout } from "@/layouts/default";
import { getFaqsQueryOptions } from "@/functions/faqs/get-faqs";
import {
	Disclosure,
	DisclosureGroup,
	DisclosureHeader,
	DisclosurePanel,
} from "@/components/base/disclosure";
import { RichTextDisplay } from "@/components/base/rich-text-editor/display";
import { useViewerHasPermission } from "@/auth/shared";
import { ReorderFaqsForm } from "@/components/faqs/reorder-faqs-form";
import { CreateFaqForm } from "@/components/faqs/create-faq-form";
import { DeleteFaqForm } from "@/components/faqs/delete-faq-form";
import { UpdateFaqForm } from "@/components/faqs/update-faq-form";

const titles: { [key: string]: string } = {
	tournaments: "Tournament",
	waitlist: "Waitlist",
};

export const Route = createFileRoute("/faqs/{-$subject}")({
	loader: async ({ params: { subject = null }, context: { queryClient } }) => {
		return await queryClient.ensureQueryData(getFaqsQueryOptions(subject));
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { subject } = Route.useParams();

	const { data: faqs } = useSuspenseQuery(getFaqsQueryOptions(subject));

	const canCreate = useViewerHasPermission({
		faqs: ["create"],
	})

	const canUpdate = useViewerHasPermission({
		faqs: ["update"],
	})

	return (
		<DefaultLayout>
			<div className="max-w-4xl mx-auto py-8 px-4">
				<div className="flex justify-between items-center mb-12">
					<h1 className={title()}>
						{subject && titles[subject] ? (
							<>{titles[subject]} FAQs</>
						) : (
							<>Frequently Asked Questions</>
						)}
					</h1>

					<div className="flex flex-row gap-2">
						{canUpdate && <ReorderFaqsForm groupKey={subject} />}
						{canCreate && <CreateFaqForm groupKey={subject} />}
					</div>
				</div>

				{faqs && faqs.length === 0 && <p>No FAQs yet...</p>}

				{Boolean(faqs?.length) && (
					<DisclosureGroup>
						{faqs.map(({ id, question, answer }) => (
							<Disclosure key={id}>
								<DisclosureHeader
									color="alt"
									contentClassName="flex-1 flex flex-row justify-between items-center"
								>
									<span>{question}</span>

									{canUpdate && (
										<span className="flex flex-row space-x-2 items-center">
											<UpdateFaqForm id={id} groupKey={subject} />
											<DeleteFaqForm
												id={id}
												question={question}
												groupKey={subject}
											/>
										</span>
									)}
								</DisclosureHeader>
								<DisclosurePanel color="alt">
									<RichTextDisplay
										name="faq-answer"
										content={
											typeof answer === "string" ? JSON.parse(answer) : answer
										}
									/>
								</DisclosurePanel>
							</Disclosure>
						))}
					</DisclosureGroup>
				)}
			</div>
		</DefaultLayout>
	)
}
