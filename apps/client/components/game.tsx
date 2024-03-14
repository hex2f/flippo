'use client'

import { useContext } from "react"
import { GameStateContext } from "./game_context"
import Board, { PlacableBoard } from "./board"
import Hand, { Card } from "./hand"
import { Player } from "@flippo/server/types"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

export default function Game () {
	const state = useContext(GameStateContext)
	const myself = state.player
	const others = state.lobby?.players.filter(p => p.id !== state.player?.id)
	if (myself === undefined || state.lobby === undefined || others === undefined || others?.length === 0) {
		return <div>Loading...</div>
	}


	return (
		<div>
			<div className="absolute bottom-0 inset-x-0 flex flex-col items-center">
				<motion.div layout layoutId="board" className="flex">
					<div className="w-48 relative">
						{myself.scoreStack.map((card, i) => (
							<motion.div
								key={card.id}
								layout
								layoutId={`_${card.id}`}
								animate={{ y: (myself.scoreStack.length - i) * 15 - 15, x: 0, scale: 1, opacity: 1 }}
								initial={{ y: -32, x: 32, scale: 1, opacity: 0 }}
								transition={{ delay: 0.4 }}
								className="absolute left-0 group">
								<Card key={card.id} card={card} className={cn("mb-2 transition-transform", i < myself.scoreStack.length - 1 && "group-hover:-translate-x-[110%] group-hover:scale-110")} />
							</motion.div>
						))}
					</div>
					{state.lobby.state === 'playing' && !myself.turn.play ? <PlacableBoard player={myself} /> : <Board board={myself.board} />}
					<div className="w-48 relative">
						{myself.tetrinoStack.map((card, i) => (
							<motion.div
								key={card.id}
								animate={{ y: (myself.tetrinoStack.length - i) * 15 - 15, x: 0, scale: 1, opacity: 1 }}
								initial={{ y: -32, x: -32, scale: 1, opacity: 0 }}
								transition={{ delay: 0.4 }}
								className="absolute right-0 group">
								<Card key={card.id} card={card} className={cn("mb-2 transition-transform", i < myself.tetrinoStack.length - 1 && "group-hover:translate-x-[110%] group-hover:scale-110")} />
							</motion.div>
						))}
					</div>
				</motion.div>
				<AnimatePresence>
					{myself.turn.pick && (
					<motion.div
						animate={{ y: 0, x: 0, scale: 1, opacity: 1 }}
						initial={{ y: 32, x: 0, scale: 1, opacity: 0 }}
						exit={{ y: 32, x: myself.turn.pick.type === 'score' ? -32 : 32, opacity: 0 }}
						transition={{ delay: 0.25 }}
						className="absolute bottom-full mb-4">
						<Card card={myself.turn.pick} />
					</motion.div>)}
				</AnimatePresence>
				<Hand hand={myself.hand} />
			</div>
			<div className="absolute top-0 inset-x-0 flex justify-center">
				{others.map((player, i) => (
					<OtherBoard player={player} key={player.id} i={i} others={others.length} />
				))}
			</div>
		</div>
	)
}

function OtherBoard({ player, i, others }: { player: ReturnType<Player['publicRepr']>, i: number, others: number }) {
	const state = useContext(GameStateContext)
	const angle = ((25 / others) * i) - 25/others * (others - 1) / 2
	const y = Math.abs(angle) * 6
	return (
		<div
			key={player.id}
			className=""
			style={{ transform: `rotate(${angle}deg) scale(0.75) translateY(${y}px)`, height: '' }}>
			<Board board={player.board} />
			<div className="flex justify-between">
				<span className="text-gray-500 text-xl bg-opacity-50 px-1">{player.name}</span>
				<span className="text-gray-500 text-xl bg-opacity-50 px-1">{player.score}</span>
			</div>
			<div>
				{!player.turn.pick
					? <div className="text-gray-500 text-xl bg-opacity-50 px-1">Picking</div>
					: <Card key={player.turn.pick.id} card={player.turn.pick} show={state.lobby?.state !== 'picking'} className="mt-2" />
				}
			</div>
		</div>
	)
}