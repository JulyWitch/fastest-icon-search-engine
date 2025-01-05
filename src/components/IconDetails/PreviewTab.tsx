import React from "react";
import { Download } from "lucide-react";
import { Icon } from "../../types/icons";

interface PreviewTabProps {
	icon: Icon;
	onDownload: () => void;
}

export function PreviewTab({ icon, onDownload }: PreviewTabProps) {
	return (
		<div className="flex flex-col items-center">
			<img
				src={icon.path}
				alt={icon.keywords[0]}
				className="w-32 h-32 mb-6"
			/>

			<div className="flex gap-2 mb-6">
				<button
					onClick={onDownload}
					className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
				>
					<Download className="h-5 w-5" />
					Download SVG
				</button>
			</div>
		</div>
	);
}
