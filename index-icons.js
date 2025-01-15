import {
	readFileSync,
	mkdirSync,
	existsSync,
	rmSync,
	copyFileSync,
	writeFileSync,
} from "fs";
import { basename, join, parse } from "path";
import { execSync } from "child_process";
import { globSync } from "glob";
import { gzip } from "pako";
import { env } from "process";

const config = JSON.parse(
	readFileSync(
		env.NODE_ENV === "DEVELOPMENT"
			? "./public/icons-config-dev.json"
			: "./public/icons-config.json",
	),
);

class IconIndexer {
	constructor() {
		this.invertedIndex = {};
		this.documents = new Map();
		this.currentId = 0;
	}

	preprocessText(text) {
		return text
			.toLowerCase()
			.replace(/[^\w\s]/g, " ")
			.split(/\s+/)
			.filter(Boolean);
	}

	addDocument(path, text) {
		const docId = this.currentId.toString();
		const tokens = this.preprocessText(text);
		const uniqueTokens = new Set(tokens);

		this.documents.set(docId, path);

		uniqueTokens.forEach((term) => {
			if (!this.invertedIndex[term]) {
				this.invertedIndex[term] = new Set();
			}
			this.invertedIndex[term].add(docId);
		});

		this.currentId++;
	}

	createSearchIndex() {
		return {
			index: Object.fromEntries(this.documents),
			inverted: Object.fromEntries(
				Object.entries(this.invertedIndex).map(
					([term, docs]) => [
						term,
						Array.from(docs),
					],
				),
			),
		};
	}

	createCompressedBinaryIndex() {
		const commonPrefix = "public/icons/";

		const writeVarInt = (num) => {
			const bytes = [];
			do {
				let byte = num & 0x7f;
				num >>= 7;
				if (num > 0) byte |= 0x80;
				bytes.push(byte);
			} while (num > 0);
			return Buffer.from(bytes);
		};

		const indexParts = [];
		const invertedParts = [];
		let currPackageName;
		let prevPackageName;
		const documentsArray = Array.from(this.documents.values());

		this.documents.forEach((path) => {
			currPackageName = path.substring(
				path.lastIndexOf("/") + 1,
				path.indexOf("-"),
			);
			if (currPackageName !== prevPackageName) {
				indexParts.push(
					writeVarInt(
						documentsArray.filter((v) =>
							v.startsWith(
								`public/icons/${currPackageName}-`,
							),
						).length,
					),
				);
				indexParts.push(
					Buffer.from(currPackageName, "ascii"),
				);
				indexParts.push(Buffer.from([0]));
				console.log({
					currPackageName,
					legnth: documentsArray.filter((v) =>
						v.startsWith(
							`public/icons/${currPackageName}-`,
						),
					).length,
				});
			}
			const relativePath = path
				.replace(currPackageName + "-", "")
				.replace(commonPrefix, "")
				.replace(".svg", "");

			indexParts.push(Buffer.from(relativePath, "ascii"));
			indexParts.push(Buffer.from([0]));
			prevPackageName = currPackageName;
		});

		indexParts.push(Buffer.from([0]));

		const sortedTerms = Object.entries(this.invertedIndex).sort(
			([a], [b]) => a.localeCompare(b),
		);

		sortedTerms.forEach(([term, docIds]) => {
			invertedParts.push(Buffer.from(term, "ascii"));
			invertedParts.push(Buffer.from([0]));

			const docIdArray = Array.from(docIds)
				.map((id) => parseInt(id))
				.sort((a, b) => a - b);
			invertedParts.push(writeVarInt(docIdArray.length));

			let lastId = 0;
			docIdArray.forEach((id) => {
				const delta = id - lastId;
				invertedParts.push(writeVarInt(delta));
				lastId = id;
			});
		});

		const fullBuffer = Buffer.concat([
			writeVarInt(this.documents.size),
			...indexParts,
			...invertedParts,
		]);

		return gzip(fullBuffer, {
			level: 9,
			memLevel: 9,
			strategy: 2,
		});
	}
}

mkdirSync("public/icons", { recursive: true });
mkdirSync("temp", { recursive: true });

const indexer = new IconIndexer();

config.forEach((source) => {
	const {
		name: sourceName,
		repository: repoUrl,
		sources: sourceConfigs,
	} = source;
	const repoName = basename(repoUrl).replace(".git", "");
	const repoPath = `temp/${repoName}`;

	console.log(`Processing ${sourceName} icons...`);

	if (existsSync(repoPath)) {
		rmSync(repoPath, { recursive: true, force: true });
	}
	execSync(`git clone --depth 1 ${repoUrl} ${repoPath}`, {
		stdio: "ignore",
	});

	sourceConfigs.forEach(
		({ path: sourcePath, prefix, postfix, keywords = [] }) => {
			const iconPath = join(repoPath, sourcePath);
			if (!existsSync(iconPath)) {
				console.warn(
					`Warning: Path ${sourcePath} not found in repository`,
				);
				return;
			}

			globSync("*.svg", { cwd: iconPath }).forEach(
				(svgFile) => {
					const baseName = parse(svgFile).name;
					const sanitizedName =
						`${prefix}-${baseName}${postfix ? `-${postfix}` : ""}.svg`
							.replace(
								/[^a-zA-Z0-9.-]/g,
								"-",
							)
							.toLowerCase();
					const targetPath = `public/icons/${sanitizedName}`;

					copyFileSync(
						join(iconPath, svgFile),
						targetPath,
					);

					const docText = `${sourceName} ${baseName} ${postfix ?? ""} ${keywords.join(" ")}`;
					indexer.addDocument(
						targetPath,
						docText,
					);
				},
			);
		},
	);
});

const searchIndex = indexer.createSearchIndex();
const binaryIndex = indexer.createCompressedBinaryIndex();

writeFileSync(
	"public/icon-search-index.json",
	JSON.stringify(searchIndex, null, 2),
);

writeFileSync("public/icon-search-index.gz", binaryIndex);

const jsonSize = Buffer.byteLength(JSON.stringify(searchIndex));
const binarySize = binaryIndex.length;

console.log(`JSON size: ${jsonSize} bytes`);
console.log(`Compressed binary size: ${binarySize} bytes`);
console.log(
	`Compression ratio: ${((1 - binarySize / jsonSize) * 100).toFixed(1)}%`,
);

rmSync("temp", { recursive: true, force: true });
console.log(
	"Process completed. Icons downloaded and compressed indices created.",
);
