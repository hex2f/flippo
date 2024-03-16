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
import useSound from 'use-sound';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type LobbyState = "lobby" | "dealing" | "picking" | "playing" | "scoring" | "rotating draft" | "ended"
interface IGameState {
	lobby: {
		id: string
		state: LobbyState
		turn: number
		players: ReturnType<Player['publicRepr']>[]
	} | undefined
	player: ReturnType<Player['privateRepr']> | undefined
	socket: WebSocket | undefined
}

export const GameStateContext = createContext<IGameState>({} as IGameState)

export default function GameProvider ({ lobbyId, iam }: { lobbyId: string, iam?: string }) {
	const { data, error, mutate, isLoading } = useSWR<IGameState['lobby']>(`//${typeof(window) !== 'undefined' ? window.location.hostname : 'localhost'}${process.env.NODE_ENV === 'development' ? ':3031' : ''}/api/lobby?id=${lobbyId}`, fetcher)
	const [player, setPlayer] = useState<IGameState['player']>()

	if (data?.id && data?.id !== lobbyId) {
		redirect(`/lobby/${data.id}`)
	}

	const [socket, setSocket] = useState<WebSocket>()
	const [playDealSound] = useSound('/deal.mp3', { volume: 0.25 })
	const [playFlipSound] = useSound('/flip.mp3', { volume: 0.25 })
	const [lastLobbyState, setLastLobbyState] = useState<LobbyState>()

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (isLoading || socket) return
		const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}${process.env.NODE_ENV === 'development' ? ':3031' : ''}/api/ws?lobby=${lobbyId}${iam ? `&iam=${iam}` : ''}`)
		setSocket(ws)
		const socketInterval = setInterval(() => {
			if (ws.readyState === ws.CLOSED) {
				clearInterval(socketInterval)
				setSocket(undefined)
			} else {
				ws.send(JSON.stringify({ e: 'get_state' }))
			}
		}, 10000)
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (lastLobbyState !== data?.state) {
			if (data?.state === 'playing') {
				playFlipSound()
			} else if (data?.state === 'dealing' || data?.state === 'rotating draft') {
				playDealSound()
			}
		}
		setLastLobbyState(data?.state)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data?.state, lastLobbyState])
  
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
		case 'ended':
			return <motion.div
			animate={{ scale: 1, opacity: 1 }}
			initial={{ scale: 1.1, opacity: 0 }}
			exit={{ scale: 0.9, opacity: 0 }}
		>
			<Game />
			{state.lobby.state === 'ended' && <motion.div
				animate={{ scale: 1, opacity: 1 }}
				initial={{ scale: 0.8, opacity: 0 }}
				exit={{ scale: 0.8, opacity: 0 }}
				className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30"
			><EndScreen /></motion.div>}
		</motion.div>
	}
	return <div>Unknown state</div>
}