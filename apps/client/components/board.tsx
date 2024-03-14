import { cn } from "@/lib/utils";
import { Player, SquareColor } from "@flippo/server/types";
import { useContext, useMemo, useState } from "react";
import { colors } from "./hand";
import { GameStateContext } from "./game_context";

export default function Board({ board, className, onCellHover, onBoardLeave }: { board: ReturnType<Player['publicRepr']>['board'], className?: string, onCellHover?: (i: number, j: number) => void, onBoardLeave?: () => void }) {
	return (
		<div className={cn("grid grid-rows-7 grid-cols-7 gap-0 border border-gray-200 h-64 w-64", className)} onMouseLeave={onBoardLeave}>
			{board.map((row, i) => (
				row.map((cell, j) => (
					<div key={`x${j}y${i}-${cell}`} className={cn("p-1 border border-gray-100", colors[cell])} onMouseEnter={() => onCellHover?.(i, j)}>
						{cell > 0 ? <div className="h-full w-full bg-white bg-opacity-20" /> : null}
					</div>
				))
			))}
		</div>
	)
}

type Rotation = 0 | 1 | 2 | 3

function rotateClockwise<T>(arr: T[][]): T[][] {
	const rows = arr.length;
	const cols = arr[0].length; // Assuming all rows have the same length

	if (rows === 0) return []; // Empty array

	// Create a blank copy of the rotated array
	const result: T[][] = Array.from({ length: cols }, () => []);

	// Fill in the rotated elements
	for (let i = 0; i < rows; i++) {
			for (let j = 0; j < cols; j++) {
					result[j][rows - 1 - i] = arr[i][j];
			}
	}

	return result;
}

export function PlacableBoard({ player }: { player: ReturnType<Player['privateRepr']> }) {
	const [xy, setXY] = useState<[number, number] | null>(null)
	const [rotation, setRotation] = useState<Rotation>(0)
	const [flipped, setFlipped] = useState(false)
	const [override1x1, setOverride1x1] = useState<SquareColor | null>(null)
	const { socket } = useContext(GameStateContext)

	const cardShape = useMemo(() => {
		if (player.turn.pick?.type !== 'tetrino' || !player.turn.pick.shape) return 
		let card = [...(player.turn.pick.shape.map(row => [...row]))] as number[][]
		// flip card shape
		if (flipped) {
			card = card.map(row => row.reverse())
		}
		// rotate card shape
		for (let i = 0; i < rotation; i++) {
			card = rotateClockwise(card)
		}
		return card
	}, [player.turn.pick, rotation, flipped])

	const [board, canPlace] = useMemo(() => {
		if (override1x1 && xy !== null) {
			const newBoard = [...(player.board.map(row => [...row]))]
			const canPlace = newBoard[xy[1]][xy[0]] === 0
			newBoard[xy[1]][xy[0]] = canPlace ? override1x1 : -1
			return [newBoard, canPlace]
		}
		return tryPlace(player, xy, cardShape)
	}, [xy, cardShape, player])

	const canPlaceAnywhere = useMemo(() => {
		if (player.turn.pick?.type !== 'tetrino' || !player.turn.pick.shape) return 
		for (const f of [false, true]) {
			let transformedCard = [...(player.turn.pick.shape.map(row => [...row]))] as number[][]
			transformedCard = f ? transformedCard.map(row => row.reverse()) : transformedCard
			for (let r = 0; r < 3; r++) {
				for (let rt = 0; rt < r; rt++) {
					transformedCard = rotateClockwise(transformedCard)
				}
				for (let i = 0; i < 7; i++) {
					for (let j = 0; j < 7; j++) {
						const [_, canPlace] = tryPlace(player, [i, j], transformedCard)
						if (canPlace) return true
					}
				}
			}
		}

		return false
	}, [player.turn.pick])

	if (player.turn.pick?.type !== 'tetrino') return <Board board={player.board} />

	const onMouseEnter = (i: number, j: number) => {
		if (player.turn.pick?.type !== 'tetrino' || !cardShape) return
		if (override1x1) {
			setXY([j, i])
			return
		}
		setXY([j - Math.floor(cardShape[0].length / 2), i - Math.floor(cardShape.length / 2)])
	}

	const onMouseLeave = () => {
		setXY(null)
	}

	const onScroll = (e: React.WheelEvent) => {
		if (player.turn.pick?.type !== 'tetrino') return
		if (e.deltaY < 0) {
			setRotation((r) => (r + 1) % 4 as Rotation)
		} else if (e.deltaY > 0) {
			setRotation((r) => (r + 3) % 4 as Rotation)
		}
	}

	const onRightClick = (e: React.MouseEvent) => {
		e.preventDefault()
		setFlipped((f) => !f)
	}
	
	const onClick = (e: React.MouseEvent) => {
		console.log('click', e.button)
		if (e.button === 2) {
			onRightClick(e)
			return
		}
		if (e.button === 0 && canPlace) {
			if (override1x1 && xy) {
				socket?.send(JSON.stringify({ e: 'play', d: { x: xy[0], y: xy[1], card: { ...player.turn.pick, color: override1x1 }, is1x1: true } }))
			} else {
				socket?.send(JSON.stringify({ e: 'play', d: { x: xy?.[0], y: xy?.[1], card: { ...player.turn.pick, shape: cardShape } } }))
			}
		}
	}

	return (
		<div className={cn("relative", canPlace ? null : 'cursor-not-allowed')} onWheel={onScroll} onMouseDown={onClick} onContextMenu={(e) => e.preventDefault()}>
			{!canPlaceAnywhere && !override1x1 && (
				<div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-center box-border p-4">
					<span className="text-white text-2xl">No place to play</span>
					<span className="text-white text-1xl">You get to chose a 1x1 square of any color to place</span>
					<div className="flex gap-2 mt-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className={cn("h-8 w-8 p-1 cursor-pointer", colors[i as SquareColor])} onClick={() => setOverride1x1(i as SquareColor)}>
								<div className="h-full w-full bg-white bg-opacity-20" />
							</div>
						))}
					</div>
				</div>
			)}
			<Board board={board} className="" onCellHover={onMouseEnter} onBoardLeave={onMouseLeave} />
		</div>
	)
}

function tryPlace(player: ReturnType<Player['privateRepr']>, xy: [number, number] | null, cardShape: number[][] | undefined) {
	if (player.turn.pick?.type !== 'tetrino' || xy?.[0] === undefined || !xy?.[1] === undefined || !cardShape) return [player.board, false]

	const color = player.turn.pick?.color as number
	const newBoard = [...(player.board.map(row => [...row]))]
	let canPlace = true
	for (let i = 0; i < cardShape.length; i++) {
		for (let j = 0; j < cardShape[i].length; j++) {
			if (cardShape[i][j] === 0) continue
			if (i + xy[1] < 0 || i + xy[1] >= 7 || j + xy[0] < 0 || j + xy[0] >= 7) {
				canPlace = false
			} else if (newBoard[i + xy[1]][j + xy[0]] !== 0) {
				canPlace = false
				newBoard[i + xy[1]][j + xy[0]] = -1
			} else {
				newBoard[i + xy[1]][j + xy[0]] = color
			}
		}
	}
	return [newBoard, canPlace]
}