import { SEO } from "./components/SEO";
import { IconSearcher } from "./utils/search";
import { Search } from "./components/Search";
import { useEffect, useMemo, useState } from "react";

export default function App() {
	const [status, setStatus] = useState("idle");
	const searcher = useMemo(() => {
		return new IconSearcher();
	}, []);

	useEffect(() => {
		if (status === "idle") {
			setStatus("loading");
			searcher.initialize("icon-search-index.bin.gz").then(
				() => setStatus("done"),
			);
		}
	}, [searcher, setStatus, status]);

	return (
		<>
			<SEO />
			{status == "done" && (
				<div className="min-h-screen bg-gray-50">
					<Search searcher={searcher} />
				</div>
			)}
		</>
	);
}
