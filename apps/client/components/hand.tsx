'use client'

import { cn } from "@/lib/utils";
import { CardType, Player, SquareColor } from "@flippo/server/types";
import { useContext, useEffect, useState } from "react";
import { GameStateContext } from "./game_context";
import { motion } from 'framer-motion'
import useSound from 'use-sound';

export default function Hand ({ hand }: { hand: CardType[] }) {
	const { socket, player } = useContext(GameStateContext)

	const [playFlipSound] = useSound('/pick.mp3', { volume: 0.4 })

	const pick = (card: CardType) => {
		socket?.send(JSON.stringify({ e: 'pick', d: card.id }))
		playFlipSound()
	}


	if (player?.turn.pick) {
		return <motion.div layout layoutId="hand" className="my-4" transition={{ delay: 0.1 }} />
	}

	return (
		<motion.div layout layoutId="hand" className="flex gap-2 mt-8 mb-8" transition={{ delay: 0.1 }}>
			{hand.map((card, i) => (
				<motion.div
					key={card.id}
					layout
					layoutId={card.id}
					animate={{ y: 0, scale: 1 }}
					initial={{ y: 64, scale: 0.5 }}
				>
					<div
						style={{ transform: `rotate(${((i + 0.5) - hand.length / 2) * 2.5}deg) translateY(${Math.abs((i + 0.5) - hand.length / 2) * 10}px)` }}
						className="group cursor-pointer"
						onKeyDown={() => {}}
						onClick={() => pick(card)}>
						<Card card={card} className="relative group-hover:scale-150 group-hover:-translate-y-28 transition-transform z-0 group-hover:z-10" player={player as ReturnType<Player['publicRepr']>} />
					</div>
				</motion.div>
			))}
		</motion.div>
	)
}

export function Card ({ card, className, player, show = true }: { card: CardType, className?: string, player: ReturnType<Player['publicRepr']>, show?: boolean }) {
	const [shouldReveal, setShouldReveal] = useState(show ? false : true)

	return (
		<div className={cn("h-40 w-28 bg-white border border-gray-200 rounded-md flex items-center justify-center overflow-hidden", className, shouldReveal && show ? 'animate-3d-spin' : null)}>
			<div className={cn(shouldReveal && show ? 'animate-3d-spin-card-reveal' : null)}>
				{show
					? card.type === 'tetrino' ? <Tetrino card={card} /> : <ScoreCard card={card} player={player} />
					: <span className="text-4xl text-gray-300">?</span>
				}
			</div>
		</div>
	)
}

export const colors = {
	[SquareColor.Blank]: 'bg-white',
	[SquareColor.Blue]: 'bg-blue-500',
	[SquareColor.Green]: 'bg-green-400',
	[SquareColor.Red]: 'bg-red-600',
	[SquareColor.Invalid]: 'bg-gray-500'
}

function Tetrino ({ card }: { card: CardType }) {
	if (card.type !== 'tetrino') return null
	return (
		<div className="grid" style={{
			gridTemplateColumns: `repeat(${card.shape[0].length}, 1fr)`,
			gridTemplateRows: `repeat(${card.shape.length}, 1fr)`
		}}>
			{card.shape.map((row, i) => (
				<>
					{row.map((cell, j) => (
						<div key={`x${j}y${i}`} className={`${colors[(card.color * cell) as typeof card.color]} h-6 w-6 p-0.5`}>
							{cell > 0 ? <div className="h-full w-full box-border bg-white bg-opacity-20" /> : null}
						</div>
					))}
				</>
			))}
		</div>
	)
}

function ScoreCard ({ card, player }: { card: CardType, player: ReturnType<Player['publicRepr']> }) {
	if (card.type !== 'score') return null
	return (
		<div className="flex flex-col items-center justify-center p-3 gap-2">
			<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/681px-Placeholder_view_vector.svg.png" alt="score" className="h-16 w-16 object-contain" />
			<span className="text-2xs leading-tight text-center">{card.label}</span>
			{player?.scoreStack?.some(s => s.id === card.id) && (
				<div className={cn("text-2xs absolute top-2 left-0 px-2 w-full flex justify-between")}>
					<span className="text-gray-600">Contribution</span>
					<span className={player.scoreRules[card.id] > 0 ? 'text-green-500' : 'text-red-500'}>{player.scoreRules[card.id]}</span>
				</div>
			) || null}
		</div>
	)
}