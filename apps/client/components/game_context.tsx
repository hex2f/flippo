'use client'
import { createContext, useContext, useEffect, useState } from 'react';
import { Player } from '@flippo/server/types'
import useSWR from 'swr'
import setCookie from '@/actions/setCookie';
import { objToForm } from '@/lib/utils';
import { redirect } from 'next/navigation';
import Lobby from './lobby';
import Game from './game';
import { AnimatePresence, motion } from 'framer-motion';
import EndScreen from './endscreen';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface IGameState {
	lobby: {
		id: string
		state: "lobby" | "dealing" | "picking" | "playing" | "scoring" | "rotating draft" | "ended"
		turn: number
		players: ReturnType<Player['publicRepr']>[]
	} | undefined
	player: ReturnType<Player['privateRepr']> | undefined
	socket: WebSocket | undefined
}

export const GameStateContext = createContext<IGameState>({} as IGameState)

export default function GameProvider ({ lobbyId, iam }: { lobbyId: string, iam?: string }) {
	const { data, error, mutate, isLoading } = useSWR<IGameState['lobby']>(`http://localhost:8080/lobby?id=${lobbyId}`, fetcher)
	const [player, setPlayer] = useState<IGameState['player']>()

	console.log({ iam})

	if (data?.id && data?.id !== lobbyId) {
		redirect(`/lobby/${data.id}`)
	}

	const [socket, setSocket] = useState<WebSocket>()

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (isLoading || socket) return
		const ws = new WebSocket(`ws://localhost:8080/ws?lobby=${lobbyId}${iam ? `&iam=${iam}` : ''}`)
		setSocket(ws)
		ws.onmessage = (e) => {
			const msg = JSON.parse(e.data)
			console.log(msg)
			switch (msg.e) {
				case 'iam': {
					setCookie(objToForm({ key: 'iam', value: msg.d }))
					break
				}
				case 'lobby_state': {
					mutate(() => msg.d, { revalidate: false })
					break
				}
				case 'player_state': {
					setPlayer(msg.d)
					break
				}
			}
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isLoading])
  
  if (isLoading) return <></>
	return (
		<GameStateContext.Provider value={{ lobby: data, player, socket }}>
			<AnimatePresence>
				<GameState />
			</AnimatePresence>
		</GameStateContext.Provider>
	)
}

function GameState() {
	const state = useContext(GameStateContext)
	if (!state.lobby || !state.player) return <></> 
	switch (state.lobby.state) {
		case 'lobby':
			return <motion.div
			animate={{ scale: 1, opacity: 1 }}
			initial={{ scale: 1.1, opacity: 0 }}
			exit={{ scale: 0.9, opacity: 0 }}
		><Lobby /></motion.div>
		case 'dealing':
		case 'picking':
		case 'playing':
		case 'rotating draft':
		case 'scoring':
			return <motion.div
			animate={{ scale: 1, opacity: 1 }}
			initial={{ scale: 1.1, opacity: 0 }}
			exit={{ scale: 0.9, opacity: 0 }}
		><Game /></motion.div>
		case 'ended':
			return <motion.div
				animate={{ scale: 1, opacity: 1 }}
				initial={{ scale: 1.1, opacity: 0 }}
				exit={{ scale: 0.9, opacity: 0 }}
			><EndScreen /></motion.div>
	}
	return <div>Unknown state</div>
}