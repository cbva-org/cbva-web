import { createFileRoute, Link } from "@tanstack/react-router";
import { DefaultLayout } from "@/layouts/default";
import { title } from "@/components/base/primitives";
import { button } from "@/components/base/button";
import { SearchXIcon } from "lucide-react";

export const Route = createFileRoute("/not-found")({
	head: () => ({
		meta: [{ title: "Page Not Found" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<DefaultLayout>
			<div className="text-center flex flex-col space-y-6 max-w-xl mx-auto py-16">
				<div className="flex justify-center">
					<SearchXIcon className="w-16 h-16 text-gray-400" />
				</div>
				<h1 className={title({ size: "lg" })}>Page Not Found</h1>
				<p className="text-gray-600 max-w-sm mx-auto text-center">
					The page you're looking for doesn't exist or has been moved.
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
					<Link to="/" className={button({ color: "primary", radius: "full" })}>
						Go Home
					</Link>
					<Link
						to="/tournaments"
						className={button({
							variant: "outline",
							radius: "full",
							color: "secondary",
						})}
					>
						Browse Tournaments
					</Link>
				</div>
			</div>
		</DefaultLayout>
	);
}
