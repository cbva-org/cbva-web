import { EditIcon } from "lucide-react";
import { useState } from "react";
import { DialogTrigger } from "react-aria-components";

import { Button } from "../base/button";
import { Modal, ModalHeading } from "../base/modal";
import { Uploader } from "../base/upload-image/uploader";

export function EditVenueImage({
	venueId,
	onUploadSuccess,
}: {
	venueId: number;
	onUploadSuccess: (source: string) => void;
}) {
	const [open, setOpen] = useState(false);

	return (
		<DialogTrigger isOpen={open} onOpenChange={setOpen}>
			<Button variant="icon" className="absolute top-3 right-3">
				<EditIcon />
			</Button>
			<Modal>
				<div className="p-3 flex flex-col space-y-8">
					<ModalHeading>Upload Image</ModalHeading>

					<Uploader
						bucket="venues"
						prefix={`headers/${venueId}`}
						onUploadSuccess={onUploadSuccess}
					/>
				</div>
			</Modal>
		</DialogTrigger>
	);
}
