import { Buffer } from "buffer";
import { ungzip } from "pako";

import { CharacterEncoder } from "./character-encoder";

interface Icon {
	path: string;
	keywords: string[];
}

export class IconSearcher {
	private documents: Map<string, string>;
	private invertedIndex: Map<string, Set<string>>;
	public count: number;
	private encoder: CharacterEncoder;

	constructor() {
		this.documents = new Map();
		this.invertedIndex = new Map();
		this.count = 0;
		this.encoder = new CharacterEncoder();
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
			const buf = Buffer.from(await blob.arrayBuffer());
			let data;
			try {
				data = ungzip(buf);
			} catch {
				data = buf;
			}
			console.log("STEP 5");
			const { documents, invertedIndex, docCount } =
				this.parseBinaryIndex(Buffer.from(data));
			console.log("STEP 6");
			this.documents = documents;
			this.invertedIndex = invertedIndex;
			this.count = docCount;
		} catch (error) {
			console.error("Failed to load search index:", error);
			throw error;
		}
	}

	private readVarInt(bits: string, offset: { value: number }) {
		let result = 0;
		let shift = 0;

		while (true) {
			if (offset.value + 8 > bits.length) {
				throw new Error(
					"Invalid VarInt: Not enough bits to read a byte",
				);
			}

			const byte = parseInt(
				bits.substring(offset.value, offset.value + 8),
				2,
			);
			offset.value += 8;

			result |= (byte & 0x7f) << shift;

			if ((byte & 0x80) === 0) {
				break;
			}

			shift += 7;

			if (shift >= 32) {
				throw new Error("Invalid VarInt: Overflow");
			}
		}

		return result;
	}

	private readNullTerminatedString(
		bits: string,
		offset: { value: number },
	): string {
		const start = offset.value;
		let result = "";

		while (true) {
			if (offset.value + 8 > bits.length) {
				throw new Error(
					"Invalid string: Not enough bits to read a byte",
				);
			}

			const byte = parseInt(
				bits.substring(offset.value, offset.value + 8),
				2,
			);
			offset.value += 8;

			if (byte === 0) {
				break;
			}

			result += String.fromCharCode(byte);
		}

		console.log("All bits from start:", bits.substring(start));
		console.log("Decoding string:", result);
		return result;
	}

	parseBinaryIndex(buffer: Buffer) {
		const offset = { value: 0 };
		const documents = new Map<string, string>();
		const invertedIndex = new Map<string, Set<string>>();
		let currentPackage = "";
		let bits = "";
		let id = 0;
		buffer.forEach((v) => (bits += v.toString(2)));
		while (true) {
			const value = this.readVarInt(bits, offset);
			console.log("Value", value);
			currentPackage = this.readNullTerminatedString(
				bits,
				offset,
			);
			console.log("currentPackage", currentPackage);

			for (let i = 0; i < value; i++) {
				const relativePath =
					this.readNullTerminatedString(
						bits,
						offset,
					);
				console.log("Decoded", relativePath);
				const fullPath = `/icons/${currentPackage}-${relativePath}.svg`;
				documents.set(id.toString(), fullPath);
				id += 1;
			}
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

		for (const path of this.documents.values()) {
			if (count >= 100) break;
			results.push({
				path,
				keywords: [],
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
				keywords: [],
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
