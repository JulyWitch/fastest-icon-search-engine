import React, { useState } from "react";
import { Icon } from "../../types/icons";
import { IconCredit } from "./IconCredit";
import { Tabs } from "./Tabs";
import { PreviewTab } from "./PreviewTab";
import { CodeTab } from "./CodeTab";
import { ReactTab } from "./ReactTab";
import { X } from "lucide-react";

interface IconDetailsProps {
	icon: Icon | null;
	onClose: () => void;
}

export function IconDetails({ icon, onClose }: IconDetailsProps) {
	const [activeTab, setActiveTab] = useState("Preview");

	const handleDownload = async () => {
		try {
			if (icon == null) return;
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
		<div
			className={`
      md:sticky md:right-0 md:top-0 md:h-screen md:min-w-96 md:max-w-96 md:shadow-lg
      fixed inset-x-0 bottom-0 w-full h-screen bg-white shadow-lg
      transform transition-all duration-300 ease-in-out
      ${icon ? "translate-y-0" : "translate-y-full md:translate-y-0"}
      ${!icon && "md:block md:visible invisible"}
    `}
		>
			<div className="p-6">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-semibold">
						Icon Details
					</h2>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
						aria-label="Close details"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{icon == null ? (
					<p>Please select an icon</p>
				) : (
					<>
						<IconCredit
							iconPath={icon.path}
						/>
						<Tabs
							activeTab={activeTab}
							onTabChange={
								setActiveTab
							}
						/>
						{activeTab === "Preview" && (
							<PreviewTab
								icon={icon}
								onDownload={
									handleDownload
								}
							/>
						)}
						{activeTab === "Code" && (
							<CodeTab
								iconPath={
									icon.path
								}
							/>
						)}
						{activeTab === "React" && (
							<ReactTab />
						)}
					</>
				)}
			</div>
		</div>
	);
}
