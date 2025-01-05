import React, { useState } from "react";
import { X } from "lucide-react";
import { Icon } from "../../types/icons";
import { IconCredit } from "./IconCredit";
import { Tabs } from "./Tabs";
import { PreviewTab } from "./PreviewTab";
import { CodeTab } from "./CodeTab";
import { ReactTab } from "./ReactTab";

interface IconDetailsProps {
	icon: Icon | null;
	onClose: () => void;
}

export function IconDetails({ icon, onClose }: IconDetailsProps) {
	const [activeTab, setActiveTab] = useState("Preview");

	if (!icon) return null;

	const handleDownload = async () => {
		try {
			const response = await fetch(icon.path);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = icon.path.split("/").pop() || "icon.svg";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error downloading icon:", error);
		}
	};

	return (
		<div className="sticky right-0 top-0 h-screen min-w-96 max-w-96 bg-white shaow-lg p-6 transform transition-transform duration-300 ease-in-out">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-xl font-semibold">
					Icon Details
				</h2>
				<button
					onClick={onClose}
					className="p-2 hover:bg-gray-100 rounded-full"
				>
					<X className="h-6 w-6" />
				</button>
			</div>

			<IconCredit iconPath={icon.path} />

			<Tabs
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>

			{activeTab === "Preview" && (
				<PreviewTab
					icon={icon}
					onDownload={handleDownload}
				/>
			)}
			{activeTab === "Code" && (
				<CodeTab iconPath={icon.path} />
			)}
			{activeTab === "React" && <ReactTab />}
		</div>
	);
}
