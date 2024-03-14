import type { ServerWebSocket } from "bun";

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

export class Player {
	board: SquareColor[][] = Array(7).fill(Array(7).fill(SquareColor.Blank));
	hand: CardType[] = [];
	score = 0;
	scoreRules: Record<string, number> = {};
	scoreStack: CardType[] = [];
	tetrinoStack: CardType[] = [];
	connected = true;
	ready = false;
	turn: { pick: CardType | null, play: CardType | null } = { pick: null, play: null } 

	constructor(public ws: ServerWebSocket<unknown> | undefined, public id: string, public name: string) {
		this.name = name;
		this.id = id;
	}

	publicRepr() {
		return {
			id: this.id,
			board: this.board,
			turn: this.turn,
			name: this.name,
			score: this.score,
			connected: this.connected,
			ready: this.ready,
		}
	}

	privateRepr() {
		return {
			id: this.id,
			board: this.board,
			name: this.name,
			hand: this.hand,
			score: this.score,
			scoreRules: this.scoreRules,
			scoreStack: this.scoreStack,
			tetrinoStack: this.tetrinoStack,
			connected: this.connected,
			ready: this.ready,
			turn: this.turn,
		}
	}

	sendState() {
		if (this.ws && this.ws.readyState === 1) {
			this.ws.send(JSON.stringify({ e: 'player_state', d: this.privateRepr() }))
		}
	}
}
