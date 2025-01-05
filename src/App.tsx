import { SEO } from "./components/SEO";
import { IconSearcher } from "./utils/search";
import { Search } from "./components/Search";
import { useEffect, useMemo, useState } from "react";

export default function App() {
	const [initialized, setInitialized] = useState(false);
	const searcher = useMemo(() => {
		return new IconSearcher();
	}, []);

	useEffect(() => {
		searcher.initialize("icon-search-index.bin.gz").then(() =>
			setInitialized(true),
		);
	}, [searcher]);

	return (
		<>
			<SEO />
			{initialized && (
				<div className="min-h-screen bg-gray-50">
					<Search searcher={searcher} />
				</div>
			)}
		</>
	);
}
