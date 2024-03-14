export enum SquareColor {
	Blank = 0,
	Red = 1,
	Blue = 2,
	Green = 3,
	Invalid = -1
}

export type CardType = {
	type: 'tetrino',
	id: string,
	shape: number[][]
	color: SquareColor
} | {
	type: 'score',
	id: string,
	label: string,
	rule: (board: SquareColor[][], request: string) => number
}

export type { Player } from './';