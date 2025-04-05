"use client";

import { useState, useEffect } from "react";
import { useBattleContext } from "@/context/BattleContext";
import { useRouter } from "next/navigation";
import { Typography, Button, Space } from "antd";
import { CloseOutlined, BorderOutlined } from "@ant-design/icons";
import styled from "styled-components";
import { themeColors } from "@/lib/theme";
import {
    GameArena,
    GameBackground,
    GameContent,
    HeaderContainer,
    GameTitle,
    TitleUnderline,
    VSScreen,
} from "@/components/FighterComponents";

const { Title, Text } = Typography;

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
    makeMove: (playerX?: number, playerY?: number) => Promise<void>;
}

export default function TicTacToe() {
    const { llm1, llm2, updateScore } = useBattleContext();
    const router = useRouter();

    const [board, setBoard] = useState<Board>([]);
    const [currentPlayerType, setCurrentPlayerType] = useState<PlayerType>("player1");
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [autoPlay, setAutoPlay] = useState(false);
    const [hasHuman, setHasHuman] = useState(false);

    if (!llm1 || !llm2) {
        return (
            <GameArena>
                <GameBackground />
                <GameContent>
                    <ErrorMessage>Please select both players from the menu first.</ErrorMessage>
                    <Button type="primary" onClick={() => router.push("/")} size="large">
                        BACK TO MENU
                    </Button>
                </GameContent>
            </GameArena>
        );
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

    useEffect(() => {
        if (playersConfig.player1.name === "Human" || playersConfig.player2.name === "Human")
            setHasHuman(true);
    }, [playersConfig]);

    const createPlayer = (playerType: PlayerType): GamePlayer => {
        const config = playersConfig[playerType];
        return {
            ...config,
            makeMove: async (playerX?: number, playerY?: number) => {
                if (gameOver || !isInitialized || board.length === 0) return;

                let response;
                if (config.name === "Human") {
                    console.log("Human turn");
                    response = await fetch("/api/tictactoe/move", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            prompt: `{"name":"makeMove","input":{"board":${JSON.stringify(board)},"x":${playerX},"y":${playerY}}}`,
                            llmName: config.name,
                        }),
                    });
                } else {
                    const prompt = `
                    You are playing Tic-Tac-Toe on a 3x3 grid as ${config.symbol}. The current board is:
                    ${JSON.stringify(board)}
                    
                    The tool will validate your move and return the result. Only use the "makeMove" tool to suggest a move.
                    `;

                    response = await fetch("/api/tictactoe/move", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ prompt, llmName: config.name }),
                    });
                }

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

    const renderCell = (cell: Cell, x: number, y: number) => {
        switch (cell) {
            case "X":
                return <PlayerXSymbol />;
            case "O":
                return <PlayerOSymbol />;
            default:
                return null;
        }
    };

    const renderBoard = (board: Board) => (
        <GameGrid>
            {board.map((row, x) =>
                row.map((cell, y) => (
                    <GameCell
                        key={`${x}-${y}`}
                        $isEmpty={cell === "empty"}
                        $isPlayerOne={cell === "X"}
                        onClick={async () => {
                            await getCurrentPlayer().makeMove(x, y);
                        }}
                    >
                        {renderCell(cell, x, y)}
                    </GameCell>
                ))
            )}
        </GameGrid>
    );

    return (
        <GameArena>
            <GameBackground />

            {/* Scanline effect */}
            <Scanline />

            <GameContent>
                <HeaderContainer>
                    <GameTitle level={1}>TIC-TAC-TOE BATTLE</GameTitle>
                    <TitleUnderline />
                </HeaderContainer>

                {/* VS Screen with fighters */}
                <div style={{ marginBottom: "40px", position: "relative" }}>
                    <VSScreen fighter1={llm1} fighter2={llm2} />

                    {/* Current player indicator */}
                    <TurnIndicator>
                        <TurnPhase level={3} $isPlayerOne={currentPlayerType === "player1"} $gameOver={gameOver}>
                            {!gameOver ? `${getCurrentPlayer().name}'s Turn` : winner ? `${winner} Wins!` : "It's a Draw!"}
                        </TurnPhase>
                    </TurnIndicator>
                </div>

                {/* Game board */}
                <GameBoardContainer>
                    <SymbolLegend>
                        <LegendItem>
                            <PlayerXSymbol small /> <LegendText>{llm1}</LegendText>
                        </LegendItem>
                        <VersusText>VS</VersusText>
                        <LegendItem>
                            <PlayerOSymbol small /> <LegendText>{llm2}</LegendText>
                        </LegendItem>
                    </SymbolLegend>

                    {board.length ? (
                        <GameBoardWrapper>
                            {renderBoard(board)}
                            {gameOver && <GameOverlay $winner={winner !== null} />}
                        </GameBoardWrapper>
                    ) : (
                        <LoadingText>Initializing battlefield...</LoadingText>
                    )}
                </GameBoardContainer>

                {/* Game Controls */}
                <ControlContainer>
                    {!gameOver && (
                        <>
                            <ActionButton
                                type="primary"
                                onClick={async () => await getCurrentPlayer().makeMove()}
                                disabled={!isInitialized}
                            >
                                MAKE MOVE
                            </ActionButton>
                            <ActionButton onClick={() => setAutoPlay(!autoPlay)} $isAutoPlay={autoPlay} disabled={hasHuman}>
                                {autoPlay ? "PAUSE" : "AUTO PLAY"}
                            </ActionButton>
                        </>
                    )}

                    <MenuButton onClick={() => router.push("/")}>BACK TO MENU</MenuButton>
                </ControlContainer>
            </GameContent>
        </GameArena>
    );
}

// Styled Components
const ErrorMessage = styled(Title)`
    color: ${themeColors.accent};
    text-align: center;
    margin-bottom: 40px;
`;

const Scanline = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(255, 255, 255, 0) 100%);
    animation: scanline 8s linear infinite;
    opacity: 0.3;
    pointer-events: none;
    z-index: 10;

    @keyframes scanline {
        0% {
            transform: translateY(-100%);
        }
        100% {
            transform: translateY(100%);
        }
    }
`;

const TurnIndicator = styled.div`
    text-align: center;
    margin-top: 30px;
    margin-bottom: 20px;
    position: relative;
`;

const TurnPhase = styled(Title)<{
    $isPlayerOne?: boolean;
    $gameOver?: boolean;
}>`
    color: ${props => {
        if (props.$gameOver) return themeColors.highlight;
        return props.$isPlayerOne ? themeColors.accentBlue : themeColors.accent;
    }};
    text-transform: uppercase;
    letter-spacing: 3px;
    display: inline-block;
    background: rgba(0, 0, 0, 0.3);
    padding: 10px 30px;
    border-radius: 4px;
    box-shadow: ${props => {
        if (props.$gameOver) return "0 0 15px rgba(255, 255, 255, 0.5)";
        return props.$isPlayerOne ? themeColors.glowBlue : themeColors.glowAccent;
    }};
    margin: 0;
    animation: ${props => (props.$gameOver ? "pulse 1.5s infinite" : "none")};

    @keyframes pulse {
        0% {
            opacity: 1;
        }
        50% {
            opacity: 0.7;
        }
        100% {
            opacity: 1;
        }
    }
`;

const GameBoardContainer = styled.div`
    width: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    border: 1px solid ${themeColors.border};
    margin-bottom: 40px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const SymbolLegend = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    width: 100%;
    gap: 20px;
`;

const LegendItem = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const VersusText = styled.span`
    color: ${themeColors.accent};
    font-weight: bold;
    font-size: 20px;
    text-transform: uppercase;
    transform: skewX(-15deg);
    letter-spacing: 2px;
    text-shadow: ${themeColors.glowAccent};
`;

const LegendText = styled(Text)`
    color: ${themeColors.text};
    font-size: 16px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
`;

const GameBoardWrapper = styled.div`
    position: relative;
    padding: 20px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
`;

const GameGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 10px;
    margin: 0 auto;
`;

const GameCell = styled.div<{
    $isEmpty: boolean;
    $isPlayerOne?: boolean;
}>`
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${themeColors.secondary};
    border-radius: 8px;
    position: relative;
    transition: all 0.3s ease;
    box-shadow: ${props => {
        if (!props.$isEmpty) {
            return props.$isPlayerOne
                ? `0 0 15px rgba(0, 180, 255, 0.5), inset 0 0 8px ${themeColors.accentBlue}`
                : `0 0 15px rgba(255, 62, 0, 0.5), inset 0 0 8px ${themeColors.accent}`;
        }
        return "inset 0 0 8px rgba(0, 0, 0, 0.5)";
    }};

    border: 2px solid
        ${props => {
            if (!props.$isEmpty) {
                return props.$isPlayerOne ? themeColors.accentBlue : themeColors.accent;
            }
            return themeColors.border;
        }};

    &:hover {
        transform: ${props => (props.$isEmpty ? "scale(1.05)" : "none")};
    }

    @media (max-width: 768px) {
        width: 80px;
        height: 80px;
    }

    @media (max-width: 480px) {
        width: 60px;
        height: 60px;
    }
`;

const GameOverlay = styled.div<{
    $winner: boolean;
}>`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle, ${props => (props.$winner ? "rgba(255, 62, 0, 0.2)" : "rgba(0, 0, 0, 0.3)")}, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    animation: fadeIn 0.5s ease-in-out;

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;

const LoadingText = styled(Text)`
    color: ${themeColors.text};
    font-size: 18px;
    margin: 40px 0;
    text-transform: uppercase;
    letter-spacing: 2px;
    animation: pulse 1.5s infinite;
`;

const PlayerXSymbol = styled(CloseOutlined)<{
    small?: boolean;
}>`
    font-size: ${props => (props.small ? "24px" : "48px")};
    color: ${themeColors.accentBlue};
    text-shadow: ${themeColors.glowBlue};
    animation: fadeIn 0.3s ease-in-out;
`;

const PlayerOSymbol = styled(BorderOutlined)<{
    small?: boolean;
}>`
    font-size: ${props => (props.small ? "24px" : "48px")};
    color: ${themeColors.accent};
    text-shadow: ${themeColors.glowAccent};
    animation: fadeIn 0.3s ease-in-out;
`;

const ControlContainer = styled.div`
    width: 100%;
    padding: 20px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: center;
    gap: 24px;
    flex-wrap: wrap;
`;

const ActionButton = styled(Button)<{
    $isAutoPlay?: boolean;
}>`
    min-width: 150px;
    height: 48px;
    letter-spacing: 2px;
    font-weight: bold;
    text-transform: uppercase;
    background: ${props =>
        props.$isAutoPlay ? themeColors.secondary : props.type === "primary" ? themeColors.accent : themeColors.secondary};
    color: ${themeColors.text};
    border: 1px solid
        ${props => (props.$isAutoPlay ? themeColors.border : props.type === "primary" ? themeColors.accent : themeColors.accentBlue)};
    box-shadow: ${props => (props.$isAutoPlay ? "none" : props.type === "primary" ? themeColors.glowAccent : themeColors.glowBlue)};

    &:hover:not(:disabled) {
        background: ${props => (props.type === "primary" ? themeColors.accent : themeColors.accentBlue)};
        border-color: ${props => (props.type === "primary" ? themeColors.accent : themeColors.accentBlue)};
        transform: translateY(-2px);
    }
`;

const MenuButton = styled(Button)`
    min-width: 150px;
    height: 48px;
    letter-spacing: 2px;
    font-weight: bold;
    text-transform: uppercase;
    background: ${themeColors.secondary};
    color: ${themeColors.text};
    border: 1px solid ${themeColors.border};

    &:hover {
        border-color: ${themeColors.text};
        color: ${themeColors.text};
        transform: translateY(-2px);
    }
`;
