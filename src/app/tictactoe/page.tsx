"use client";

import { useState, useEffect } from "react";
import { useBattleContext } from "@/context/BattleContext";
import { useRouter } from "next/navigation";
import { Typography, Button, Layout, Space, Card } from "antd";

const { Title, Text } = Typography;
const { Content } = Layout;

const GRID_SIZE = 3;
const MOVE_DELAY = 500;

type Cell = "empty" | "X" | "O";
type Board = Cell[][];
type PlayerType = "player1" | "player2";

interface GamePlayer {
    name: string;
    symbol: Cell;
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

                if (checkWin(newBoard, config.symbol)) {
                    setGameOver(true);
                    setWinner(config.name);
                    updateScore({ [config.name]: 1, [config.opponentName]: 0 });
                } else if (checkDraw(newBoard)) {
                    setGameOver(true);
                } else {
                    setCurrentPlayerType(playerType === "player1" ? "player2" : "player1");
                }
            },
        };
    };

    const checkWin = (board: Board, symbol: Cell): boolean => {
        // Check rows
        for (let i = 0; i < GRID_SIZE; i++) {
            if (board[i].every(cell => cell === symbol)) return true;
        }

        // Check columns
        for (let j = 0; j < GRID_SIZE; j++) {
            if (board.every(row => row[j] === symbol)) return true;
        }

        // Check diagonals
        if (board.every((row, i) => row[i] === symbol)) return true;
        if (board.every((row, i) => row[GRID_SIZE - 1 - i] === symbol)) return true;

        return false;
    };

    const checkDraw = (board: Board): boolean => {
        return board.every(row => row.every(cell => cell !== "empty"));
    };

    const getCurrentPlayer = (): GamePlayer => createPlayer(currentPlayerType);

    useEffect(() => {
        const initializeGame = () => {
            setCurrentPlayerType("player1");
            setGameOver(false);
            setWinner(null);
            setBoard(
                Array(GRID_SIZE)
                    .fill(null)
                    .map(() => Array(GRID_SIZE).fill("empty"))
            );
            setIsInitialized(true);
        };
        initializeGame();
    }, []);

    useEffect(() => {
        if (!gameOver && isInitialized && autoPlay) {
            const timeout = setTimeout(async () => await getCurrentPlayer().makeMove(), MOVE_DELAY);
            return () => clearTimeout(timeout);
        }
    }, [currentPlayerType, gameOver, isInitialized, autoPlay]);

    const renderBoard = (board: Board) => (
        <div
            style={{
                display: "grid",
                gap: "4px",
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                marginBottom: "24px",
            }}
        >
            {board.map((row, x) =>
                row.map((cell, y) => (
                    <div
                        key={`${x}-${y}`}
                        style={{
                            width: "64px",
                            height: "64px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                            fontWeight: "bold",
                        }}
                    >
                        {cell}
                    </div>
                ))
            )}
        </div>
    );

    return (
        <Content
            style={{
                minHeight: "100vh",
                position: "relative",
                padding: "24px",
            }}
        >
            <Space direction="vertical" align="center" size="large" style={{ width: "100%" }}>
                <Title
                    level={1}
                    style={{
                        color: "var(--color-text)",
                        textAlign: "center",
                        marginBottom: "24px",
                        textShadow: "0 0 5px var(--color-accent)",
                    }}
                >
                    TIC-TAC-TOE: {llm1} (X) vs {llm2} (O)
                </Title>

                <Text style={{ fontSize: "1.25rem", color: "var(--color-text)" }}>
                    {!gameOver
                        ? `Current Turn: ${getCurrentPlayer().name}`
                        : winner
                          ? `Game Over! ${winner} Wins!`
                          : "Game Over! It's a Draw!"}
                </Text>

                <Card>{board.length ? renderBoard(board) : <Text>Loading...</Text>}</Card>

                {!gameOver && (
                    <Space>
                        <Button type="primary" onClick={async () => await getCurrentPlayer().makeMove()} disabled={!isInitialized}>
                            MAKE MOVE
                        </Button>
                        <Button onClick={() => setAutoPlay(!autoPlay)}>{autoPlay ? "PAUSE" : "AUTO PLAY"}</Button>
                    </Space>
                )}

                <Button onClick={() => router.push("/")}>BACK TO MENU</Button>
            </Space>
        </Content>
    );
}
