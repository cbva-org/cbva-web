import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "ahooks";
import { CircleCheck, CircleX, MoreVertical } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import {
	DialogTrigger,
	Header,
	Heading,
	type Key,
	TableBody,
} from "react-aria-components";
import { authClient } from "@/auth/client";
import type { Role } from "@/auth/permissions";
import { UpdateUserForm } from "@/components/admin/update-user-form";
import { Button } from "@/components/base/button";
import { CopyButton } from "@/components/base/copy-button";
import {
	DropdownMenu,
	DropdownMenuItem,
} from "@/components/base/dropdown-menu";
import { Modal } from "@/components/base/modal";
import { SearchField } from "@/components/base/search-field";
import {
	Table,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@/components/base/table";
import { Tab, TabList, Tabs } from "@/components/base/tabs";
import {
	adminVerifyEmailMutationOptions,
	adminVerifyPhoneMutationOptions,
	usersQueryOptions,
} from "@/data/users";
import type { User } from "@/db/schema";
import { title } from "../base/primitives";

function secureRandom() {
	const array = new Uint8Array(8);
	const buf = window.crypto.getRandomValues(array);
	const offset = Math.random() < 0.5 ? 0 : buf.length - 4;
	const dataView = new DataView(buf.buffer);
	const intVal = dataView.getUint32(offset, true);
	const normalized = intVal / (2 ** 32 - 1);
	return normalized;
}

function generatePassword() {
	const length = 32;
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
	let password = "";
	for (let i = 0; i < length; i++) {
		password += chars.charAt(Math.floor(secureRandom() * chars.length));
	}
	return password;
}

type SearchType = "name" | "email" | "phone";

const roleLabels: Record<string, string> = {
	user: "User",
	td: "Director",
	admin: "Admin",
};

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
				{users && users.length > 0 ? (
					<Table aria-label="Users">
						<TableHeader>
							<TableColumn isRowHeader width="20%">
								Name
							</TableColumn>
							<TableColumn width="30%">Email</TableColumn>
							<TableColumn width="20%">Phone</TableColumn>
							<TableColumn width="15%">Role</TableColumn>
							<TableColumn width="15%">Actions</TableColumn>
						</TableHeader>
						<TableBody>
							{users.map((user) => (
								<UserRow
									key={user.id}
									user={user}
									queryKey={searchOptions.queryKey}
									refetch={refetch}
								/>
							))}
						</TableBody>
					</Table>
				) : (
					<div className="bg-white rounded-lg px-4 py-3 border border-gray-300 text-gray-600">
						{isLoading
							? "Loading..."
							: query.length < 3
								? "Enter at least 3 characters to search."
								: "No users found."}
					</div>
				)}
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
	const [isEditOpen, setEditOpen] = useState(false);
	const [isPasswordOpen, setPasswordOpen] = useState(false);
	const queryClient = useQueryClient();

	const updateUserInCache = (updates: Partial<User>) => {
		queryClient.setQueryData(queryKey, (data: { users: User[] }) => ({
			...data,
			users: data.users.map((u) =>
				u.id === user.id ? { ...u, ...updates } : u,
			),
		}));
	};

	const { mutate: verifyEmail } = useMutation({
		...adminVerifyEmailMutationOptions(),
		onSuccess: () => {
			updateUserInCache({ emailVerified: true });
		},
	});

	const { mutate: verifyPhone } = useMutation({
		...adminVerifyPhoneMutationOptions(),
		onSuccess: () => {
			updateUserInCache({ phoneNumberVerified: true });
		},
	});

	const {
		mutate: setTempPassword,
		data: generatedPassword,
		reset: resetPasswordMutation,
		isPending: isSettingPassword,
	} = useMutation({
		mutationFn: async () => {
			const password = generatePassword();

			const res = await authClient.admin.setUserPassword({
				userId: user.id,
				newPassword: password,
			});

			if (res.error) {
				throw res.error;
			}

			const { error } = await authClient.admin.updateUser({
				userId: user.id,
				data: { needsPasswordChange: true },
			});

			if (error) {
				throw error;
			}

			return password;
		},
	});

	useEffect(() => {
		if (!isPasswordOpen) {
			resetPasswordMutation();
		}
	}, [isPasswordOpen, resetPasswordMutation]);

	return (
		<TableRow>
			<TableCell>
				<span className="font-medium">{user.name}</span>
			</TableCell>
			<TableCell>
				<span className="flex items-center gap-1.5">
					<span className="truncate">{user.email}</span>
					{user.emailVerified ? (
						<CircleCheck className="text-green-500 shrink-0" size={14} />
					) : (
						<CircleX className="text-gray-400 shrink-0" size={14} />
					)}
				</span>
			</TableCell>
			<TableCell>
				<span className="flex items-center gap-1.5">
					<span className="truncate">{user.phoneNumber || "—"}</span>
					{user.phoneNumber &&
						(user.phoneNumberVerified ? (
							<CircleCheck className="text-green-500 shrink-0" size={14} />
						) : (
							<CircleX className="text-gray-400 shrink-0" size={14} />
						))}
				</span>
			</TableCell>
			<TableCell>
				<span className="capitalize">
					{roleLabels[user.role ?? "user"] ?? user.role}
				</span>
			</TableCell>
			<TableCell>
				<DropdownMenu
					label="User actions"
					buttonIcon={<MoreVertical size={16} />}
				>
					<DropdownMenuItem id="edit" onAction={() => setEditOpen(true)}>
						Edit User
					</DropdownMenuItem>
					<DropdownMenuItem
						id="temp-password"
						onAction={() => setPasswordOpen(true)}
					>
						Generate Temp Password
					</DropdownMenuItem>
					<DropdownMenuItem
						id="verify-email"
						isDisabled={user.emailVerified}
						onAction={() => verifyEmail({ id: user.id })}
					>
						{user.emailVerified ? "Email Verified" : "Verify Email"}
					</DropdownMenuItem>
					<DropdownMenuItem
						id="verify-phone"
						isDisabled={!user.phoneNumber || user.phoneNumberVerified}
						onAction={() => verifyPhone({ id: user.id })}
					>
						{user.phoneNumberVerified ? "Phone Verified" : "Verify Phone"}
					</DropdownMenuItem>
				</DropdownMenu>

				<DialogTrigger isOpen={isEditOpen} onOpenChange={setEditOpen}>
					<Modal isDismissable>
						<div className="p-4 flex flex-col space-y-4">
							<Heading className={title({ size: "sm" })} slot="title">
								Edit User
							</Heading>

							<UpdateUserForm
								id={user.id}
								name={user.name}
								role={user.role as Role}
								queryKey={queryKey}
								refetch={refetch}
								onSuccess={() => setEditOpen(false)}
							/>
						</div>
					</Modal>
				</DialogTrigger>

				<DialogTrigger isOpen={isPasswordOpen} onOpenChange={setPasswordOpen}>
					<Modal isDismissable>
						<div className="p-4 flex flex-col space-y-4">
							<Heading className={title({ size: "sm" })} slot="title">
								Generate Temporary Password
							</Heading>

							{!generatedPassword ? (
								<>
									<p>
										Generate a temporary password for{" "}
										<span className="font-semibold">{user.name}</span>. They will
										be prompted to change it on next login.
									</p>
									<div className="flex justify-end gap-2">
										<Button onPress={() => setPasswordOpen(false)}>
											Cancel
										</Button>
										<Button
											color="primary"
											onPress={() => setTempPassword()}
											isDisabled={isSettingPassword}
										>
											{isSettingPassword ? "Generating..." : "Generate"}
										</Button>
									</div>
								</>
							) : (
								<>
									<p>
										Copy the password below to send to{" "}
										<span className="font-semibold">{user.name}</span>. You will
										not be able to see this password again.
									</p>
									<div className="rounded-lg border border-gray-300 p-3 flex items-center justify-between gap-2 bg-gray-50">
										<code className="text-sm break-all">{generatedPassword}</code>
										<CopyButton value={generatedPassword} />
									</div>
									<div className="flex justify-end">
										<Button color="primary" onPress={() => setPasswordOpen(false)}>
											Done
										</Button>
									</div>
								</>
							)}
						</div>
					</Modal>
				</DialogTrigger>
			</TableCell>
		</TableRow>
	);
}
