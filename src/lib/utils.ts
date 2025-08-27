export function countLeadingZeroBits(bytes: Uint8Array): number {
	let count = 0;
	for (let i = 0; i < bytes.length; i++) {
		const b = bytes[i];
		if (b === 0) {
			count += 8;
			continue;
		}
		for (let bit = 7; bit >= 0; bit--) {
			if (((b >> bit) & 1) === 0) count++;
			else return count;
		}
		return count;
	}
	return count;
}
