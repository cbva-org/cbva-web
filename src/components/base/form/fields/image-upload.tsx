import type { AnyFieldApi } from "@tanstack/react-form";
import { type ReactNode, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useViewer } from "@/auth/shared";
import { DropZone } from "@/components/base/upload-image/dropzone";
import { ProfilePhoto } from "@/components/profiles/photo";
import { Label } from "../../field";
import { Modal, ModalHeading } from "../../modal";
import { UploadImageModal } from "../../upload-image";
import { Uploader, type UploaderProps } from "../../upload-image/uploader";

const STORAGE_URL = `${import.meta.env.VITE_SUPABASE_STORAGE_URL}/storage/v1/object/public`;

export type ImageUploadFieldProps = {
	className?: string;
	label?: ReactNode;
	isRequired?: boolean;
	field: AnyFieldApi;
} & Pick<UploaderProps, "bucket" | "prefix" | "circular">;

export function ImageUploadField({
	className,
	label,
	isRequired,
	field,
	bucket,
	prefix,
	circular,
}: ImageUploadFieldProps) {
	const [files, setFiles] = useState<File[] | undefined>(undefined);

	// TODO: make better
	// - preview should be clearable
	// - preview should only be round if `circular === true`
	// - consider constructing url after upload and saving that in the database

	const src = field.state.value
		? `${STORAGE_URL}/${bucket}/${field.state.value}`
		: null;

	return (
		<div className={twMerge("flex flex-col gap-1", className)}>
			{label && <Label isRequired={isRequired}>{label}</Label>}

			{src ? (
				<div className="max-w-50 w-36 h-36 rounded-full overflow-hidden border border-gray-300">
					<img
						src={src}
						alt="Cropped profile preview"
						className="w-full h-full object-cover"
					/>
				</div>
			) : files ? (
				<Modal isOpen={true} onOpenChange={() => setFiles(undefined)}>
					<div className="p-3 flex flex-col space-y-8">
						<ModalHeading>Edit your profile photo</ModalHeading>

						<Uploader
							bucket={bucket}
							prefix={prefix}
							circular={circular}
							initialFiles={files}
							onUploadSuccess={(src) => {
								field.handleChange(src);
							}}
							onCancel={() => setFiles(undefined)}
							onCancelEdit={() => setFiles(undefined)}
						/>
					</div>
				</Modal>
			) : (
				<DropZone
					onDrop={(files) => {
						setFiles(files);
					}}
				/>
			)}
		</div>
	);
}
