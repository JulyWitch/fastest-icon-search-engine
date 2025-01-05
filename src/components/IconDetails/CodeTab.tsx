import React, { useState, useEffect } from "react";
import { CopyButton } from "./CopyButton";

interface CodeTabProps {
	iconPath: string;
}

export function CodeTab({ iconPath }: CodeTabProps) {
	const [svgCode, setSvgCode] = useState<string>("");

	useEffect(() => {
		fetch(iconPath)
			.then((response) => response.text())
			.then(setSvgCode)
			.catch(console.error);
	}, [iconPath]);

	return (
		<>
			<div className="flex justify-end mb-2">
				<CopyButton text={svgCode} />
			</div>
			<pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
				<code>{svgCode}</code>
			</pre>
		</>
	);
}
