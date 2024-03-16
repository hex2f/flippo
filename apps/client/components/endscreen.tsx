"use client"

import { useContext } from "react"
import { GameStateContext } from "./game_context"
import { Button } from "./ui/button"

export default function EndScreen() {
	const state = useContext(GameStateContext)
	const scoreboard = state.lobby?.players.sort((a, b) => b.score - a.score)
	return (
		<div className="w-96 bg-white p-8 rounded-2xl">
			<h1 className="text-4xl font-bold">Game Over</h1>
			<p>Thanks for playing!</p>
			{scoreboard?.map((player, i) => (
				<div key={player.id} className="flex">
					<span className="flex-1"><b>{player.name}</b></span>
					{i === 0 && <span>🏆</span>}
					<span>{player.score}</span>
				</div>
			))}
			<Button onClick={() => state.socket?.send(JSON.stringify({ e: 'restart' }))} className="mt-8">Play again</Button>
		</div>
	)
}