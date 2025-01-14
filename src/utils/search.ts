import { Buffer } from "buffer";
import { ungzip } from "pako";

interface Icon {
	path: string;
	keywords: string[];
}

interface SearchResult extends Icon {
	score: number;
}

const queryCache = new Map<string, string[]>();
const QUERY_CACHE_MAX_SIZE = 1000;

export class IconSearcher {
	private documents: Map<string, string>;
	private invertedIndex: Map<string, Set<string>>;
	private packagesIndex: Map<string, Set<string>>;
	public count: number;

	private static readonly QUERY_CLEANUP_REGEX = /[^\w\s]/g;
	private static readonly NORMALIZE_REGEX = /[-\s]/g;
	private static readonly SPLIT_REGEX = /\s+/;

	constructor() {
		this.documents = new Map();
		this.invertedIndex = new Map();
		this.packagesIndex = new Map();
		this.count = 0;
	}

	public async initialize(url: string): Promise<void> {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(
					`HTTP error! status: ${response.status}`,
				);
			}

			const buf = Buffer.from(await response.arrayBuffer());
			let data: Uint8Array;

			try {
				data = ungzip(buf);
			} catch {
				data = buf;
			}

			const {
				documents,
				invertedIndex,
				docCount,
				packagesIndex,
			} = this.parseBinaryIndex(data);

			this.clear();

			this.documents = documents;
			this.invertedIndex = invertedIndex;
			this.count = docCount;
			this.packagesIndex = packagesIndex;
		} catch (error) {
			console.error("Failed to load search index:", error);
			throw error;
		}
	}

	private clear(): void {
		this.documents.clear();
		this.invertedIndex.clear();
		this.packagesIndex.clear();
		this.count = 0;
	}

	private readVarInt(
		buffer: Uint8Array,
		offset: { value: number },
	): number {
		let result = 0;
		let shift = 0;
		const MAX_SAFE_SHIFT = 28;

		while (shift <= MAX_SAFE_SHIFT) {
			const byte = buffer[offset.value++];
			result |= (byte & 0x7f) << shift;
			if ((byte & 0x80) === 0) return result;
			shift += 7;
		}

		throw new Error("VarInt is too large");
	}

	private readNullTerminatedString(
		buffer: Uint8Array,
		offset: { value: number },
	): string {
		const start = offset.value;
		const maxLength = buffer.length - start;

		for (let i = 0; i < maxLength; i++) {
			if (buffer[offset.value] === 0) {
				const str = new TextDecoder("ascii").decode(
					buffer.slice(start, offset.value),
				);
				offset.value++;
				return str;
			}
			offset.value++;
		}

		throw new Error("Null terminator not found");
	}

	private parseBinaryIndex(buffer: Uint8Array) {
		const offset = { value: 0 };
		const documents = new Map<string, string>();
		const invertedIndex = new Map<string, Set<string>>();
		const packagesIndex = new Map<string, Set<string>>();

		const docCount = this.readVarInt(buffer, offset);

		for (let i = 0; i < docCount; ) {
			const count = this.readVarInt(buffer, offset);
			const packageName = this.readNullTerminatedString(
				buffer,
				offset,
			);
			const set = new Set<string>();

			for (let j = 0; j < count; j++) {
				const path = this.readNullTerminatedString(
					buffer,
					offset,
				);
				const fullPath = `${packageName}-${path}`;
				set.add(fullPath);
				documents.set(i.toString(), fullPath);
				i++;
			}

			packagesIndex.set(packageName, set);
		}

		offset.value++;

		while (offset.value < buffer.length) {
			const term = this.readNullTerminatedString(
				buffer,
				offset,
			);
			const idCount = this.readVarInt(buffer, offset);
			const docIds = new Set<string>();
			let lastId = 0;

			for (let i = 0; i < idCount; i++) {
				lastId += this.readVarInt(buffer, offset);
				docIds.add(lastId.toString());
			}

			invertedIndex.set(term, docIds);
		}

		return { documents, invertedIndex, docCount, packagesIndex };
	}

	private preprocessQuery(query: string): string[] {
		const cached = queryCache.get(query);
		if (cached) return cached;

		const tokens = query
			.toLowerCase()
			.replace(IconSearcher.QUERY_CLEANUP_REGEX, " ")
			.split(IconSearcher.SPLIT_REGEX)
			.filter(Boolean);

		if (queryCache.size >= QUERY_CACHE_MAX_SIZE) {
			const firstKey = queryCache.keys().next().value;
			if (firstKey) queryCache.delete(firstKey);
		}
		queryCache.set(query, tokens);

		return tokens;
	}

	private normalizeText(text: string): string {
		return text
			.replace(IconSearcher.NORMALIZE_REGEX, "")
			.toLowerCase();
	}

	private fullTextSearch(query: string, path: string): boolean {
		if (query.includes(path)) return true;
		const normalizedQuery = this.normalizeText(query);
		const normalizedPath = this.normalizeText(path);
		return normalizedPath.includes(normalizedQuery);
	}

	public search(query: string, packs: string[]): Icon[] {
		const queryTokens = this.preprocessQuery(query);
		if (queryTokens.length === 0) {
			return this.getDefaultResults(packs);
		}

		const results = this.performSearch(queryTokens, packs);
		return results
			.sort((a, b) => b.score - a.score)
			.slice(0, 100)
			.filter((result) => result.score > 1);
	}

	private getDefaultResults(packs: string[]): Icon[] {
		const results: Icon[] = [];
		let count = 0;
		for (const [key, paths] of this.packagesIndex) {
			if (count >= 200) break;

			if (packs.length === 0 || packs.includes(key)) {
				results.push(
					...Array.from(paths)
						.slice(0, 200)
						.map((path) => ({
							path: `icons/${path}.svg`,
							keywords: [],
						})),
				);
				count++;
			}
		}

		return results;
	}

	private performSearch(
		queryTokens: string[],
		packs: string[],
	): SearchResult[] {
		const scores = new Map<string, number>();

		for (const token of queryTokens) {
			for (const [term, matchingDocs] of this.invertedIndex) {
				const matchQuery = this.fullTextSearch(
					token,
					term,
				);

				if (matchQuery) {
					this.updateScores(
						matchingDocs,
						token,
						packs,
						scores,
					);
				}
			}
		}

		return Array.from(scores, ([docId, score]) => ({
			score,
			path: `icons/${this.documents.get(docId)!}.svg`,
			keywords: [],
		}));
	}

	private updateScores(
		matchingDocs: Set<string>,
		token: string,
		packs: string[],
		scores: Map<string, number>,
	): void {
		for (const docId of matchingDocs) {
			const path = this.documents.get(docId)!;
			const packageName = path.substring(
				0,
				path.indexOf("-"),
			);

			if (packs.length > 0 && !packs.includes(packageName)) {
				continue;
			}

			const currentScore = scores.get(docId) || 0;
			const pathMatchScore = this.fullTextSearch(token, path);
			scores.set(
				docId,
				currentScore + 1 + (pathMatchScore ? 0.5 : 0),
			);
		}
	}

	public getPackageNames(): { name: string; count: number }[] {
		return Array.from(this.packagesIndex.entries())
			.map(([name, docs]) => ({
				name,
				count: docs.size,
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
	}
}
