import type { AnyFieldApi } from "@tanstack/react-form";
import { type ReactNode, useState } from "react";
import { useViewer } from "@/auth/shared";
import { DropZone } from "@/components/base/upload-image/dropzone";
import { Modal, ModalHeading } from "../../modal";
import { UploadImageModal } from "../../upload-image";
import { Uploader } from "../../upload-image/uploader";

export type ImageUploadFieldProps = {
	className?: string;
	label?: ReactNode;
	isRequired?: boolean;
	field: AnyFieldApi;
};

export function ImageUploadField({
	className,
	label,
	isRequired,
	field,
}: ImageUploadFieldProps) {
	const viewer = useViewer();

	const [files, setFiles] = useState<File[] | undefined>(undefined);

	return (
		<div className={className}>
			{files ? (
				<Modal isOpen={true} onOpenChange={() => setFiles(undefined)}>
					<div className="p-3 flex flex-col space-y-8">
						<ModalHeading>Edit your profile photo</ModalHeading>

						<Uploader
							bucket="profiles"
							prefix={`${viewer?.id}/photo`}
							initialFiles={files}
							circular={true}
							onUploadSuccess={(src) => {
								console.log(src);
							}}
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
