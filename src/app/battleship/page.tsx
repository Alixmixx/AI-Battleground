"use client";

import { useState, useEffect } from "react";
import { useBattleContext } from "@/context/BattleContext";
import { useRouter } from "next/navigation";
import { Typography, Button, Space } from "antd";
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
                    newOpponentBoard[x][y] = "miss";
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
            setPlayer1View(
                Array(GRID_SIZE)
                    .fill(null)
                    .map(() => Array(GRID_SIZE).fill("empty"))
            );
            setPlayer2View(
                Array(GRID_SIZE)
                    .fill(null)
                    .map(() => Array(GRID_SIZE).fill("empty"))
            );
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

    const renderBoard = (board: Board, hidden: boolean = false, isPlayerOne: boolean = true) => (
        <BattleGrid>
            {/* Row headers - numbers */}
            <GridHeaders>
                {Array(GRID_SIZE)
                    .fill(null)
                    .map((_, i) => (
                        <GridHeader key={`row-${i}`}>{i}</GridHeader>
                    ))}
            </GridHeaders>

            {board.map((row, x) => (
                <GridRow key={`row-${x}`}>
                    {/* Column header - letter */}
                    <GridHeader>{String.fromCharCode(65 + x)}</GridHeader>

                    {row.map((cell, y) => (
                        <GridCell key={`${x}-${y}`} $cellType={cell} $hidden={hidden && cell === "ship"} $isPlayerOne={isPlayerOne}>
                            {cell === "hit" && <HitMarker $isPlayerOne={!isPlayerOne}>✘</HitMarker>}
                            {cell === "miss" && <MissMarker $isPlayerOne={!isPlayerOne}>●</MissMarker>}
                        </GridCell>
                    ))}
                </GridRow>
            ))}
        </BattleGrid>
    );

    return (
        <GameArena>
            <GameBackground />

            {/* Scanline effect */}
            <Scanline />

            <GameContent>
                <HeaderContainer>
                    <GameTitle level={1}>NAVAL BATTLE</GameTitle>
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

                {/* Game boards */}
                <BattleContainer>
                    <BattlefieldPair>
                        <BattlefieldCard>
                            <BattlefieldTitle $isPlayerOne={true}>{llm1}'s Fleet</BattlefieldTitle>
                            {renderBoard(player1Board, false, true)}
                        </BattlefieldCard>

                        <BattlefieldCard>
                            <BattlefieldTitle $isPlayerOne={false}>{llm2}'s Fleet</BattlefieldTitle>
                            {renderBoard(player2Board, false, false)}
                        </BattlefieldCard>
                    </BattlefieldPair>

                    <BattleInstructions>
                        <BattleInstructionsTitle>BATTLE STATUS</BattleInstructionsTitle>
                        <ShipLegend>
                            <LegendItem $type="empty">Empty Sea</LegendItem>
                            <LegendItem $type="ship">Ship</LegendItem>
                            <LegendItem $type="hit">Hit</LegendItem>
                            <LegendItem $type="miss">Miss</LegendItem>
                        </ShipLegend>
                        <StatusText>
                            {gameOver
                                ? `Battle concluded. ${winner} emerges victorious!`
                                : `Commander ${getCurrentPlayer().name} is targeting enemy waters...`}
                        </StatusText>
                    </BattleInstructions>

                    <BattlefieldPair>
                        <BattlefieldCard>
                            <BattlefieldTitle $isPlayerOne={true}>{llm1}'s Radar</BattlefieldTitle>
                            {renderBoard(player1View, true, true)}
                        </BattlefieldCard>

                        <BattlefieldCard>
                            <BattlefieldTitle $isPlayerOne={false}>{llm2}'s Radar</BattlefieldTitle>
                            {renderBoard(player2View, true, false)}
                        </BattlefieldCard>
                    </BattlefieldPair>
                </BattleContainer>

                {/* Game Controls */}
                <ControlContainer>
                    {!gameOver && (
                        <>
                            <ActionButton
                                type="primary"
                                onClick={async () => await getCurrentPlayer().makeMove()}
                                disabled={!isInitialized}
                            >
                                FIRE TORPEDO
                            </ActionButton>
                            <ActionButton onClick={() => setAutoPlay(!autoPlay)} $isAutoPlay={autoPlay}>
                                {autoPlay ? "PAUSE BATTLE" : "AUTO BATTLE"}
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

const BattleContainer = styled.div`
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
    gap: 30px;
`;

const BattlefieldPair = styled.div`
    display: flex;
    justify-content: center;
    gap: 30px;
    width: 100%;
    flex-wrap: wrap;
`;

const BattlefieldCard = styled.div`
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid ${themeColors.border};
    flex: 1;
    min-width: 450px;
    max-width: 550px;

    @media (max-width: 1024px) {
        min-width: 350px;
    }

    @media (max-width: 768px) {
        min-width: 300px;
    }
`;

const BattlefieldTitle = styled.h3<{
    $isPlayerOne: boolean;
}>`
    color: ${props => (props.$isPlayerOne ? themeColors.accentBlue : themeColors.accent)};
    text-shadow: ${props => (props.$isPlayerOne ? themeColors.glowBlue : themeColors.glowAccent)};
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 15px;
    font-size: 1.5rem;
    text-align: center;
    font-weight: bold;
`;

const BattleGrid = styled.div`
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-top: 10px;
    position: relative;
`;

const GridRow = styled.div`
    display: flex;
    gap: 3px;
`;

const GridHeaders = styled(GridRow)`
    padding-left: 25px; /* Space for row headers */
`;

const GridHeader = styled.div`
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${themeColors.text};
    font-weight: bold;
    font-size: 0.8rem;
`;

const GridCell = styled.div<{
    $cellType: Cell;
    $hidden: boolean;
    $isPlayerOne: boolean;
}>`
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
    cursor: default;
    position: relative;

    /* Cell type styles */
    background-color: ${props => {
        if (props.$hidden) return themeColors.boardEmpty;
        switch (props.$cellType) {
            case "ship":
                return themeColors.boardShip;
            case "hit":
                return "transparent";
            case "miss":
                return "transparent";
            default:
                return themeColors.boardEmpty;
        }
    }};

    /* Border */
    border: 1px solid
        ${props => {
            switch (props.$cellType) {
                case "ship":
                    return props.$isPlayerOne ? themeColors.accentBlue : themeColors.accent;
                case "hit":
                    return props.$isPlayerOne ? themeColors.accentBlue : themeColors.accent;
                case "miss":
                    return props.$isPlayerOne ? themeColors.accentBlue : themeColors.accent;
                default:
                    return themeColors.border;
            }
        }};

    /* Hover effect */
    &:hover {
        transform: ${props => (props.$cellType === "empty" ? "scale(1.05)" : "none")};
        box-shadow: ${props => (props.$cellType === "empty" ? "0 0 5px rgba(255, 255, 255, 0.5)" : "none")};
    }
`;

const HitMarker = styled.span<{
    $isPlayerOne: boolean;
}>`
    color: ${props => (props.$isPlayerOne ? themeColors.accentBlue : themeColors.accent)};
    font-size: 24px;
    font-weight: bold;
    text-shadow: 0 0 5px ${props => (props.$isPlayerOne ? themeColors.accentBlue : themeColors.accent)};
    animation: hitAnimation 0.5s ease-in-out;

    @keyframes hitAnimation {
        0% {
            transform: scale(0);
            opacity: 0;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
`;

const MissMarker = styled.span<{
    $isPlayerOne: boolean;
}>`
    color: ${props => (props.$isPlayerOne ? themeColors.accentBlue : themeColors.accent)};
    font-size: 12px;
    opacity: 0.7;
    animation: missAnimation 0.5s ease-in-out;

    @keyframes missAnimation {
        0% {
            transform: scale(0);
            opacity: 0;
        }
        100% {
            transform: scale(1);
            opacity: 0.7;
        }
    }
`;

const BattleInstructions = styled.div`
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 20px;
    width: 100%;
    max-width: 800px;
    text-align: center;
    border: 1px solid ${themeColors.border};
`;

const BattleInstructionsTitle = styled.h3`
    color: ${themeColors.text};
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 15px;
    font-size: 1.2rem;
`;

const ShipLegend = styled.div`
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 20px;
    flex-wrap: wrap;
`;

const LegendItem = styled.div<{
    $type: Cell;
}>`
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${themeColors.text};
    font-size: 0.9rem;

    &:before {
        content: "";
        display: block;
        width: 15px;
        height: 15px;
        border-radius: 3px;
        background-color: ${props => {
            switch (props.$type) {
                case "ship":
                    return themeColors.boardShip;
                case "hit":
                    return themeColors.boardHit;
                case "miss":
                    return themeColors.boardMiss;
                default:
                    return themeColors.boardEmpty;
            }
        }};
        border: 1px solid
            ${props => {
                switch (props.$type) {
                    case "ship":
                        return themeColors.border;
                    case "hit":
                        return themeColors.accent;
                    case "miss":
                        return themeColors.accentBlue;
                    default:
                        return themeColors.border;
                }
            }};
    }
`;

const StatusText = styled.p`
    color: ${themeColors.text};
    font-size: 1.1rem;
    margin: 0;
    font-style: italic;
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
