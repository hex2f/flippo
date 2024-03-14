"use client"

import { useContext, useState } from "react"
import { GameStateContext } from "./game_context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckIcon, ChevronRightIcon } from "lucide-react"

export default function Lobby () {
	const state = useContext(GameStateContext)
	if (!state.player?.name?.length) {
		return <SetName />
	}
	return (
		<div className="w-64">
		<h1 className="text-4xl font-bold">Lobby</h1>
			{state.lobby?.players.map((player) => (
				<div key={player.id} className="flex items-center gap-2">
					{player.ready 
						? <CheckIcon className="text-green-600" size={18} />
						: null
					}
					{player.name || "Anonymous"}
				</div>
			))}
			{state.player.ready ? (
				<Button
					onClick={() => state.socket?.send(JSON.stringify({ e: 'unready' }))}
					className="mt-8"
				>Unready</Button>
			) : (
				<Button
					onClick={() => state.socket?.send(JSON.stringify({ e: 'ready' }))}
					className="bg-green-600 hover:bg-green-700 text-white flex gap-2 mt-2"
				>
					<CheckIcon />
					Go Ready
				</Button>
			)}
		</div>
	)
}

function SetName () {
	const { socket } = useContext(GameStateContext)
	const [loading, setLoading] = useState(false)

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setLoading(true)
		const input = e.currentTarget.querySelector('input') as HTMLInputElement
		socket?.send(JSON.stringify({ e: 'set_name', d: input.value }))
	}

	return (
		<div className="flex flex-col gap-2">
			<h1 className="text-lg">Set your name</h1>
			<form className="flex gap-2" onSubmit={onSubmit}>
				<Input type="text" placeholder="Your name" disabled={loading} />
				<Button size={'icon'} type="submit" className="shrink-0" disabled={loading}>
					<ChevronRightIcon />
				</Button>
			</form>
		</div>
	)
}