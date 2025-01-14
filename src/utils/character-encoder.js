import { Buffer } from "buffer";

export class CharacterEncoder {
	constructor() {
		this.validChars = " ~abcdefghijklmnopqrstuvwxyz0123456789.-_";

		this.encodingMap = {};
		this.validChars.split("").forEach((char, index) => {
			this.encodingMap[char] = index;
		});

		this.decodingMap = {};
		Object.entries(this.encodingMap).forEach(([char, index]) => {
			this.decodingMap[index] = char;
		});
	}

	terminator() {
		return Buffer.from(this.encodingMap["~"]);
	}

	encodeChar(char) {
		if (!(char in this.encodingMap)) {
			throw new Error(`Invalid character: ${char}`);
		}
		return this.encodingMap[char];
	}

	decodeChar(num) {
		if (!(num in this.decodingMap)) {
			throw new Error(`Invalid encoded value: ${num}`);
		}
		return this.decodingMap[num];
	}

	encode(str) {
		const chars = str.split("");
		let bits = "";

		chars.forEach((char) => {
			const value = this.encodeChar(char);
			bits += value.toString(2).padStart(6, 0);
		});

		return bits;
	}
	decode(bits) {
		let result = "";

		for (let i = 0; i < bits.length; i += 6) {
			const v = bits.slice(i * 6, (i + 1) * 6);

			console.log({ v });
			const n = parseInt(v, 2);
			console.log({ n });
			result += this.decodeChar(n);
			console.log({ result });
		}

		return result;
	}
}
