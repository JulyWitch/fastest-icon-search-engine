import { useEffect, useState } from "react";
import { IconSearcher } from "../utils/search";
import { Icon } from "../types/icons";
import { IconDetails } from "./IconDetails/index";
import { useUrlState } from "../hooks/useUrlState";
import { FilterX, LucideGithub, Star } from "lucide-react";

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
		<div className="flex flex-row">
			<div className="bg-gray-900 h-screen sticky w-96 left-0 top-0 p-6 overflow-y-auto text-white">
				<h1 className="text-2xl font-light mb-8 whitespace-pre-line">
					<span className="text-4xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient font-black">
						FASTEST
					</span>
					{"\n"}Icon Search Engine
				</h1>

				<div className="relative mb-6">
					<input
						type="text"
						placeholder={`Search in ${
							packs.length == 0
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
										.map(
											(
												v,
											) =>
												v.count,
										)
										.reduce(
											(
												acc,
												curr,
											) =>
												acc +
												curr,
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

					{packs.length > 0 && (
						<div className="flex flex-row gap-2 items-center justify-center">
							<div className="flex flex-row flex-1 gap-2 py-4 overflow-x-auto">
								{packs.map(
									(v) => (
										<div
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
								className="p-2 bg-red-600 rounded fill-white cursor-pointer"
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

				<div className="flex flex-row gap-3 mb-4">
					<a
						href="https://github.com/julywitch/fastest-icon-search-engine"
						target="_blank"
						rel="noopener noreferrer"
						className="flex flex-grow items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
					>
						<Star className="w-4 h-4" />
						<span>Star</span>
					</a>

					<a
						href="https://github.com/julywitch/fastest-icon-search-engine"
						target="_blank"
						className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
					>
						<LucideGithub className="w-4 h-4" />
						<span>Contribute</span>
					</a>
				</div>

				<div className="mt-8">
					<h2 className="text-lg font-semibold mb-4 text-gray-300">
						Packages
					</h2>
					<div className="flex flex-col gap-2">
						{packageNames.map(
							({ name, count }) => (
								<button
									key={
										name
									}
									onClick={() => {
										if (
											packs.includes(
												name,
											)
										)
											setPacks(
												packs.filter(
													(
														v,
													) =>
														v !==
														name,
												),
											);
										else
											setPacks(
												[
													...packs,
													name,
												],
											);
									}}
									className={`group text-left px-3 py-2 rounded-lg  transition-all duration-200 flex items-center justify-between ${
										packs.includes(
											name,
										)
											? "bg-gray-600 hover:bg-gray-500"
											: "bg-gray-800 hover:bg-gray-700"
									}`}
								>
									<span className="text-gray-300 group-hover:text-white transition-colors">
										{
											name
										}
									</span>
									<span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-400 group-hover:bg-gray-600 group-hover:text-gray-200 transition-colors">
										{
											count
										}
									</span>
								</button>
							),
						)}
					</div>
				</div>
			</div>

			<div className="flex flex-wrap gap-4 p-6 w-full h-min">
				{icons.map((icon) => (
					<button
						key={icon.path}
						onClick={() =>
							setSelectedIcon(icon)
						}
						className="w-28 h-min p-1 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col items-center"
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
			<IconDetails
				icon={selectedIcon}
				onClose={() => setSelectedIcon(null)}
			/>
		</div>
	);
}
