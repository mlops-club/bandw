const PALETTE = [
	'#4fc3f7', // light blue
	'#ff7043', // deep orange
	'#66bb6a', // green
	'#ab47bc', // purple
	'#ffa726', // orange
	'#26c6da', // cyan
	'#ef5350', // red
	'#8d6e63', // brown
	'#ec407a', // pink
	'#78909c', // blue grey
];

export function getColor(index: number): string {
	return PALETTE[index % PALETTE.length];
}
