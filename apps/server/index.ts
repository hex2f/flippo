import { setup, createActor } from 'xstate';
import { ulid } from 'ulid';
import type { ServerWebSocket } from 'bun';
import { SquareColor, type CardType, Player } from './types';

const tetrinos: CardType[] = await (async () => {
	const stack = []
	const json = await Bun.file('./tetrino.json').json() as { count: number, card: { shape: number[][] } }[]
	for (const card of json) {
		for (let i = 0; i < card.count; i++) {
			for (let color = 1; color <= 3; color++) {
				stack.push({ type: 'tetrino', id: ulid(), shape: card.card.shape, color } as CardType)
			}
		}
	}
	return stack
})();

import * as scoresource from './scorecards'
const scorecards: CardType[] = await (async () => {
	const stack = []
	for (const card of scoresource.cards) {
		stack.push({ ...card, type: 'score', id: ulid() } as CardType)
	}
	return stack
})()

export class Lobby {
	id: string;
	machine: ReturnType<typeof createGameMachine>;
	players: Map<string, Player> = new Map();
	skippedPlay = false;
	tetrinoStack: CardType[] = [...JSON.parse(JSON.stringify(tetrinos))].sort(() => Math.random() - 0.5)
	scoreStack: CardType[] = [...scorecards].sort(() => Math.random() - 0.5);
	turn = 0;

	constructor(id?: string) {
		this.id = id ?? ulid();
		this.machine = createGameMachine(this);
		this.machine.subscribe((state) => {
			this.broadcastState()
			switch (state.value) {
				case "dealing":
					this.deal()
					break;
				case 'playing': {
					// if everybody picks a score card, then play will never be triggered. this guards against that
					const allPlayed = Array.from(this.players.values()).every((player) => player.turn.pick !== null);
					if (allPlayed && !this.skippedPlay) {
						this.skippedPlay = true;
						setTimeout(() => this.machine.send({ type: 'play' }), 1000)
					}
					break
				}
				case 'scoring':
					this.score();
					break
				case 'rotating draft':
					this.rotateHands()
					break
			}
		})
		this.machine.start()
	}

	addPlayer(socket: ServerWebSocket<WSState>, name: string) {
		const id = ulid();
		const player = new Player(socket, id, name);
		this.players.set(id, player);
		return player
	}

	broadcastState() {
		server.publish(this.id, JSON.stringify({ e: 'lobby_state', d: this.repr() }))
	}

	process(playerId: string, message: string) {
		const player = this.players.get(playerId);
		if (!player) return
		const { e, d } = JSON.parse(message);
		switch (e) {
			case "set_name": {
				player.name = d.slice(0, 32);
				this.broadcastState();
				break;
			}
			case "ready": {
				player.ready = true;
				this.machine.send({ type: 'ready' });
				break;
			}
			case "unready": {
				player.ready = false;
				this.machine.send({ type: 'ready' });
				break;
			}
			case "pick": {
				const card = player.hand.find((card) => card.id === d);
				if (!card) return;
				player.turn.pick = card;
				player.hand = player.hand.filter((c) => c.id !== d);
				if (card.type === 'score') {
					player.turn.play = card;
				}
				this.machine.send({ type: 'pick' });
				break
			}
			case "play": {
				const { x, y, card, is1x1 } = d;
				if (player.turn.pick?.type !== 'tetrino') return;
				if (player.turn.play) return;
				const newBoard = [...player.board.map(row => [...row])];
				let canPlace = true;
				if (is1x1) {
					if (x < 0 || x >= 7 || y < 0 || y >= 7) {
						canPlace = false;
					}
					const boardFilled = newBoard.every(row => row.every(cell => cell !== SquareColor.Blank))
					if (newBoard[y][x] !== 0 && !boardFilled) {
						canPlace = false;
					}
					newBoard[y][x] = card.color;
				} else {
					if (player.turn.pick.id !== card.id) return;
					for (let i = 0; i < card.shape.length; i++) {
						for (let j = 0; j < card.shape[i].length; j++) {
							if (card.shape[i][j] === 0) continue;
							if (i + y < 0 || i + y >= 7 || j + x < 0 || j + x >= 7) {
								canPlace = false;
								break;
							}
							if (newBoard[i + y][j + x] !== 0) {
								canPlace = false;
								break;
							}
							newBoard[i + y][j + x] = card.color;
						}
					}
				}
				if (canPlace) {
					player.board = newBoard;
				}
				player.turn.play = player.turn.pick;
				player.tetrinoStack.push(player.turn.pick);
				this.machine.send({ type: 'play' });
				break
			}
			case "restart": {
				if (this.machine.getSnapshot().value !== "ended") return;
				this.turn = 0;
				this.skippedPlay = false;
				this.tetrinoStack = [...JSON.parse(JSON.stringify(tetrinos))].sort(() => Math.random() - 0.5);
				this.scoreStack = [...scorecards].sort(() => Math.random() - 0.5);
				for (const player of this.players.values()) {
					player.board = Array(7).fill(Array(7).fill(SquareColor.Blank));
					player.hand = [];
					player.score = 0;
					player.scoreRules = {};
					player.scoreStack = [];
					player.tetrinoStack = [];
					player.connected = true;
					player.ready = false;
					player.turn = { pick: null, play: null };
					player.sendState();
				}
				this.machine.send({ type: 'restart' });
				break
			}
			case "get_state": {
				player.sendState();
				break
			}
		}
		player.sendState();
	}

	repr() {
		const state = this.machine.getSnapshot();
		return {
			id: this.id,
			state: state.value,
			turn: this.turn,
			players: Array.from(this.players.values()).map((player) => player.publicRepr()),
		}
	}
	
	deal() {
		this.turn += 1;
		for (const player of this.players.values()) {
			if (this.tetrinoStack.length < 6) {
				this.tetrinoStack = [...JSON.parse(JSON.stringify(tetrinos))].sort(() => Math.random() - 0.5);
			}
			if (this.scoreStack.length < 2) {
				this.scoreStack = [...scorecards].sort(() => Math.random() - 0.5);
			}
			player.hand = [...this.tetrinoStack.splice(0, 6), ...this.scoreStack.splice(0, 2)].sort(() => Math.random() - 0.5);
			player.turn = { pick: null, play: null };
			player.sendState();
		}
		this.machine.send({ type: 'dealt' });
	}

	score() {
		this.skippedPlay = false;
		for (const player of this.players.values()) {
			if (player.turn.play?.type === 'score') {
				player.scoreStack.push(player.turn.play);
			}

			const requestId = ulid();
			player.score = player.scoreStack.reduce((acc, card) => {
				const scoreCard = scorecards.find((c) => c.id === card.id);
				if (!scoreCard || scoreCard.type !== 'score') return acc;
				const score = scoreCard.rule(player.board, requestId);
				player.scoreRules[card.id] = score;
				return acc + score;
			}, 0);

			player.sendState();
		}
		setTimeout(() => this.machine.send({ type: 'scored' }), 500); // delay to allow animations to finish
	}

	rotateHands() {
		// move each hand to the next player
		const players = Array.from(this.players.values());
		const last = players.pop();
		if (!last) return;
		let lastHand = last.hand;
		for (const player of players) {
			const hand = player.hand;
			player.hand = lastHand;
			lastHand = hand;
			player.turn = { pick: null, play: null };
			player.sendState();
		}
		last.hand = lastHand;
		last.turn = { pick: null, play: null };
		last.sendState();
		this.machine.send({ type: 'rotated' });
	}
}

function createGameMachine(lobby: Lobby) {
	const machine = setup({
		types: {
			context: {} as { lobby: Lobby },
			events: {} as
				| { type: "dealt" }
				| { type: "rotated" }
				| { type: "pick" }
				| { type: "play" }
				| { type: "ready" }
				| { type: "restart" }
				| { type: "scored" },
		},
		guards: {
			"all ready": ({ context, event }) => {
				return Array.from(context.lobby.players.values()).every((player) => player.ready);
			},
			"all picked": ({ context, event }) => {
				return Array.from(context.lobby.players.values()).every((player) => player.turn.pick !== null);
			},
			"all played": ({ context, event }) => {
				return Array.from(context.lobby.players.values()).every((player) => player.turn.play !== null);
			},
			"draft has cards": ({ context, event }) => {
				return Array.from(context.lobby.players.values()).some((player) => player.hand.length > 0);
			},
			"max turns": ({ context, event }) => {
				return context.lobby.turn >= 2;
			},
		},
		schemas: {
			events: {
				dealt: {
					type: "object",
					properties: {},
				},
				rotated: {
					type: "object",
					properties: {},
				},
				pick: {
					type: "object",
					properties: {},
				},
				play: {
					type: "object",
					properties: {},
				},
				ready: {
					type: "object",
					properties: {},
				},
				restart: {
					type: "object",
					properties: {},
				},
				scored: {
					type: "object",
					properties: {},
				},
			},
		},
	}).createMachine({
		context: { lobby },
		id: "Untitled",
		initial: "lobby",
		states: {
			lobby: {
				on: {
					ready: [
						{
							target: "dealing",
							guard: {
								type: "all ready",
							},
						},
						{
							target: "lobby",
						},
					],
				},
			},
			dealing: {
				on: {
					dealt: {
						target: "picking",
					},
				},
			},
			picking: {
				on: {
					pick: [
						{
							target: "playing",
							guard: {
								type: "all picked",
							},
						},
						{
							target: "picking",
						},
					],
				},
			},
			playing: {
				on: {
					play: [
						{
							target: "scoring",
							guard: {
								type: "all played",
							},
						},
						{
							target: "playing",
						},
					],
				},
			},
			scoring: {
				on: {
					scored: [
						{
							target: "rotating draft",
							guard: {
								type: "draft has cards",
							},
						},
						{
							target: "ended",
							guard: {
								type: "max turns",
							},
						},
						{
							target: "dealing",
						},
					],
				},
			},
			"rotating draft": {
				on: {
					rotated: {
						target: "picking",
					},
				},
			},
			ended: {
				on: {
					restart: {
						target: "lobby",
					},
				},
			},
		},
	});

	return createActor(machine);
}

const iams = new Map<string, string>();

const lobbies = new Map<string, Lobby>();

type WSState = { iam: string, lobby: Lobby }

const server = Bun.serve<WSState>({
	port: process.env.PORT ?? 3031,
	fetch(req, server) {
    const url = new URL(req.url);
		
    if (url.pathname === "/api/ws") {
			const lobby = lobbies.get(url.searchParams.get("lobby") ?? "");
			const iam = url.searchParams.get("iam") || ulid();
			if (!lobby) {
				return new Response("Lobby not found", { status: 404 });
			}
      const success = server.upgrade(req, { data: { iam, lobby } });
      return success
        ? undefined
        : new Response("WebSocket upgrade error", { status: 400 });
    }

		if (url.pathname === "/api/lobby") {
			const lobbyId = url.searchParams.get("id") ?? ""
			const lobby = lobbies.get(lobbyId);
			if (lobby) {
				return new Response(JSON.stringify(lobby.repr()), {
					headers: {
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*",
					},
				});
			}

			const newLobby = new Lobby(lobbyId);
			lobbies.set(newLobby.id, newLobby);
			return new Response(JSON.stringify(newLobby), {
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			});
		}

    return new Response("Not found", { status: 404 });
	},
	websocket: {
    open(ws) {
			ws.send(JSON.stringify({ e: "iam", d: ws.data.iam }))
			ws.subscribe(ws.data.lobby.id)
			const playerId = iams.get(ws.data.iam) ?? ""
			const player = ws.data.lobby.players.get(playerId)
			if (player) {
				player.connected = true
				player.ws = ws
				ws.data.lobby.broadcastState()
				player?.sendState()
			} else {
				if (ws.data.lobby.machine.getSnapshot().value !== "lobby") {
					ws.close(4000, "Game already started")
					return
				}
				const newPlayer = ws.data.lobby.addPlayer(ws, "")
				iams.set(ws.data.iam, newPlayer.id)
				ws.data.lobby.broadcastState()
				newPlayer.sendState()
			}
    },
    message(ws, message) {
			const playerId = iams.get(ws.data.iam) ?? ""
			ws.data.lobby.process(playerId, message.toString())
    },
    close(ws) {
      ws.unsubscribe(ws.data.lobby.id);
			const playerId = iams.get(ws.data.iam) ?? ""
			const player = ws.data.lobby.players.get(playerId)
			if (player) {
				player.connected = false
				player.ws = undefined
				if (ws.data.lobby.machine.getSnapshot().value === "lobby") {
					ws.data.lobby.players.delete(playerId)
				}
				ws.data.lobby.broadcastState()
			}
    },
  },
})

console.log(`Listening on ${server.hostname}:${server.port}`);