"use client";

import { useState, useEffect } from "react";
import { useBattleContext } from "@/context/BattleContext";
import { useRouter } from "next/navigation";
import { Typography, Button, Layout, Space, Card, Row, Col } from "antd";
import styled from "styled-components";

const { Title, Text } = Typography;
const { Content } = Layout;

const StyledContent = styled.div`
    min-height: 100vh;
    background-color: var(--color-tekken-background);
    position: relative;
    padding: 24px;

    &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2) 1px, transparent 1px, transparent 3px);
        pointer-events: none;
        z-index: 10;
    }
`;

const StyledCard = styled.div`
    background-color: var(--color-tekken-card);
    border: 3px solid var(--color-tekken-border);
    border-radius: 2px;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.8);
    margin-bottom: 24px;
    padding: 24px;

    .ant-card-head {
        border-bottom: 2px solid var(--color-tekken-border);
    }

    .ant-card-head-title {
        color: var(--color-tekken-text);
        font-weight: 700;
        letter-spacing: 2px;
    }
`;

const StyledButton = styled(Button)`
    background-color: var(--color-tekken-primary) !important;
    color: var(--color-tekken-text) !important;
    border: 2px solid var(--color-tekken-border) !important;
    padding: 0.75rem 1.5rem !important;
    border-radius: 2px !important;
    font-weight: 700 !important;
    letter-spacing: 2px !important;
    height: auto !important;

    &:hover {
        background-color: var(--color-tekken-secondary) !important;
        box-shadow: 0 0 8px var(--color-tekken-accent) !important;
    }

    &:disabled {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
    }
`;

const GameCell = styled.div<{ cell: string; hidden?: boolean }>`
    width: 32px;
    height: 32px;
    border: 1px solid var(--color-tekken-border);
    background-color: ${props => {
        if (props.cell === "hit") return "var(--color-tekken-accent)";
        if (props.cell === "miss") return "var(--color-tekken-secondary)";
        if (props.cell === "ship" && !props.hidden) return "var(--color-tekken-primary)";
        return "var(--color-tekken-card)";
    }};
`;

const GRID_SIZE = 10;
const GameGrid = styled.div`
    display: grid;
    gap: 1px;
    grid-template-columns: repeat(${GRID_SIZE}, 1fr);
    margin-bottom: 24px;
`;

const SHIPS = [
    { name: "Carrier", size: 5 },
    { name: "Battleship", size: 4 },
    { name: "Destroyer", size: 3 },
    { name: "Submarine", size: 3 },
    { name: "Patrol Boat", size: 2 },
];
const MOVE_DELAY = 10;

type Cell = "empty" | "ship" | "hit" | "miss";
type Board = Cell[][];
type PlayerType = "player1" | "player2";

interface GamePlayer {
    name: string;
    view: Board;
    opponentBoard: Board;
    setView: (board: Board) => void;
    setOpponentBoard: (board: Board) => void;
    opponentName: string;
    makeMove: () => Promise<void>;
}

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
            view: player1View,
            setView: setPlayer1View,
            opponentBoard: player2Board,
            setOpponentBoard: setPlayer2Board,
            opponentName: llm2,
        },
        player2: {
            name: llm2,
            view: player2View,
            setView: setPlayer2View,
            opponentBoard: player1Board,
            setOpponentBoard: setPlayer1Board,
            opponentName: llm1,
        },
    };

    const createPlayer = (playerType: PlayerType): GamePlayer => {
        const config = playersConfig[playerType];
        return {
            ...config,
            makeMove: async () => {
                if (gameOver || !isInitialized || config.view.length === 0 || config.opponentBoard.length === 0) return;

                const prompt = `
              You are playing Battleship on a 10x10 grid. Your current view of the opponent's board is:
              ${JSON.stringify(config.view)}
              Suggest a move by calling the "makeMove" tool with the current view and your chosen coordinates (x, y) between 0 and 9.
              The tool will validate your move and return the result. Only use the "makeMove" tool to suggest a move; do not include coordinates in the text response.
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

                // Apply the move
                const newView = config.view.map(row => [...row]);
                const newOpponentBoard = config.opponentBoard.map(row => [...row]);

                if (config.opponentBoard[x][y] === "ship") {
                    newView[x][y] = "hit";
                    newOpponentBoard[x][y] = "hit";
                    config.setOpponentBoard(newOpponentBoard);
                    checkGameOver(newOpponentBoard, config.opponentName);
                } else {
                    newView[x][y] = "miss";
                }

                config.setView(newView);
                setCurrentPlayerType(playerType === "player1" ? "player2" : "player1");
            },
        };
    };

    const checkGameOver = (board: Board, loserName: string) => {
        const shipsRemaining = board.some(row => row.includes("ship"));
        if (!shipsRemaining) {
            const winningLLM = loserName === llm1 ? llm2 : llm1;
            setGameOver(true);
            setWinner(winningLLM);
            updateScore(winningLLM!);
        }
    };

    const getCurrentPlayer = (): GamePlayer => createPlayer(currentPlayerType);

    useEffect(() => {
        const initializeGame = () => {
            setCurrentPlayerType("player1");
            setGameOver(false);
            setWinner(null);

            const emptyBoard = createEmptyBoard();
            setPlayer1Board(placeShips(emptyBoard));
            setPlayer2Board(placeShips(emptyBoard));
            setPlayer1View(createEmptyBoard());
            setPlayer2View(createEmptyBoard());
            setIsInitialized(true);
        };
        initializeGame();
    }, []);

    const createEmptyBoard = (): Board =>
        Array(GRID_SIZE)
            .fill(null)
            .map(() => Array(GRID_SIZE).fill("empty"));

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

    const getCellClassName = (cell: Cell, hidden: boolean = false): string => {
        if (cell === "hit") return "bg-red-500";
        if (cell === "miss") return "bg-gray-300";
        if (cell === "ship" && !hidden) return "bg-blue-500";
        return "bg-white";
    };

    const renderBoard = (board: Board, hidden: boolean = false) => (
        <GameGrid>{board.map((row, i) => row.map((cell, j) => <GameCell key={`${i}-${j}`} cell={cell} hidden={hidden} />))}</GameGrid>
    );

    return (
        <StyledContent>
            <Space direction="vertical" align="center" size="large" style={{ width: "100%" }}>
                <Title
                    level={1}
                    style={{
                        color: "var(--color-tekken-text)",
                        textAlign: "center",
                        marginBottom: "24px",
                        textShadow: "0 0 5px var(--color-tekken-accent)",
                    }}
                >
                    BATTLESHIP: {llm1} vs {llm2}
                </Title>

                <Text style={{ fontSize: "1.25rem", color: "var(--color-tekken-text)" }}>
                    {!gameOver ? `Current Turn: ${getCurrentPlayer().name}` : `Game Over! ${winner} Wins!`}
                </Text>

                <Row gutter={[48, 24]} style={{ width: "100%" }}>
                    <Col xs={24} md={12}>
                        <StyledCard>
                            <Title level={4} style={{ color: "var(--color-tekken-text)", marginBottom: "16px" }}>
                                {llm1} (Player 1)
                            </Title>
                            {player1Board.length ? renderBoard(player1Board) : <Text>Loading...</Text>}
                            <Title level={4} style={{ color: "var(--color-tekken-text)", marginTop: "16px" }}>
                                View of {llm2}'s Board
                            </Title>
                            {player1View.length ? renderBoard(player1View) : <Text>Loading...</Text>}
                        </StyledCard>
                    </Col>

                    <Col xs={24} md={12}>
                        <StyledCard>
                            <Title level={4} style={{ color: "var(--color-tekken-text)", marginBottom: "16px" }}>
                                {llm2} (Player 2)
                            </Title>
                            {player2Board.length ? renderBoard(player2Board) : <Text>Loading...</Text>}
                            <Title level={4} style={{ color: "var(--color-tekken-text)", marginTop: "16px" }}>
                                View of {llm1}'s Board
                            </Title>
                            {player2View.length ? renderBoard(player2View) : <Text>Loading...</Text>}
                        </StyledCard>
                    </Col>
                </Row>

                {!gameOver && (
                    <Space>
                        <StyledButton onClick={async () => await getCurrentPlayer().makeMove()} disabled={!isInitialized}>
                            MAKE MOVE
                        </StyledButton>
                        <StyledButton onClick={() => setAutoPlay(!autoPlay)}>{autoPlay ? "PAUSE" : "AUTO PLAY"}</StyledButton>
                    </Space>
                )}

                <StyledButton onClick={() => router.push("/")}>BACK TO MENU</StyledButton>
            </Space>
        </StyledContent>
    );
}
