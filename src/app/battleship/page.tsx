"use client";

import { useState, useEffect } from "react";
import { useBattleContext } from "@/context/BattleContext";
import { useRouter } from "next/navigation";
import { BaseLLM } from "@/lib/llm";
import { BattleshipTool, Tool } from "@/lib/tool";

const GRID_SIZE = 10;
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
    llm: BaseLLM;
    tools: BattleshipTool[];
    view: Board;
    opponentBoard: Board;
    setView: (board: Board) => void;
    setOpponentBoard: (board: Board) => void;
    opponentName: string;
    makeMove: () => Promise<void>;
}

export default function Battleship() {
    const { llm1, llm2, updateScore, getLLMInstance } = useBattleContext();
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

    const battleshipTools = [new BattleshipTool()];

    const playersConfig = {
        player1: {
            name: llm1,
            llm: getLLMInstance(llm1),
            tools: battleshipTools,
            view: player1View,
            setView: setPlayer1View,
            opponentBoard: player2Board,
            setOpponentBoard: setPlayer2Board,
            opponentName: llm2,
        },
        player2: {
            name: llm2,
            llm: getLLMInstance(llm2),
            tools: battleshipTools,
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

                const response = await config.llm.generate(prompt, config.tools);
                const toolResult = response.toolResults.find(r => r.toolName === "makeMove");

                let x: number, y: number;
                if (toolResult && toolResult.output && toolResult.output.valid) {
                    // Use the validated coordinates from the tool result
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
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
            {board.map((row, i) =>
                row.map((cell, j) => <div key={`${i}-${j}`} className={`w-8 h-8 border ${getCellClassName(cell, hidden)}`} />)
            )}
        </div>
    );

    return (
        <div className="min-h-screen tekken-scanlines">
            <div className="container mx-auto p-6">
                <h1 className="text-3xl tekken-heading text-center mb-6">
                    BATTLESHIP: {llm1} vs {llm2}
                </h1>
                <div className="text-center mb-4">
                    <h2 className="text-xl">{!gameOver ? `Current Turn: ${getCurrentPlayer().name}` : `Game Over! ${winner} Wins!`}</h2>
                </div>
                <div className="flex flex-col md:flex-row justify-center gap-12">
                    <div>
                        <h2 className="text-xl tekken-heading mb-2">{llm1} (Player 1)</h2>
                        {player1Board.length ? renderBoard(player1Board) : <div>Loading...</div>}
                        <h3 className="tekken-heading mt-4">View of {llm2}'s Board</h3>
                        {player1View.length ? renderBoard(player1View) : <div>Loading...</div>}
                    </div>
                    <div>
                        <h2 className="text-xl tekken-heading mb-2">{llm2} (Player 2)</h2>
                        {player2Board.length ? renderBoard(player2Board) : <div>Loading...</div>}
                        <h3 className="tekken-heading mt-4">View of {llm1}'s Board</h3>
                        {player2View.length ? renderBoard(player2View) : <div>Loading...</div>}
                    </div>
                </div>
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
