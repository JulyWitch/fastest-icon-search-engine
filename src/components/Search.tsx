import React from "react";
import { FilterX, Star, Github } from "lucide-react";
import { IconSearcher } from "../utils/search";
import { Icon } from "../types/icons";
import { IconDetails } from "./IconDetails/index";
import { useUrlState } from "../hooks/useUrlState";

const Header = ({ title }: { title: string }) => (
	<h1 className="text-xl md:text-2xl font-light mb-4 md:mb-8 whitespace-pre-line">
		<span className="text-3xl md:text-4xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent font-black">
			{title}
		</span>
		{"\n"}Icon Search Engine
	</h1>
);

const SearchInput = ({
	placeholder,
	value,
	onChange,
}: {
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
}) => (
	<input
		type="text"
		placeholder={placeholder}
		value={value}
		onChange={(e) => onChange(e.target.value)}
		className="w-full bg-gray-800 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
	/>
);

const ActionButtons = () => (
	<div className="flex gap-3 mb-6">
		{["Star", "Contribute"].map((action) => (
			<a
				key={action}
				href="https://github.com/julywitch/fastest-icon-search-engine"
				target="_blank"
				rel="noopener noreferrer"
				className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
			>
				{action === "Star" ? (
					<Star className="w-4 h-4" />
				) : (
					<Github className="w-4 h-4" />
				)}
				<span>{action}</span>
			</a>
		))}
	</div>
);

const PackageFilter = ({
	packageNames,
	selectedPacks,
	onPackageToggle,
	onClearFilters,
}: {
	packageNames: Array<{ name: string; count: number }>;
	selectedPacks: string[];
	onPackageToggle: (packageName: string) => void;
	onClearFilters: () => void;
}) => {
	const PackageList = () => (
		<div className="overflow-x-auto md:overflow-x-hidden">
			<div className="flex flex-nowrap gap-2 pb-2 md:flex-col">
				{packageNames.map(({ name, count }) => (
					<button
						key={name}
						onClick={() =>
							onPackageToggle(name)
						}
						className={`flex-none px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-between
              ${
			selectedPacks.includes(name)
				? "bg-gray-600 hover:bg-gray-500"
				: "bg-gray-800 hover:bg-gray-700"
		}`}
					>
						<span className="text-gray-300 group-hover:text-white transition-colors">
							{name}
						</span>
						<span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-400 group-hover:bg-gray-600 group-hover:text-gray-200 transition-colors">
							{count}
						</span>
					</button>
				))}
			</div>
		</div>
	);

	return (
		<div className="space-y-2">
			{selectedPacks.length > 0 && (
				<div className="flex flex-row gap-2 items-center justify-center mt-4 mb-4">
					<div className="flex flex-row flex-1 gap-2 overflow-x-auto">
						{selectedPacks.map((pack) => (
							<div
								key={pack}
								className="bg-blue-700 px-2 py-1 rounded cursor-pointer whitespace-nowrap"
								onClick={() =>
									onPackageToggle(
										pack,
									)
								}
							>
								{pack}
							</div>
						))}
					</div>
					<div
						className="p-2 bg-red-600 rounded cursor-pointer flex-shrink-0"
						onClick={onClearFilters}
					>
						<FilterX className="w-4 h-4" />
					</div>
				</div>
			)}
			<PackageList />
		</div>
	);
};

const IconGrid = ({
	icons,
	onIconSelect,
}: {
	icons: Icon[];
	onIconSelect: (icon: Icon) => void;
}) => {
	const getIconName = (path: string): string =>
		path.substring(path.indexOf("-") + 1, path.lastIndexOf("."));

	const getPackageName = (path: string): string =>
		path.substring(path.lastIndexOf("/") + 1, path.indexOf("-"));

	return (
		<div className="grid grid-cols-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-1 md:gap-2">
			{icons.map((icon) => (
				<button
					key={icon.path}
					onClick={() => onIconSelect(icon)}
					className="w-full overflow-hidden p-1 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col items-center"
				>
					<img
						src={icon.path}
						alt={icon.path}
						className="w-7 h-7 object-contain"
					/>
					<span className="mt-2 text-xs text-gray-600 truncate w-full text-center">
						{getIconName(icon.path)}
					</span>
					<span className="bg-blue-200 self-start font-medium rounded px-1 py-0.5 m-0.5 text-xs text-gray-600 truncate">
						{getPackageName(icon.path)}
					</span>
				</button>
			))}
		</div>
	);
};

export function Search({ searcher }: { searcher: IconSearcher }) {
	const [packs, setPacks] = useUrlState<string[]>("packs", []);
	const [searchQuery, setSearchQuery] = useUrlState("query", "");
	const [selectedIcon, setSelectedIcon] = useUrlState<Icon | null>(
		"selected",
		null,
	);
	const [icons, setIcons] = React.useState<Icon[]>([]);
	const packageNames = searcher.getPackageNames();

	const getSelectedPackageCount = React.useMemo(
		() =>
			packs.length === 0
				? searcher.count
				: packageNames
						.filter((v) =>
							packs.includes(v.name),
						)
						.reduce(
							(acc, curr) =>
								acc +
								curr.count,
							0,
						),
		[packs, packageNames, searcher.count],
	);

	React.useEffect(() => {
		setIcons(searcher.search(searchQuery, packs));
	}, [searchQuery, packs, searcher]);

	const handlePackageToggle = React.useCallback(
		(packageName: string) => {
			setPacks(
				packs.includes(packageName)
					? packs.filter((p) => p !== packageName)
					: [...packs, packageName],
			);
		},
		[packs, setPacks],
	);

	return (
		<div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
			<aside className="bg-gray-900 p-4 md:p-6 text-white md:h-screen md:sticky md:top-0 md:w-80 md:overflow-y-auto">
				<Header title="FASTEST" />
				<div className="mb-6">
					<SearchInput
						placeholder={`Search ${getSelectedPackageCount} icons...`}
						value={searchQuery}
						onChange={setSearchQuery}
					/>
				</div>
				<ActionButtons />
				<PackageFilter
					packageNames={packageNames}
					selectedPacks={packs}
					onPackageToggle={handlePackageToggle}
					onClearFilters={() => setPacks([])}
				/>
			</aside>

			<main className="flex-1 p-4">
				<IconGrid
					icons={icons}
					onIconSelect={setSelectedIcon}
				/>
			</main>

			<IconDetails
				icon={selectedIcon}
				onClose={() => setSelectedIcon(null)}
			/>
		</div>
	);
}
