"use client";

import { useState, useEffect } from "react";
import { useBattleContext } from "@/context/BattleContext";
import { useRouter } from "next/navigation";
import {
  Typography,
  Button,
  Layout,
  Space,
  Card,
  Row,
  Col,
  Divider,
} from "antd";
import styled from "styled-components";

const { Title, Text } = Typography;
const { Content } = Layout;

// Define props interfaces for styled components
interface GameCellProps {
  cellType: Cell;
  hidden: boolean;
}

interface StatusTextProps {
  $gameOver?: boolean;
}

// Styled components
const GameContainer = styled(Content)`
  padding: 24px;
`;

const GameCell = styled.div<GameCellProps>`
  width: var(--board-cell-size);
  height: var(--board-cell-size);
  background-color: ${(props) => {
    if (props.cellType === "hit") return "var(--color-board-hit)";
    if (props.cellType === "miss") return "var(--color-board-miss)";
    if (props.cellType === "ship" && !props.hidden)
      return "var(--color-board-ship)";
    return "var(--color-board-empty)";
  }};
  border: 1px solid var(--board-border-color);
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${(props) => (props.hidden ? "pointer" : "default")};

  &:hover {
    box-shadow: ${(props) =>
      props.hidden ? "0 0 0 3px var(--color-accent)" : "none"};
    background-color: ${(props) => {
      if (props.cellType === "empty" && props.hidden)
        return "var(--color-board-hover)";
      return "";
    }};
  }

  /* Add indicators for hits and misses */
  &::after {
    content: ${(props) => {
      if (props.cellType === "hit") return "'✘'";
      if (props.cellType === "miss") return "'○'";
      return "''";
    }};
    font-size: ${(props) =>
      props.cellType === "hit" || props.cellType === "miss" ? "20px" : "0"};
    color: ${(props) => (props.cellType === "hit" ? "#ffffff" : "#ffffff")};
    font-weight: bold;
  }
`;

const StatusText = styled(Text)<StatusTextProps>`
  font-size: 20px;
  display: block;
  text-align: center;
  font-weight: bold;
  color: ${(props) =>
    props.$gameOver ? "var(--color-accent)" : "var(--color-foreground)"};
  padding: 10px 0;
`;

const GameBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(10, var(--board-cell-size));
  grid-gap: var(--board-grid-gap);
  margin: 0 auto;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  padding: 10px;
  background: var(--color-secondary);
  max-width: fit-content;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

/* Updated PlayerCard for better aesthetics */
const PlayerCard = styled(Card)`
  height: 100%;
  border-radius: 4px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);

  .ant-card-head {
    background-color: var(--color-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  .ant-card-head-title {
    font-weight: bold;
    color: var(--color-accent);
  }
`;

/* Updated BoardSection with better spacing */
const BoardSection = styled.div`
  margin-bottom: 24px;

  h5 {
    margin-bottom: 16px;
    color: var(--color-foreground);
    font-weight: bold;
  }
`;

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
  view: Board;
  opponentBoard: Board;
  setView: (board: Board) => void;
  setOpponentBoard: (board: Board) => void;
  opponentName: string;
  makeMove: () => Promise<void>;
}

export default function Battleship() {
  const { llm1, llm2 } = useBattleContext();
  const router = useRouter();

  const [player1Board, setPlayer1Board] = useState<Board>([]);
  const [player2Board, setPlayer2Board] = useState<Board>([]);
  const [player1View, setPlayer1View] = useState<Board>([]);
  const [player2View, setPlayer2View] = useState<Board>([]);
  const [currentPlayerType, setCurrentPlayerType] =
    useState<PlayerType>("player1");
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
        if (
          gameOver ||
          !isInitialized ||
          config.view.length === 0 ||
          config.opponentBoard.length === 0
        )
          return;

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

        const toolResult = data.toolResults.find(
          (r: any) => r.toolName === "makeMove"
        );

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
        const newView = config.view.map((row) => [...row]);
        const newOpponentBoard = config.opponentBoard.map((row) => [...row]);

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
    const shipsRemaining = board.some((row) => row.includes("ship"));
    if (!shipsRemaining) {
      const winningLLM = loserName === llm1 ? llm2 : llm1;
      setGameOver(true);
      setWinner(winningLLM);
    }
  };

  const getCurrentPlayer = (): GamePlayer => createPlayer(currentPlayerType);

  useEffect(() => {
    const initializeGame = () => {
      setCurrentPlayerType("player1");
      setGameOver(false);
      setWinner(null);

      const emptyBoard = createEmptyBoard();
      setPlayer1Board(placeShips(createEmptyBoard()));
      setPlayer2Board(placeShips(createEmptyBoard()));
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
    const newBoard = board.map((row) => [...row]);
    SHIPS.forEach((ship) => {
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

  const canPlaceShip = (
    board: Board,
    x: number,
    y: number,
    size: number,
    isHorizontal: boolean
  ): boolean => {
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
      const timeout = setTimeout(
        async () => await getCurrentPlayer().makeMove(),
        MOVE_DELAY
      );
      return () => clearTimeout(timeout);
    }
  }, [currentPlayerType, gameOver, isInitialized, autoPlay]);

  // Render a single game board
  const renderBoard = (board: Board, hidden: boolean = false) => (
    <GameBoard>
      {board.map((row, x) =>
        row.map((cell, y) => (
          <GameCell key={`${x}-${y}`} cellType={cell} hidden={hidden} />
        ))
      )}
    </GameBoard>
  );

  return (
    <GameContainer>
      <Space
        direction="vertical"
        align="center"
        size="large"
        style={{ width: "100%" }}
      >
        <Title level={1} style={{ textAlign: "center", marginBottom: "24px" }}>
          Battleship: {llm1} vs {llm2}
        </Title>

        <Card style={{ marginBottom: "24px", width: "100%" }}>
          <StatusText $gameOver={gameOver}>
            {!gameOver
              ? `Current Turn: ${getCurrentPlayer().name}`
              : `Game Over! ${winner} Wins!`}
          </StatusText>
        </Card>

        <Row gutter={[24, 24]} style={{ width: "100%" }}>
          <Col xs={24} lg={12}>
            <PlayerCard title={`${llm1} (Player 1)`}>
              <BoardSection>
                <Title level={5}>My Fleet:</Title>
                {player1Board.length > 0 ? (
                  renderBoard(player1Board)
                ) : (
                  <Text>Loading...</Text>
                )}
              </BoardSection>

              <Divider style={{ margin: "16px 0" }} />

              <BoardSection>
                <Title level={5}>Targeting View:</Title>
                {player1View.length > 0 ? (
                  renderBoard(player1View, true)
                ) : (
                  <Text>Loading...</Text>
                )}
              </BoardSection>
            </PlayerCard>
          </Col>

          <Col xs={24} lg={12}>
            <PlayerCard title={`${llm2} (Player 2)`}>
              <BoardSection>
                <Title level={5}>My Fleet:</Title>
                {player2Board.length > 0 ? (
                  renderBoard(player2Board)
                ) : (
                  <Text>Loading...</Text>
                )}
              </BoardSection>

              <Divider style={{ margin: "16px 0" }} />

              <BoardSection>
                <Title level={5}>Targeting View:</Title>
                {player2View.length > 0 ? (
                  renderBoard(player2View, true)
                ) : (
                  <Text>Loading...</Text>
                )}
              </BoardSection>
            </PlayerCard>
          </Col>
        </Row>

        <Space size="middle">
          {!gameOver && (
            <>
              <Button
                type="primary"
                onClick={async () => await getCurrentPlayer().makeMove()}
                disabled={!isInitialized}
              >
                Make Move
              </Button>
              <Button onClick={() => setAutoPlay(!autoPlay)}>
                {autoPlay ? "Pause" : "Auto Play"}
              </Button>
            </>
          )}
          <Button type="primary" onClick={() => router.push("/")}>
            Back to Menu
          </Button>
        </Space>
      </Space>
    </GameContainer>
  );
}
