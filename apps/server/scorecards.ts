import { SquareColor } from "./types"

function floodFill(board: number[][], x: number, y: number, colorTarget: SquareColor, found: Set<string>) {
	if (x < 0 || x >= board.length || y < 0 || y >= board.length) return
	if (board[x][y] !== colorTarget) return
	const key = `${x},${y}`
	if (found.has(key)) return
	found.add(key)
	floodFill(board, x - 1, y, colorTarget, found)
	floodFill(board, x + 1, y, colorTarget, found)
	floodFill(board, x, y - 1, colorTarget, found)
	floodFill(board, x, y + 1, colorTarget, found)
}

function getRegions(board: number[][], filterColor?: SquareColor) {
	const regions = {
		red: [] as number[],
		blue: [] as number[],
		green: [] as number[],
		empty: [] as number[]
	}
	const visited = new Set<string>()
	// get random non-visited tile
	// flood fill and add to regions
	// repeat until all tiles are visited
	while (visited.size < board.length * board.length) {
		let x = -1
		let y = -1
		for (let i = 0; i < board.length; i++) {
			for (let j = 0; j < board.length; j++) {
				if (!visited.has(`${i},${j}`) && (!filterColor || board[i][j] === filterColor)) {
					x = i
					y = j
					break
				}
			}
		}
		if (x === -1 || y === -1) break
		const color = board[x][y]
		const found = new Set<string>()
		floodFill(board, x, y, color, found)
		for (const key of found) {
			visited.add(key)
		}
		if (color === SquareColor.Red) {
			regions.red.push(found.size)
		} else if (color === SquareColor.Blue) {
			regions.blue.push(found.size)
		} else if (color === SquareColor.Green) {
			regions.green.push(found.size)
		} else {
			regions.empty.push(found.size)
		}
	}
	regions.red = regions.red.sort((a, b) => b - a)
	regions.blue = regions.blue.sort((a, b) => b - a)
	regions.green = regions.green.sort((a, b) => b - a)
	regions.empty = regions.empty.sort((a, b) => b - a)
	return regions
}

const regionCache = new Map<string, ReturnType<typeof getRegions>>()

export const cards = [
	{
		type: 'score',
		label: '6 point for each tile in the side length of the largest red square region',
		rule: (board: number[][], request: string) => {
			// run convolution, starting at board size - 1 and ending at 1 to find the largest square region
			// if a region is found, return the square root of the number of tiles in the region * 5
			for (let i = board.length - 1; i >= 1; i--) {
				for (let j = 0; j < board.length - i; j++) {
					for (let k = 0; k < board.length - i; k++) {
						let found = true
						for (let l = 0; l < i; l++) {
							for (let m = 0; m < i; m++) {
								if (board[j + l][k + m] !== SquareColor.Red) {
									found = false
									break
								}
							}
							if (!found) break
						}
						if (found) return i * 6
					}
				}
			}
		}
	},
	{
		type: 'score',
		label: '6 point for each tile in the side length of the largest blue square region',
		rule: (board: number[][], request: string) => {
			for (let i = board.length - 1; i >= 1; i--) {
				for (let j = 0; j < board.length - i; j++) {
					for (let k = 0; k < board.length - i; k++) {
						let found = true
						for (let l = 0; l < i; l++) {
							for (let m = 0; m < i; m++) {
								if (board[j + l][k + m] !== SquareColor.Blue) {
									found = false
									break
								}
							}
							if (!found) break
						}
						if (found) return i * 6
					}
				}
			}
		}
	},
	{
		type: 'score',
		label: '6 point for each tile in the side length of the largest green square region',
		rule: (board: number[][], request: string) => {
			for (let i = board.length - 1; i >= 1; i--) {
				for (let j = 0; j < board.length - i; j++) {
					for (let k = 0; k < board.length - i; k++) {
						let found = true
						for (let l = 0; l < i; l++) {
							for (let m = 0; m < i; m++) {
								if (board[j + l][k + m] !== SquareColor.Green) {
									found = false
									break
								}
							}
							if (!found) break
						}
						if (found) return i * 6
					}
				}
			}
		}
	},
	{
		type: 'score',
		label: '1 point for each tile in the largest red region',
		rule: (board: number[][], request: string) => {
			const regions = regionCache.get(`${request}_red`) ?? getRegions(board, SquareColor.Red)
			regionCache.set(`${request}_red`, regions)
			return regions.red[0] ?? 0
		}
	},
	{
		type: 'score',
		label: '1 point for each tile in the largest blue region',
		rule: (board: number[][], request: string) => {
			const regions = regionCache.get(`${request}_blue`) ?? getRegions(board, SquareColor.Blue)
			regionCache.set(`${request}_blue`, regions)
			return regions.blue[0] ?? 0
		}
	},
	{
		type: 'score',
		label: '1 point for each tile in the largest green region',
		rule: (board: number[][], request: string) => {
			const regions = regionCache.get(`${request}_green`) ?? getRegions(board, SquareColor.Green)
			regionCache.set(`${request}_green`, regions)
			return regions.green[0] ?? 0
		}
	},
	{
		type: 'score',
		label: '10 points for each red region of 6 or more tiles',
		rule: (board: number[][], request: string) => {
			const regions = regionCache.get(`${request}_red`) ?? getRegions(board, SquareColor.Red)
			regionCache.set(`${request}_red`, regions)
			return regions.red.filter((size) => size >= 6).length * 10
		}
	},
	{
		type: 'score',
		label: '10 points for each blue region of 6 or more tiles',
		rule: (board: number[][], request: string) => {
			const regions = regionCache.get(`${request}_blue`) ?? getRegions(board, SquareColor.Blue)
			regionCache.set(`${request}_blue`, regions)
			return regions.blue.filter((size) => size >= 6).length * 10
		}
	},
	{
		type: 'score',
		label: '10 points for each green region of 6 or more tiles',
		rule: (board: number[][], request: string) => {
			const regions = regionCache.get(`${request}_green`) ?? getRegions(board, SquareColor.Green)
			regionCache.set(`${request}_green`, regions)
			return regions.green.filter((size) => size >= 6).length * 10
		}
	},
	{
		type: 'score',
		label: '1 point for each red tile on the edge of the board',
		rule: (board: number[][], request: string) => {
			let score = 0
			for (let i = 0; i < board.length; i++) {
				if (board[0][i] === SquareColor.Red) score++
				if (board[board.length - 1][i] === SquareColor.Red) score++
				if (board[i][0] === SquareColor.Red) score++
				if (board[i][board.length - 1] === SquareColor.Red) score++
			}
			return score
		}
	},
	{
		type: 'score',
		label: '1 point for each blue tile on the edge of the board',
		rule: (board: number[][], request: string) => {
			let score = 0
			for (let i = 0; i < board.length; i++) {
				if (board[0][i] === SquareColor.Blue) score++
				if (board[board.length - 1][i] === SquareColor.Blue) score++
				if (board[i][0] === SquareColor.Blue) score++
				if (board[i][board.length - 1] === SquareColor.Blue) score++
			}
			return score
		}
	},
	{
		type: 'score',
		label: '1 point for each green tile on the edge of the board',
		rule: (board: number[][], request: string) => {
			let score = 0
			for (let i = 0; i < board.length; i++) {
				if (board[0][i] === SquareColor.Green) score++
				if (board[board.length - 1][i] === SquareColor.Green) score++
				if (board[i][0] === SquareColor.Green) score++
				if (board[i][board.length - 1] === SquareColor.Green) score++
			}
			return score
		}
	},
	{
		type: 'score',
		label: '3 points for each tile in the second largest red region',
		rule: (board: number[][], request: string) => {
			const regions = regionCache.get(`${request}_red`) ?? getRegions(board, SquareColor.Red)
			regionCache.set(`${request}_red`, regions)
			return (regions.red[1] ?? 0) * 3
		}
	},
	{
		type: 'score',
		label: '3 points for each tile in the second largest blue region',
		rule: (board: number[][], request: string) => {
			const regions = regionCache.get(`${request}_blue`) ?? getRegions(board, SquareColor.Blue)
			regionCache.set(`${request}_blue`, regions)
			return (regions.blue[1] ?? 0) * 3
		}
	},
	{
		type: 'score',
		label: '3 points for each tile in the second largest green region',
		rule: (board: number[][], request: string) => {
			const regions = regionCache.get(`${request}_green`) ?? getRegions(board, SquareColor.Green)
			regionCache.set(`${request}_green`, regions)
			return (regions.green[1] ?? 0) * 3
		}
	},
	{
		type: 'score',
		label: '4 points for each filled column',
		rule: (board: number[][], request: string) => {
			let score = 0
			for (let i = 0; i < board.length; i++) {
				let filled = true
				for (let j = 0; j < board.length; j++) {
					if (board[j][i] === SquareColor.Blank) {
						filled = false
						break
					}
				}
				if (filled) score += 4
			}
			return score
		}
	},
	{
		type: 'score',
		label: '4 points for each filled row',
		rule: (board: number[][], request: string) => {
			let score = 0
			for (let i = 0; i < board.length; i++) {
				let filled = true
				for (let j = 0; j < board.length; j++) {
					if (board[i][j] === SquareColor.Blank) {
						filled = false
						break
					}
				}
				if (filled) score += 4
			}
			return score
		}
	},
	{
		type: 'score',
		label: '8 points for each filled diagonal',
		rule: (board: number[][], request: string) => {
			let score = 0
			let filled = true
			for (let i = 0; i < board.length; i++) {
				if (board[i][i] === SquareColor.Blank) {
					filled = false
					break
				}
			}
			if (filled) score += 8
			filled = true
			for (let i = 0; i < board.length; i++) {
				if (board[i][board.length - i - 1] === SquareColor.Blank) {
					filled = false
					break
				}
			}
			if (filled) score += 8
			return score
		}
	},
	{
		type: 'score',
		label: '2 points for each empty region',
		rule: (board: number[][], request: string) => {
			const regions = regionCache.get(`${request}_empty`) ?? getRegions(board, SquareColor.Blank)
			regionCache.set(`${request}_empty`, regions)
			return regions.empty.length * 2
		}
	},
	{
		type: 'score',
		label: '6 points for each tile in your second largest empty region',
		rule: (board: number[][], request: string) => {
			const regions = regionCache.get(`${request}_empty`) ?? getRegions(board, SquareColor.Blank)
			regionCache.set(`${request}_empty`, regions)
			return (regions.empty[1] ?? 0) * 6
		}
	},
	{
		type: 'score',
		label: '21 points minus the number of tiles in your largest empty region',
		rule: (board: number[][], request: string) => {
			const regions = regionCache.get(`${request}_empty`) ?? getRegions(board, SquareColor.Blank)
			regionCache.set(`${request}_empty`, regions)
			return 21 - (regions.empty[0] ?? 0)
		}
	},
	{
		type: 'score',
		label: '12 points if every corner is filled',
		rule: (board: number[][], request: string) => {
			if (board[0][0] !== SquareColor.Blank && board[0][board.length - 1] !== SquareColor.Blank && board[board.length - 1][0] !== SquareColor.Blank && board[board.length - 1][board.length - 1] !== SquareColor.Blank) {
				return 12
			}
			return 0
		}
	},
	{
		type: 'score',
		label: '15 points if you have an empty row',
		rule: (board: number[][], request: string) => {
			for (let i = 0; i < board.length; i++) {
				let empty = true
				for (let j = 0; j < board.length; j++) {
					if (board[i][j] !== SquareColor.Blank) {
						empty = false
						break
					}
				}
				if (empty) return 15
			}
			return 0
		}
	},
	{
		type: 'score',
		label: '15 points if you have an empty column',
		rule: (board: number[][], request: string) => {
			for (let i = 0; i < board.length; i++) {
				let empty = true
				for (let j = 0; j < board.length; j++) {
					if (board[j][i] !== SquareColor.Blank) {
						empty = false
						break
					}
				}
				if (empty) return 15
			}
			return 0
		}
	},
	{
		type: 'score',
		label: '15 points if you have no fully filled 3x3',
		rule: (board: number[][], request: string) => {
			for (let i = 0; i < board.length - 2; i++) {
				for (let j = 0; j < board.length - 2; j++) {
					let filled = true
					for (let k = 0; k < 3; k++) {
						for (let l = 0; l < 3; l++) {
							if (board[i + k][j + l] === SquareColor.Blank) {
								filled = false
								break
							}
						}
					}
					if (filled) return 0
				}
			}
			return 15
		}
	},
	{
		type: 'score',
		label: '2 points for each row or column that contains least 3 red tiles',
		rule: (board: number[][], request: string) => {
			let score = 0
			for (let i = 0; i < board.length; i++) {
				let count = 0
				for (let j = 0; j < board.length; j++) {
					if (board[i][j] === SquareColor.Red) count++
				}
				if (count >= 3) score += 2
				count = 0
				for (let j = 0; j < board.length; j++) {
					if (board[j][i] === SquareColor.Red) count++
				}
				if (count >= 3) score += 2
			}
			return score
		}
	},
	{
		type: 'score',
		label: '2 points for each row or column that contains least 3 blue tiles',
		rule: (board: number[][], request: string) => {
			let score = 0
			for (let i = 0; i < board.length; i++) {
				let count = 0
				for (let j = 0; j < board.length; j++) {
					if (board[i][j] === SquareColor.Blue) count++
				}
				if (count >= 3) score += 2
				count = 0
				for (let j = 0; j < board.length; j++) {
					if (board[j][i] === SquareColor.Blue) count++
				}
				if (count >= 3) score += 2
			}
			return score
		}
	},
	{
		type: 'score',
		label: '2 points for each row or column that contains least 3 green tiles',
		rule: (board: number[][], request: string) => {
			let score = 0
			for (let i = 0; i < board.length; i++) {
				let count = 0
				for (let j = 0; j < board.length; j++) {
					if (board[i][j] === SquareColor.Green) count++
				}
				if (count >= 3) score += 2
				count = 0
				for (let j = 0; j < board.length; j++) {
					if (board[j][i] === SquareColor.Green) count++
				}
				if (count >= 3) score += 2
			}
			return score
		}
	},
	{
		type: 'score',
		label: 'get 10 points!! :D',
		rule: (board: number[][], request: string) => 10
	},
	{
		type: 'score',
		label: '3 points for each tile in the longest red line (includes diagonals)',
		rule: (board: number[][], request: string) => {
			return calculateLongestLine(board, SquareColor.Red) * 3;
		}
	},
	{
		type: 'score',
		label: '3 points for each tile in the longest blue line (includes diagonals)',
		rule: (board: number[][], request: string) => {
			return calculateLongestLine(board, SquareColor.Blue) * 3;
		}
	},
	{
		type: 'score',
		label: '3 points for each tile in the longest green line (includes diagonals)',
		rule: (board: number[][], request: string) => {
			return calculateLongestLine(board, SquareColor.Green) * 3;
		}
	},
	{
		type: 'score',
		label: '18 points if you have no fully filled row',
		rule: (board: number[][], request: string) => {
			for (let i = 0; i < board.length; i++) {
				let filled = true
				for (let j = 0; j < board.length; j++) {
					if (board[i][j] === SquareColor.Blank) {
						filled = false
						break
					}
				}
				if (filled) return 0
			}
			return 18
		},
	},
	{
		type: 'score',
		label: '18 points if you have no fully filled column',
		rule: (board: number[][], request: string) => {
			for (let i = 0; i < board.length; i++) {
				let filled = true
				for (let j = 0; j < board.length; j++) {
					if (board[j][i] === SquareColor.Blank) {
						filled = false
						break
					}
				}
				if (filled) return 0
			}
			return 18
		},
	}
]

const calculateLongestLine = (board: SquareColor[][], color: SquareColor): number => {
	const numRows = board.length;
	const numCols = board[0].length;
	let maxLineLength = 0;

	// Helper function to check if a position is within bounds
	const isValidPosition = (row: number, col: number): boolean => {
			return row >= 0 && row < numRows && col >= 0 && col < numCols;
	};

	// Helper function to explore in all directions from a given position
	const walkFrom = (row: number, col: number, direction: [number, number]): number => {
			if (!isValidPosition(row, col) || board[row][col] !== color) {
					return 0;
			}
			
			let length = 1;
			const [dx, dy] = direction;
			const [newRow, newCol] = [row + dx, col + dy];
			length += walkFrom(newRow, newCol, direction);
			return length;
	};

	// Iterate through the entire board and find the longest line
	for (let row = 0; row < numRows; row++) {
			for (let col = 0; col < numCols; col++) {
					if (board[row][col] === color) {
							// Explore in all 8 directions
							const directions = [
									[0, 1], [0, -1], [1, 0], [-1, 0],
									[1, 1], [1, -1], [-1, 1], [-1, -1]
							] as [number, number][];
							for (const direction of directions) {
									maxLineLength = Math.max(maxLineLength, walkFrom(row, col, direction));
							}
					}
			}
	}

	return maxLineLength;
};