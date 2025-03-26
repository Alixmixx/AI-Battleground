"use client";

import { useState, useEffect } from "react";
import { useBattleContext } from "@/context/BattleContext";
import { useRouter } from "next/navigation";

const GRID_SIZE = 3;
const MOVE_DELAY = 500;

type Cell = "empty" | "X" | "O";
type Board = Cell[][];
type PlayerType = "player1" | "player2";

interface GamePlayer {
    name: string;
    symbol: "X" | "O";
    board: Board;
    setBoard: (board: Board) => void;
    opponentName: string;
    makeMove: () => Promise<void>;
}

export default function TicTacToe() {
    const { llm1, llm2, updateScore } = useBattleContext();
    const router = useRouter();

    const [board, setBoard] = useState<Board>([]);
    const [currentPlayerType, setCurrentPlayerType] = useState<PlayerType>("player1");
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);

    if (!llm1 || !llm2) {
        return <div>Please select both players from the menu first.</div>;
    }

    const playersConfig = {
        player1: {
            name: llm1,
            symbol: "X" as const,
            board,
            setBoard,
            opponentName: llm2,
        },
        player2: {
            name: llm2,
            symbol: "O" as const,
            board,
            setBoard,
            opponentName: llm1,
        },
    };

    const createPlayer = (playerType: PlayerType): GamePlayer => {
        const config = playersConfig[playerType];
        return {
            ...config,
            makeMove: async () => {
                if (gameOver || !isInitialized || board.length === 0) return;

                const prompt = `
              You are playing Tic-Tac-Toe on a 3x3 grid as ${config.symbol}. The current board is:
              ${JSON.stringify(board)}
              Suggest a move by calling the "makeMove" tool with the current board and your chosen coordinates (x, y) between 0 and 2.
              The tool will validate your move and return the result. Only use the "makeMove" tool to suggest a move.
            `;

                const response = await fetch("/api/tictactoe/move", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt, llmName: config.name }),
                });

                const data = await response.json();

                if (data.error) {
                    console.error("API error:", data.error);
                    return;
                }

                const toolResult = data.toolResults.find((r: any) => r.toolName === "makeMove");

                let x: number, y: number;
                if (toolResult && toolResult.output && toolResult.output.valid) {
                    x = toolResult.output.x;
                    y = toolResult.output.y;
                } else {
                    console.error("Invalid tool result or coordinates not found");
                    return;
                }

                if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
                    console.error("Coordinates out of bounds");
                    return;
                }

                const newBoard = board.map(row => [...row]);
                newBoard[x][y] = config.symbol;
                setBoard(newBoard);

                const gameResult = checkGameOver(newBoard);
                if (gameResult) {
                    setGameOver(true);
                    if (gameResult !== "draw") {
                        setWinner(config.name);
                        updateScore(config.name);
                    }
                } else {
                    setCurrentPlayerType(playerType === "player1" ? "player2" : "player1");
                }
            },
        };
    };

    const checkGameOver = (board: Board): "X" | "O" | "draw" | null => {
        // Check rows
        for (let i = 0; i < GRID_SIZE; i++) {
            if (board[i][0] !== "empty" && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
                return board[i][0] as "X" | "O";
            }
        }

        // Check columns
        for (let i = 0; i < GRID_SIZE; i++) {
            if (board[0][i] !== "empty" && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
                return board[0][i] as "X" | "O";
            }
        }

        // Check diagonals
        if (board[0][0] !== "empty" && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
            return board[0][0] as "X" | "O";
        }
        if (board[0][2] !== "empty" && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
            return board[0][2] as "X" | "O";
        }

        // Check for draw
        if (board.every(row => row.every(cell => cell !== "empty"))) {
            return "draw";
        }

        return null;
    };

    const getCurrentPlayer = (): GamePlayer => createPlayer(currentPlayerType);

    useEffect(() => {
        const initializeGame = () => {
            setCurrentPlayerType("player1");
            setGameOver(false);
            setWinner(null);
            setBoard(createEmptyBoard());
            setIsInitialized(true);
        };
        initializeGame();
    }, []);

    const createEmptyBoard = (): Board =>
        Array(GRID_SIZE)
            .fill(null)
            .map(() => Array(GRID_SIZE).fill("empty"));

    useEffect(() => {
        if (!gameOver && isInitialized && autoPlay) {
            const timeout = setTimeout(async () => await getCurrentPlayer().makeMove(), MOVE_DELAY);
            return () => clearTimeout(timeout);
        }
    }, [currentPlayerType, gameOver, isInitialized, autoPlay]);

    const getCellClassName = (cell: Cell): string => {
        if (cell === "X") return "text-red-500 text-4xl";
        if (cell === "O") return "text-blue-500 text-4xl";
        return "text-transparent";
    };

    const renderBoard = (board: Board) => (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
            {board.map((row, i) =>
                row.map((cell, j) => (
                    <div key={`${i}-${j}`} className={`w-16 h-16 border flex items-center justify-center ${getCellClassName(cell)}`}>
                        {cell !== "empty" ? cell : ""}
                    </div>
                ))
            )}
        </div>
    );

    return (
        <div className="min-h-screen tekken-scanlines">
            <div className="container mx-auto p-6">
                <h1 className="text-3xl tekken-heading text-center mb-6">
                    TIC-TAC-TOE: {llm1} (X) vs {llm2} (O)
                </h1>
                <div className="text-center mb-4">
                    <h2 className="text-xl">
                        {!gameOver
                            ? `Current Turn: ${getCurrentPlayer().name} (${getCurrentPlayer().symbol})`
                            : winner
                              ? `Game Over! ${winner} Wins!`
                              : "Game Over! It's a Draw!"}
                    </h2>
                </div>
                <div className="flex justify-center">{board.length ? renderBoard(board) : <div>Loading...</div>}</div>
                <div className="text-center mt-6">
                    {!gameOver && (
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={async () => await getCurrentPlayer().makeMove()}
                                className="tekken-button"
                                disabled={!isInitialized}
                            >
                                Next Move
                            </button>
                            <button onClick={() => setAutoPlay(!autoPlay)} className="tekken-button">
                                {autoPlay ? "Pause Auto-Play" : "Resume Auto-Play"}
                            </button>
                        </div>
                    )}
                    {gameOver && (
                        <button onClick={() => router.push("/")} className="tekken-button mt-4">
                            Back to Menu
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
