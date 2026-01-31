import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "ahooks";
import { CircleCheck, CircleX } from "lucide-react";
import { Suspense, useState } from "react";
import { Header, type Key } from "react-aria-components";
import type { Role } from "@/auth/permissions";
import { UpdateUserForm } from "@/components/admin/update-user-form";
import { SearchField } from "@/components/base/search-field";
import { Tab, TabList, Tabs } from "@/components/base/tabs";
import { usersQueryOptions } from "@/data/users";
import { title } from "../base/primitives";

type SearchType = "name" | "email" | "phone";

export function UsersList() {
	const [query, setQuery] = useState("");
	const [searchType, setSearchType] = useState<SearchType>("name");

	const debouncedQuery = useDebounce(query, {
		wait: query.length <= 3 ? 0 : 500,
	});

	const searchOptions = usersQueryOptions({
		query: debouncedQuery,
		searchType,
	});

	const { data, refetch, isLoading } = useQuery({
		...searchOptions,
		enabled: debouncedQuery.length >= 3,
	});

	const users = useDebounce(data?.users, {
		wait: data?.users.length === 0 ? 0 : 250,
	});

	const placeholders: Record<SearchType, string> = {
		name: "Search by name...",
		email: "Search by email...",
		phone: "Search by phone (e.g. +1555...)",
	};

	return (
		<section className="flex flex-col space-y-6">
			<Header className={title({ size: "sm" })}>Users</Header>

			<Tabs
				selectedKey={searchType}
				onSelectionChange={(key: Key) => {
					setSearchType(key as SearchType);
					setQuery("");
				}}
			>
				<TabList>
					<Tab id="name">Name</Tab>
					<Tab id="email">Email</Tab>
					<Tab id="phone">Phone</Tab>
				</TabList>
			</Tabs>

			<SearchField
				value={query}
				onChange={(value) => setQuery(value)}
				placeholder={placeholders[searchType]}
			/>

			<Suspense>
				<div className="flex flex-col items-stretch space-y-2">
					<div className="grid grid-cols-12 gap-2 px-2 text-sm font-medium text-gray-600">
						<span className="col-span-3">Name</span>
						<span className="col-span-4">Email</span>
						<span className="col-span-3">Phone</span>
						<span className="col-span-2">Role</span>
					</div>

					{users?.map((user) => (
						<UserRow
							key={user.id}
							user={user}
							queryKey={searchOptions.queryKey}
							refetch={refetch}
						/>
					))}

					{(!users || users?.length === 0) && (
						<div className="bg-white rounded-lg px-4 py-3 border border-gray-300 text-gray-600">
							{isLoading
								? "Loading..."
								: query.length < 3
									? "Enter at least 3 characters to search."
									: "No users found."}
						</div>
					)}
				</div>
			</Suspense>
		</section>
	);
}

function UserRow({
	user,
	queryKey,
	refetch,
}: {
	user: {
		id: string;
		name: string;
		email: string;
		emailVerified: boolean;
		phoneNumber: string;
		phoneNumberVerified: boolean;
		role: string | null;
	};
	queryKey: unknown[];
	refetch: () => void;
}) {
	return (
		<div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
			<div className="grid grid-cols-12 gap-2 px-3 py-2 items-center text-sm">
				<span className="col-span-3 font-medium truncate" title={user.name}>
					{user.name}
				</span>
				<span className="col-span-4 flex items-center gap-1 truncate">
					<span className="truncate" title={user.email}>
						{user.email}
					</span>
					{user.emailVerified ? (
						<CircleCheck className="text-green-500 shrink-0" size={14} />
					) : (
						<CircleX className="text-gray-400 shrink-0" size={14} />
					)}
				</span>
				<span className="col-span-3 flex items-center gap-1 truncate">
					<span className="truncate" title={user.phoneNumber}>
						{user.phoneNumber || "—"}
					</span>
					{user.phoneNumber &&
						(user.phoneNumberVerified ? (
							<CircleCheck className="text-green-500 shrink-0" size={14} />
						) : (
							<CircleX className="text-gray-400 shrink-0" size={14} />
						))}
				</span>
				<span className="col-span-2">
					<UpdateUserForm
						id={user.id}
						name={user.name}
						role={user.role as Role}
						queryKey={queryKey}
						refetch={refetch}
					/>
				</span>
			</div>
		</div>
	);
}
