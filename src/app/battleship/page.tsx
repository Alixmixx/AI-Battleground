"use client";

import { useState, useEffect } from "react";
import { useBattleContext } from "@/context/BattleContext";
import { useRouter } from "next/navigation";
import { Typography, Button, Layout, Space, Card, Row, Col } from "antd";

const { Title, Text } = Typography;
const { Content } = Layout;

const GRID_SIZE = 10;
const MOVE_DELAY = 500;

type Cell = "empty" | "ship" | "hit" | "miss";
type Board = Cell[][];
type PlayerType = "player1" | "player2";

interface GamePlayer {
    name: string;
    board: Board;
    setBoard: (board: Board) => void;
    view: Board;
    setView: (view: Board) => void;
    opponentName: string;
    makeMove: () => Promise<void>;
}

const SHIPS = [
    { name: "Carrier", size: 5 },
    { name: "Battleship", size: 4 },
    { name: "Cruiser", size: 3 },
    { name: "Submarine", size: 3 },
    { name: "Destroyer", size: 2 },
];

export default function Battleship() {
    const { llm1, llm2, updateScore } = useBattleContext();
    const router = useRouter();

    const [player1Board, setPlayer1Board] = useState<Board>([]);
    const [player2Board, setPlayer2Board] = useState<Board>([]);
    const [player1View, setPlayer1View] = useState<Board>([]);
    const [player2View, setPlayer2View] = useState<Board>([]);
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
            board: player1Board,
            setBoard: setPlayer1Board,
            view: player1View,
            setView: setPlayer1View,
            opponentName: llm2,
        },
        player2: {
            name: llm2,
            board: player2Board,
            setBoard: setPlayer2Board,
            view: player2View,
            setView: setPlayer2View,
            opponentName: llm1,
        },
    };

    const createPlayer = (playerType: PlayerType): GamePlayer => {
        const config = playersConfig[playerType];
        const opponentType = playerType === "player1" ? "player2" : "player1";
        const opponentConfig = playersConfig[opponentType];

        return {
            ...config,
            makeMove: async () => {
                if (gameOver || !isInitialized) return;

                const prompt = `
                You are playing Battleship on a 10x10 grid. The current view of your opponent's board is:
                ${JSON.stringify(config.view)}
    
                The tool will validate your move and return the result. Only use the "makeMove" tool to suggest a move.
              `;

                const response = await fetch("/api/battleship/move", {
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

                // Create copies of the relevant boards
                const newPlayerView = config.view.map(row => [...row]);
                const newOpponentBoard = opponentConfig.board.map(row => [...row]);

                // Check if the attack is a hit or miss on the opponent's board
                if (newOpponentBoard[x][y] === "ship") {
                    // It's a hit
                    newPlayerView[x][y] = "hit";
                    newOpponentBoard[x][y] = "hit";
                    opponentConfig.setBoard(newOpponentBoard);
                    checkGameOver(newOpponentBoard, config.opponentName);
                } else if (newOpponentBoard[x][y] === "empty") {
                    // It's a miss
                    newPlayerView[x][y] = "miss";
                }

                // Update the player's view
                config.setView(newPlayerView);

                // Switch to the other player
                setCurrentPlayerType(opponentType);
            },
        };
    };

    const checkGameOver = (board: Board, loserName: string) => {
        const shipsRemaining = board.some(row => row.includes("ship"));
        if (!shipsRemaining) {
            const winningLLM = loserName === llm1 ? llm2 : llm1;
            setGameOver(true);
            setWinner(winningLLM);
            updateScore({ [winningLLM]: 1, [loserName]: 0 });
        }
    };

    const getCurrentPlayer = (): GamePlayer => createPlayer(currentPlayerType);

    useEffect(() => {
        const initializeGame = () => {
            setCurrentPlayerType("player1");
            setGameOver(false);
            setWinner(null);

            const emptyBoard = Array(GRID_SIZE)
                .fill(null)
                .map(() => Array(GRID_SIZE).fill("empty"));

            setPlayer1Board(placeShips(emptyBoard));
            setPlayer2Board(placeShips(emptyBoard));
            setPlayer1View(emptyBoard);
            setPlayer2View(emptyBoard);
            setIsInitialized(true);
        };
        initializeGame();
    }, []);

    const placeShips = (board: Board): Board => {
        const newBoard = board.map(row => [...row]);
        SHIPS.forEach(ship => {
            let placed = false;
            while (!placed) {
                const isHorizontal = Math.random() < 0.5;
                const x = Math.floor(Math.random() * GRID_SIZE);
                const y = Math.floor(Math.random() * GRID_SIZE);
                if (canPlaceShip(newBoard, x, y, ship.size, isHorizontal)) {
                    for (let i = 0; i < ship.size; i++) {
                        if (isHorizontal) newBoard[x][y + i] = "ship";
                        else newBoard[x + i][y] = "ship";
                    }
                    placed = true;
                }
            }
        });
        return newBoard;
    };

    const canPlaceShip = (board: Board, x: number, y: number, size: number, isHorizontal: boolean): boolean => {
        if (isHorizontal) {
            if (y + size > GRID_SIZE) return false;
            for (let i = 0; i < size; i++) {
                if (board[x][y + i] !== "empty") return false;
            }
        } else {
            if (x + size > GRID_SIZE) return false;
            for (let i = 0; i < size; i++) {
                if (board[x + i][y] !== "empty") return false;
            }
        }
        return true;
    };

    useEffect(() => {
        if (!gameOver && isInitialized && autoPlay) {
            const timeout = setTimeout(async () => await getCurrentPlayer().makeMove(), MOVE_DELAY);
            return () => clearTimeout(timeout);
        }
    }, [currentPlayerType, gameOver, isInitialized, autoPlay]);

    const renderBoard = (board: Board, hidden: boolean = false) => (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${GRID_SIZE}, 38px)`,
                gap: "3px",
                margin: "0 auto",
                border: "2px solid #e0e0e0",
                borderRadius: "4px",
                padding: "10px",
                background: "#f5f5f5",
                maxWidth: "fit-content",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
        >
            {board.map((row, x) =>
                row.map((cell, y) => (
                    <div
                        key={`${x}-${y}`}
                        style={{
                            width: "38px",
                            height: "38px",
                            backgroundColor:
                                cell === "hit"
                                    ? "#ff4d4d"
                                    : cell === "miss"
                                      ? "#66a3ff"
                                      : cell === "ship" && !hidden
                                        ? "#b0b0b0"
                                        : "#f8f8f8",
                            border: "1px solid #e0e0e0",
                            transition: "all 0.3s ease",
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: hidden ? "pointer" : "default",
                        }}
                        onMouseEnter={e => {
                            if (hidden && cell === "empty") {
                                e.currentTarget.style.boxShadow = "0 0 0 3px #ff6600";
                                e.currentTarget.style.backgroundColor = "rgba(255, 102, 0, 0.2)";
                            }
                        }}
                        onMouseLeave={e => {
                            if (hidden && cell === "empty") {
                                e.currentTarget.style.boxShadow = "none";
                                e.currentTarget.style.backgroundColor = "#f8f8f8";
                            }
                        }}
                    >
                        {(cell === "hit" || cell === "miss") && (
                            <span
                                style={{
                                    fontSize: "20px",
                                    color: "#ffffff",
                                    fontWeight: "bold",
                                }}
                            >
                                {cell === "hit" ? "✘" : "○"}
                            </span>
                        )}
                    </div>
                ))
            )}
        </div>
    );

    return (
        <Content style={{ padding: "24px" }}>
            <Space direction="vertical" align="center" size="large" style={{ width: "100%" }}>
                <Title
                    level={1}
                    style={{
                        color: "#333333",
                        textAlign: "center",
                        marginBottom: "24px",
                        textShadow: "0 0 5px #ff6600",
                    }}
                >
                    BATTLESHIP: {llm1} vs {llm2}
                </Title>

                <Text
                    style={{
                        fontSize: "20px",
                        display: "block",
                        textAlign: "center",
                        fontWeight: "bold",
                        color: gameOver ? "#ff6600" : "#333333",
                        padding: "10px 0",
                    }}
                >
                    {!gameOver
                        ? `Current Turn: ${getCurrentPlayer().name}`
                        : winner
                          ? `Game Over! ${winner} Wins!`
                          : "Game Over! It's a Draw!"}
                </Text>

                <Row gutter={[24, 24]} justify="center">
                    <Col>
                        <Card title={`${llm1}'s Fleet`}>{renderBoard(player1Board)}</Card>
                    </Col>
                    <Col>
                        <Card title={`${llm2}'s Fleet`}>{renderBoard(player2Board)}</Card>
                    </Col>
                </Row>

                <Row gutter={[24, 24]} justify="center">
                    <Col>
                        <Card title={`${llm1}'s View of Opponent`}>{renderBoard(player1View, true)}</Card>
                    </Col>
                    <Col>
                        <Card title={`${llm2}'s View of Opponent`}>{renderBoard(player2View, true)}</Card>
                    </Col>
                </Row>

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
