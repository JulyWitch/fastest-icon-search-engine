import { useEffect, useState } from "react";
import { FilterX, Star, Github } from "lucide-react";
import { IconSearcher } from "../utils/search";
import { Icon } from "../types/icons";
import { IconDetails } from "./IconDetails/index";
import { useUrlState } from "../hooks/useUrlState";

export function Search({ searcher }: { searcher: IconSearcher }) {
	const [packs, setPacks] = useUrlState<string[]>("packs", []);
	const [icons, setIcons] = useState<Icon[]>(searcher.search("", packs));
	const [searchQuery, setSearchQuery] = useUrlState("query", "");
	const [selectedIcon, setSelectedIcon] = useUrlState<Icon | null>(
		"selected",
		null,
	);
	const packageNames = searcher.getPackageNames();

	useEffect(() => {
		setIcons(searcher.search(searchQuery, packs));
	}, [searchQuery, setIcons, searcher, packs]);

	return (
		<div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
			<div className="bg-gray-900 p-4 text-white md:hidden">
				<h1 className="text-xl font-light mb-4">
					<span className="text-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent font-black">
						FASTEST
					</span>{" "}
					Icon Search Engine
				</h1>

				<div className="mb-4">
					<input
						type="text"
						placeholder={`Search ${
							packs.length === 0
								? searcher.count
								: packageNames
										.filter(
											(
												v,
											) =>
												packs.includes(
													v.name,
												),
										)
										.reduce(
											(
												acc,
												curr,
											) =>
												acc +
												curr.count,
											0,
										)
						} icons...`}
						value={searchQuery}
						onChange={(e) =>
							setSearchQuery(
								e.target.value,
							)
						}
						className="w-full bg-gray-800 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div className="flex gap-2 mb-4">
					<a
						href="https://github.com/julywitch/fastest-icon-search-engine"
						target="_blank"
						rel="noopener noreferrer"
						className="flex flex-1 items-center justify-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm"
					>
						<Star className="w-4 h-4" />
						<span>Star</span>
					</a>
					<a
						href="https://github.com/julywitch/fastest-icon-search-engine"
						target="_blank"
						rel="noopener noreferrer"
						className="flex flex-1 items-center justify-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm"
					>
						<Github className="w-4 h-4" />
						<span>Contribute</span>
					</a>
				</div>

				<div className="overflow-x-auto">
					<div className="flex gap-2 pb-2">
						{packageNames.map(
							({ name, count }) => (
								<button
									key={
										name
									}
									onClick={() => {
										setPacks(
											packs.includes(
												name,
											)
												? packs.filter(
														(
															p,
														) =>
															p !==
															name,
													)
												: [
														...packs,
														name,
													],
										);
									}}
									className={`flex-none px-3 py-1.5 rounded-full text-sm transition-colors
                ${
			packs.includes(name)
				? "bg-blue-600 text-white"
				: "bg-gray-800 text-gray-300"
		}`}
								>
									{name} (
									{count})
								</button>
							),
						)}
					</div>
				</div>
			</div>
			<div className="hidden md:block bg-gray-900 h-screen sticky top-0 w-80 p-6 overflow-y-auto text-white">
				<h1 className="text-2xl font-light mb-8 whitespace-pre-line">
					<span className="text-4xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient font-black">
						FASTEST
					</span>
					{"\n"}Icon Search Engine
				</h1>

				<div className="relative mb-6">
					<input
						type="text"
						placeholder={`Search ${
							packs.length === 0
								? searcher.count
								: packageNames
										.filter(
											(
												v,
											) =>
												packs.includes(
													v.name,
												),
										)
										.reduce(
											(
												acc,
												curr,
											) =>
												acc +
												curr.count,
											0,
										)
						} icons...`}
						defaultValue={searchQuery}
						onChange={(e) =>
							setSearchQuery(
								e.target.value,
							)
						}
						className="w-full bg-gray-800 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>

					{packs.length > 0 && (
						<div className="flex flex-row gap-2 items-center justify-center mt-4">
							<div className="flex flex-row flex-1 gap-2 overflow-x-auto">
								{packs.map(
									(v) => (
										<div
											key={
												v
											}
											className="bg-blue-700 px-2 py-1 rounded cursor-pointer"
											onClick={() =>
												setPacks(
													packs.filter(
														(
															e,
														) =>
															e !=
															v,
													),
												)
											}
										>
											{
												v
											}
										</div>
									),
								)}
							</div>
							<div
								className="p-2 bg-red-600 rounded cursor-pointer"
								onClick={() =>
									setPacks(
										[],
									)
								}
							>
								<FilterX className="w-4 h-4" />
							</div>
						</div>
					)}
				</div>

				<div className="flex gap-3 mb-6">
					<a
						href="https://github.com/julywitch/fastest-icon-search-engine"
						target="_blank"
						rel="noopener noreferrer"
						className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
					>
						<Star className="w-4 h-4" />
						<span>Star</span>
					</a>
					<a
						href="https://github.com/julywitch/fastest-icon-search-engine"
						target="_blank"
						rel="noopener noreferrer"
						className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
					>
						<Github className="w-4 h-4" />
						<span>Contribute</span>
					</a>
				</div>

				<div className="space-y-2">
					{packageNames.map(({ name, count }) => (
						<button
							key={name}
							onClick={() => {
								setPacks(
									packs.includes(
										name,
									)
										? packs.filter(
												(
													p,
												) =>
													p !==
													name,
											)
										: [
												...packs,
												name,
											],
								);
							}}
							className={`w-full group text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-between
              ${
			packs.includes(name)
				? "bg-gray-600 hover:bg-gray-500"
				: "bg-gray-800 hover:bg-gray-700"
		}`}
						>
							<span className="text-gray-300 group-hover:text-white transition-colors">
								{name}
							</span>
							<span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-400 group-hover:bg-gray-600 group-hover:text-gray-200 transition-colors">
								{count}
							</span>
						</button>
					))}
				</div>
			</div>

			<div className="flex-1 p-4">
				{packs.length > 0 && (
					<div className="md:hidden flex flex-wrap gap-2 mb-4">
						{packs.map((pack) => (
							<button
								key={pack}
								onClick={() =>
									setPacks(
										packs.filter(
											(
												p,
											) =>
												p !==
												pack,
										),
									)
								}
								className="flex items-center gap-1 bg-blue-700 px-2 py-1 rounded text-white text-sm"
							>
								{pack}
								<FilterX className="w-4 h-4" />
							</button>
						))}
					</div>
				)}

				<div className="grid grid-cols-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
					{icons.map((icon) => (
						<button
							key={icon.path}
							onClick={() =>
								setSelectedIcon(
									icon,
								)
							}
							className="w-full overflow-hidden p-1 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col items-center"
						>
							<img
								src={icon.path}
								alt={icon.path}
								className="w-7 h-7 object-contain"
							/>
							<span className="mt-2 text-xs text-gray-600 truncate w-full text-center">
								{icon.path.substring(
									icon.path.indexOf(
										"-",
									) + 1,
									icon.path.lastIndexOf(
										".",
									),
								)}
							</span>
							<span className="bg-blue-200 self-start font-medium rounded px-1 py-0.5 m-0.5 text-xs text-gray-600 truncate">
								{icon.path.substring(
									icon.path.lastIndexOf(
										"/",
									) + 1,
									icon.path.indexOf(
										"-",
									),
								)}
							</span>
						</button>
					))}
				</div>
			</div>

			<IconDetails
				icon={selectedIcon}
				onClose={() => setSelectedIcon(null)}
			/>
		</div>
	);
}
