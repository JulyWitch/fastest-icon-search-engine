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

const config = JSON.parse(readFileSync("./public/icons-config.json"));

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
        Object.entries(this.invertedIndex).map(([term, docs]) => [
          term,
          Array.from(docs),
        ]),
      ),
    };
  }

  createCompressedBinaryIndex() {
    // Common prefix for all icon paths
    const commonPrefix = "public/icons/";

    // Helper to write variable-length integer
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

    // Create arrays to store parts of the binary format
    const indexParts = [];
    const invertedParts = [];

    // Add index entries (ID + relative path)
    this.documents.forEach((path, id) => {
      // Remove common prefix
      const relativePath = path.replace(commonPrefix, "").replace(".svg", "");

      // Write ID as variable-length integer
      indexParts.push(writeVarInt(parseInt(id)));

      // Write path
      indexParts.push(Buffer.from(relativePath, "ascii"));
      indexParts.push(Buffer.from([0])); // null terminator
    });

    // Separator between sections
    indexParts.push(Buffer.from([0]));

    // Sort terms to group similar ones together (better compression)
    const sortedTerms = Object.entries(this.invertedIndex).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    // Add inverted index entries
    sortedTerms.forEach(([term, docIds]) => {
      // Write term
      invertedParts.push(Buffer.from(term, "ascii"));
      invertedParts.push(Buffer.from([0])); // null terminator

      // Write count of IDs
      const docIdArray = Array.from(docIds)
        .map((id) => parseInt(id))
        .sort((a, b) => a - b);
      invertedParts.push(writeVarInt(docIdArray.length));

      // Write differences between sorted IDs (delta encoding)
      let lastId = 0;
      docIdArray.forEach((id) => {
        const delta = id - lastId;
        invertedParts.push(writeVarInt(delta));
        lastId = id;
      });
    });

    // Combine all parts
    const fullBuffer = Buffer.concat([
      // Write total count of documents
      writeVarInt(this.documents.size),
      ...indexParts,
      ...invertedParts,
    ]);

    // Compress the buffer using gzip
    return gzip(fullBuffer, {
      level: 9, // Maximum compression
      memLevel: 9, // Maximum memory for compression
      strategy: 2, // Huffman coding only (best for text)
    });
  }
}

// Create directories
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
  execSync(`git clone --depth 1 ${repoUrl} ${repoPath}`, { stdio: "ignore" });

  sourceConfigs.forEach(
    ({ path: sourcePath, prefix, postfix, keywords = [] }) => {
      const iconPath = join(repoPath, sourcePath);
      if (!existsSync(iconPath)) {
        console.warn(`Warning: Path ${sourcePath} not found in repository`);
        return;
      }

      globSync("*.svg", { cwd: iconPath }).forEach((svgFile) => {
        const baseName = parse(svgFile).name;
        const sanitizedName =
          `${prefix}-${baseName}${postfix ? `-${postfix}` : ""}.svg`
            .replace(/[^a-zA-Z0-9.-]/g, "-")
            .toLowerCase();
        const targetPath = `public/icons/${sanitizedName}`;

        copyFileSync(join(iconPath, svgFile), targetPath);

        const docText = `${sourceName} ${baseName} ${postfix ?? ""} ${keywords.join(" ")}`;
        indexer.addDocument(targetPath, docText);
      });
    },
  );
});

// Save both formats
const searchIndex = indexer.createSearchIndex();
const binaryIndex = indexer.createCompressedBinaryIndex();

writeFileSync(
  "public/icon-search-index.json",
  JSON.stringify(searchIndex, null, 2),
);

writeFileSync("public/icon-search-index.bin.gz", binaryIndex);

// Log file sizes for comparison
const jsonSize = Buffer.byteLength(JSON.stringify(searchIndex));
const binarySize = binaryIndex.length;

console.log(`JSON size: ${jsonSize} bytes`);
console.log(`Compressed binary size: ${binarySize} bytes`);
console.log(
  `Compression ratio: ${((1 - binarySize / jsonSize) * 100).toFixed(1)}%`,
);

// Cleanup
rmSync("temp", { recursive: true, force: true });
console.log(
  "Process completed. Icons downloaded and compressed indices created.",
);
