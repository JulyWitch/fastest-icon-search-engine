import { useEffect, useState } from "react";
import { IconPack } from "../../types/icon-config";
import { getIconPackInfo } from "../../utils/icon-config";

interface IconCreditProps {
	iconPath: string;
}

export function IconCredit({ iconPath }: IconCreditProps) {
	const [packInfo, setPackInfo] = useState<IconPack | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getIconPackInfo(iconPath)
			.then(setPackInfo)
			.finally(() => setLoading(false));
	}, [iconPath]);

	if (loading) {
		return (
			<div className="mb-6 p-4 bg-gray-50 rounded-lg animate-pulse">
				<div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
				<div className="h-4 bg-gray-200 rounded w-1/2"></div>
			</div>
		);
	}

	if (!packInfo) {
		return null;
	}

	return (
		<div className="mb-6 p-4 bg-gray-50 rounded-lg">
			<p className="text-sm text-gray-600 mb-2">
				This icon is part of the{" "}
				<strong>{packInfo.name}</strong> icon pack.{" "}
				<a
					href={packInfo.repository}
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-600 hover:underline"
				>
					View Repository
				</a>
			</p>
			<p className="text-sm text-gray-600">
				Licensed under{" "}
				<a
					href={packInfo.license.url}
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-600 hover:underline"
				>
					{packInfo.license.type} License
				</a>
			</p>
		</div>
	);
}
