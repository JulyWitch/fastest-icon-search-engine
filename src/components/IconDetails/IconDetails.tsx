import React, { useState, useEffect } from "react";
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
	const [startY, setStartY] = useState(0);
	const [currentY, setCurrentY] = useState(0);

	// Lock/unlock body scroll when bottom sheet is shown/hidden on mobile
	useEffect(() => {
		if (icon && window.innerWidth < 768) {
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = "auto";
			};
		}
	}, [icon]);

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

	const handleTouchStart = (e: React.TouchEvent) => {
		const touch = e.touches[0];
		const target = e.target as HTMLElement;

		// Allow scrolling of content inside the bottom sheet
		const content = target.closest(".content-scroll");
		if (content) {
			const isScrollable =
				content.scrollHeight > content.clientHeight;
			if (isScrollable && content.scrollTop > 0) {
				return;
			}
		}

		setStartY(touch.clientY);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		const touch = e.touches[0];
		const target = e.target as HTMLElement;

		// Check if we're scrolling inside content
		const content = target.closest(".content-scroll");
		if (content) {
			const isScrollable =
				content.scrollHeight > content.clientHeight;
			if (isScrollable && content.scrollTop > 0) {
				return;
			}
		}

		const deltaY = touch.clientY - startY;
		if (deltaY > 0) {
			e.preventDefault();
			setCurrentY(deltaY);
		}
	};

	const handleTouchEnd = () => {
		if (currentY > 150) {
			onClose();
		}
		setCurrentY(0);
	};

	return (
		<>
			{icon && (
				<div
					className="fixed inset-0 bg-black/50 md:hidden"
					onClick={onClose}
				/>
			)}

			<div
				className={`
          md:sticky md:right-0 md:top-0 md:h-screen md:min-w-96 md:max-w-96 md:shadow-lg
          fixed inset-x-0 bottom-0 w-full h-[85vh] bg-white shadow-lg rounded-t-xl
          transform transition-transform duration-200 ease-out md:rounded-none
          ${!icon ? "translate-y-full md:translate-y-0" : "translate-y-0"}
          ${!icon && "md:block hidden"}
          z-50
        `}
				style={{
					transform: currentY
						? `translateY(${currentY}px)`
						: undefined,
				}}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				<div className="h-1.5 w-12 bg-gray-300 rounded-full mx-auto mt-4 mb-2 md:hidden" />

				<div className="p-6 h-full flex flex-col">
					<div className="flex justify-between items-center mb-6 flex-shrink-0">
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

					<div className="content-scroll flex-1 overflow-y-auto">
						{icon == null ? (
							<p>
								Please select an
								icon
							</p>
						) : (
							<>
								<IconCredit
									iconPath={
										icon.path
									}
								/>
								<Tabs
									activeTab={
										activeTab
									}
									onTabChange={
										setActiveTab
									}
								/>
								{activeTab ===
									"Preview" && (
									<PreviewTab
										icon={
											icon
										}
										onDownload={
											handleDownload
										}
									/>
								)}
								{activeTab ===
									"Code" && (
									<CodeTab
										iconPath={
											icon.path
										}
									/>
								)}
								{activeTab ===
									"React" && (
									<ReactTab />
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
