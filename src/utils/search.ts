import { Buffer } from "buffer";
import { ungzip } from "pako";

interface Icon {
	path: string;
	keywords: string[];
}

export class IconSearcher {
	private documents: Map<string, string>;
	private invertedIndex: Map<string, Set<string>>;
	public count: number;

	constructor() {
		this.documents = new Map();
		this.invertedIndex = new Map();
		this.count = 0;
	}

	public async initialize(url: string): Promise<void> {
		try {
			console.log("STEP 1");
			const response = await fetch(url);
			console.log("STEP 2");
			if (!response.ok) {
				throw new Error(
					`HTTP error! status: ${response.status}`,
				);
			}
			console.log("STEP 3");
			const blob = await response.blob();
			console.log("STEP 4");
			const data = ungzip(
				Buffer.from(await blob.arrayBuffer()),
			);
			console.log("STEP 5");
			const { documents, invertedIndex, docCount } =
				this.parseBinaryIndex(data);
			console.log("STEP 6");
			this.documents = documents;
			this.invertedIndex = invertedIndex;
			this.count = docCount;
		} catch (error) {
			console.error("Failed to load search index:", error);
			throw error;
		}
	}

	private readVarInt(
		buffer: Uint8Array,
		offset: { value: number },
	): number {
		let result = 0;
		let shift = 0;

		while (true) {
			const byte = buffer[offset.value++];
			result |= (byte & 0x7f) << shift;
			if ((byte & 0x80) === 0) break;
			shift += 7;
		}

		return result;
	}

	private readNullTerminatedString(
		buffer: Uint8Array,
		offset: { value: number },
	): string {
		const start = offset.value;
		while (buffer[offset.value] !== 0) offset.value++;
		const str = new TextDecoder("ascii").decode(
			buffer.slice(start, offset.value),
		);
		offset.value++; // Skip null terminator
		return str;
	}

	private parseBinaryIndex(buffer: Uint8Array) {
		const offset = { value: 0 };
		const documents = new Map<string, string>();
		const invertedIndex = new Map<string, Set<string>>();

		// Read total document count
		const docCount = this.readVarInt(buffer, offset);

		// Read document index
		for (let i = 0; i < docCount; i++) {
			const id = this.readVarInt(buffer, offset).toString();
			const path = this.readNullTerminatedString(
				buffer,
				offset,
			);
			documents.set(id, `/icons/${path}.svg`);
		}

		// Skip section separator
		offset.value++;

		// Read inverted index
		while (offset.value < buffer.length) {
			const term = this.readNullTerminatedString(
				buffer,
				offset,
			);
			const idCount = this.readVarInt(buffer, offset);

			const docIds = new Set<string>();
			let lastId = 0;

			// Read delta-encoded document IDs
			for (let i = 0; i < idCount; i++) {
				const delta = this.readVarInt(buffer, offset);
				lastId += delta;
				docIds.add(lastId.toString());
			}

			invertedIndex.set(term, docIds);
		}

		return { documents, invertedIndex, docCount };
	}

	private preprocessQuery(query: string): string[] {
		return query
			.toLowerCase()
			.replace(/[^\w\s]/g, " ")
			.split(/\s+/)
			.filter(Boolean);
	}

	private normalizeText(text: string): string {
		return text.replace(/[-\s]/g, "").toLowerCase();
	}

	private fullTextSearch(query: string, path: string) {
		if (query.includes(path)) return true;
		const normalizedQuery = this.normalizeText(query);
		const normalizedPath = this.normalizeText(path);
		return normalizedPath.includes(normalizedQuery);
	}

	private getAll(): Icon[] {
		const results: Icon[] = [];
		let count = 0;

		// Iterate over the documents values
		for (const path of this.documents.values()) {
			if (count >= 100) break; // Stop once we have 100 results
			results.push({
				path,
				keywords: [], // Assuming keywords are fetched later
			});
			count++;
		}

		return results;
	}

	public search(query: string): Icon[] {
		const queryTokens = this.preprocessQuery(query);
		if (queryTokens.length === 0) return this.getAll();

		const scores = new Map<string, number>();

		queryTokens.forEach((token) => {
			const terms = this.invertedIndex.keys();
			for (const term of terms) {
				const matchquery = this.fullTextSearch(
					query,
					term,
				);
				const match = this.fullTextSearch(token, term);
				if (match || matchquery) {
					const matchingDocs =
						this.invertedIndex.get(term) ||
						new Set();
					matchingDocs.forEach((docId) => {
						const path =
							this.documents.get(
								docId,
							)!;
						const currentScore =
							scores.get(docId) || 0;
						const pathMatchScore =
							this.fullTextSearch(
								token,
								path,
							);

						scores.set(
							docId,
							+match * 0.5 +
								currentScore +
								0.5 +
								+pathMatchScore *
									0.5,
						);
					});
				}
			}
		});

		const results: {
			score: number;
			path: string;
			keywords: string[];
		}[] = [];
		scores.forEach((score, docId) => {
			const path = this.documents.get(docId)!;
			results.push({
				score,
				path,
				keywords: [], // Assuming keywords are fetched later
			});
		});

		results.sort((a, b) => b.score - a.score);

		return results.slice(0, 100).filter((v) => v.score > 1);
	}

	public getFrequentTerms(
		limit: number = 10,
	): { term: string; count: number }[] {
		const termFrequencies: { term: string; count: number }[] = [];

		for (const [term, docIds] of this.invertedIndex) {
			termFrequencies.push({
				term,
				count: docIds.size,
			});
		}

		termFrequencies.sort(
			(a, b) =>
				b.count - a.count ||
				a.term.localeCompare(b.term),
		);

		return termFrequencies.slice(0, limit);
	}
}
