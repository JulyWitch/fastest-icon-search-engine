import { IconPack } from "../types/icon-config";

let iconConfigCache: IconPack[] | null = null;

export async function getIconConfig(): Promise<IconPack[]> {
	if (iconConfigCache) {
		return iconConfigCache;
	}

	try {
		const response = await fetch("/icons-config.json");
		const data = await response.json();
		iconConfigCache = data;
		return data;
	} catch (error) {
		console.error("Failed to load icons config:", error);
		return [];
	}
}

export function getIconPrefix(path: string): string {
	return path.substring(path.lastIndexOf("/") + 1, path.indexOf("-"));
}

export async function getIconPackInfo(
	iconPath: string,
): Promise<IconPack | null> {
	const prefix = getIconPrefix(iconPath);
	const configs = await getIconConfig();

	return (
		configs.find((config) =>
			config.sources.some(
				(source) => source.prefix === prefix,
			),
		) || null
	);
}
