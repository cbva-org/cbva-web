import { createFileRoute } from "@tanstack/react-router";
import { DefaultLayout } from "@/layouts/default";
import { subtitle, title } from "@/components/base/primitives";
import { getBlogsQueryOptions } from "@/functions/blogs/get-blogs";
import { useSuspenseQuery } from "@tanstack/react-query";
import { RichTextDisplay } from "@/components/base/rich-text-editor/display";

export const Route = createFileRoute("/info/cedars")({
	loader: ({ context: { queryClient } }) => {
		return queryClient.ensureQueryData(getBlogsQueryOptions("cedars"));
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { data: blogs } = useSuspenseQuery(getBlogsQueryOptions("cedars"));

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 px-2 max-w-2xl mx-auto flex flex-col space-y-12",
			}}
		>
			<div className="flex flex-col space-y-6 text-center">
				<h1 className={title()}>Injury Prevention and Wellness</h1>
				<p className={subtitle()}>Sponsored Content From</p>
				<a
					className="mx-auto"
					href="https://www.cedars-sinai.org/programs/ortho/specialties/sports-medicine.html"
					target="_blank"
					rel="noreferrer"
				>
					<img
						src="/logos/cedars-sinai.svg"
						className="mx-auto w-[270px]"
						alt="Cedars-Sinai"
					/>
				</a>
			</div>
			<div className="flex bg-sand max-w-[500px] mx-auto items-center justify-center">
				<ul>
					{blogs?.map(({ title, summary, imageSource, link }) => (
						<li
							key={title}
							className="bg-white my-8 mx-6 rounded-xl overflow-hidden group"
						>
							<a href={link} target="_blank" rel="noreferrer">
								{imageSource && (
									<img src={imageSource} className="w-full" alt={title} />
								)}
								<div className="bg-navbar-background p-2 pl-3 text-left text-navbar-foreground text-lg font-semibold sm:text-xl group-hover:underline">
									<p>{title}</p>
								</div>
								<div className="my-4 mx-4 contents-center text-neutral-700">
									<RichTextDisplay
										name="faq-answer"
										content={
											typeof summary === "string"
												? JSON.parse(summary)
												: summary
										}
									/>
									<p className="underline">Read More</p>
								</div>
							</a>
						</li>
					))}
				</ul>
			</div>
		</DefaultLayout>
	);
}
