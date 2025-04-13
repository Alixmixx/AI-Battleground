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

const COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];
const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 10;
const MOVE_DELAY = 1000;

type Color = "red" | "blue" | "green" | "yellow" | "purple" | "orange";
type Feedback = "correct" | "wrong-position" | "incorrect";
type PlayerType = "player1" | "player2";

interface Guess {
    colors: Color[];
    feedback: Feedback[];
}

interface GamePlayer {
    name: string;
    makeGuess: () => Promise<void>;
}

export default function Mastermind() {
    const { llm1, llm2, updateScore } = useBattleContext();
    const router = useRouter();

    const [secretCode, setSecretCode] = useState<Color[]>([]);
    const [currentGuess, setCurrentGuess] = useState<Color[]>([]);
    const [guessHistory, setGuessHistory] = useState<Guess[]>([]);
    const [currentPlayerType, setCurrentPlayerType] = useState<PlayerType>("player1");
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
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
        },
        player2: {
            name: llm2,
        },
    };

    useEffect(() => {
        if (playersConfig.player1.name === "Human" || playersConfig.player2.name === "Human") setHasHuman(true);
    }, [playersConfig]);

    const createPlayer = (playerType: PlayerType): GamePlayer => {
        const config = playersConfig[playerType];
        return {
            ...config,
            makeGuess: async () => {
                if (gameOver || !isInitialized) return;

                let response;
                if (config.name === "Human") {
                    // For human players, the current guess would be selected through UI
                    if (currentGuess.length !== CODE_LENGTH) return;
                    
                    response = await fetch("/api/mastermind/move", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            prompt: `{"name":"makeGuess","input":{"code":${JSON.stringify(secretCode)},"guess":${JSON.stringify(currentGuess)}}}`,
                            llmName: config.name,
                        }),
                    });
                } else {
                    // For AI players
                    const prompt = `
                    You are playing Mastermind code-breaking game. You need to guess a secret code of 4 colors.
                    
                    The possible colors are: red, blue, green, yellow, purple, orange.
                    
                    Previous guesses and feedback:
                    ${guessHistory.map((g, i) => 
                        `Guess ${i+1}: ${g.colors.join(", ")} - Feedback: ${g.feedback.join(", ")}`
                    ).join("\n")}
                    
                    Use the "makeGuess" tool to submit your guess.
                    `;

                    response = await fetch("/api/mastermind/move", {
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

                const toolResult = data.toolResults.find((r: any) => r.toolName === "makeGuess");

                if (toolResult && toolResult.output && toolResult.output.valid) {
                    const { guess, feedback, isCorrect } = toolResult.output;
                    
                    // Add to history
                    setGuessHistory(prev => [...prev, { colors: guess, feedback }]);
                    
                    // Clear current guess if from human
                    if (config.name === "Human") {
                        setCurrentGuess([]);
                    }
                    
                    if (isCorrect) {
                        // Game won
                        setGameOver(true);
                        setWinner(config.name);
                        updateScore({ [config.name]: 1, [config.name === llm1 ? llm2 : llm1]: 0 });
                    } else if (guessHistory.length + 1 >= MAX_ATTEMPTS) {
                        // Max attempts reached - game over
                        setGameOver(true);
                    } else {
                        // Switch player
                        setCurrentPlayerType(playerType === "player1" ? "player2" : "player1");
                    }
                }
            },
        };
    };

    const getCurrentPlayer = (): GamePlayer => createPlayer(currentPlayerType);
    const isHumanTurn = () => getCurrentPlayer().name === "Human";

    useEffect(() => {
        const initializeGame = () => {
            // Generate a random secret code
            const code: Color[] = Array(CODE_LENGTH).fill(null).map(() => {
                const randomIndex = Math.floor(Math.random() * COLORS.length);
                return COLORS[randomIndex] as Color;
            });
            
            setSecretCode(code);
            setCurrentGuess([]);
            setGuessHistory([]);
            setCurrentPlayerType("player1");
            setGameOver(false);
            setWinner(null);
            setIsInitialized(true);
        };
        
        initializeGame();
    }, []);

    useEffect(() => {
        if (!gameOver && isInitialized && autoPlay && !isHumanTurn()) {
            const timeout = setTimeout(async () => await getCurrentPlayer().makeGuess(), MOVE_DELAY);
            return () => clearTimeout(timeout);
        }
    }, [currentPlayerType, gameOver, isInitialized, autoPlay, currentGuess]);

    const handleColorSelection = (color: Color) => {
        if (isHumanTurn() && currentGuess.length < CODE_LENGTH) {
            setCurrentGuess(prev => [...prev, color]);
        }
    };

    const handleRemoveColor = () => {
        if (isHumanTurn() && currentGuess.length > 0) {
            setCurrentGuess(prev => prev.slice(0, -1));
        }
    };

    const renderColorPicker = () => (
        <ColorPickerContainer>
            {COLORS.map(color => (
                <ColorButton 
                    key={color} 
                    $color={color as Color}
                    onClick={() => handleColorSelection(color as Color)}
                    disabled={!isHumanTurn() || currentGuess.length >= CODE_LENGTH || gameOver}
                />
            ))}
            <RemoveButton 
                onClick={handleRemoveColor}
                disabled={!isHumanTurn() || currentGuess.length === 0 || gameOver}
            >
                ←
            </RemoveButton>
        </ColorPickerContainer>
    );

    const renderCurrentGuess = () => (
        <GuessContainer>
            <GuessLabel>Current Guess:</GuessLabel>
            <GuessRow>
                {Array(CODE_LENGTH).fill(null).map((_, i) => (
                    <ColorPeg 
                        key={i} 
                        $color={currentGuess[i] || "empty"}
                        $isEmpty={!currentGuess[i]}
                    />
                ))}
            </GuessRow>
        </GuessContainer>
    );

    const renderSecretCode = () => (
        <SecretCodeContainer $revealed={gameOver}>
            <GuessLabel>{gameOver ? "Secret Code:" : "Secret Code (Hidden)"}</GuessLabel>
            <GuessRow>
                {secretCode.map((color, i) => (
                    <ColorPeg 
                        key={i} 
                        $color={gameOver ? color : "hidden"}
                        $isEmpty={false}
                    />
                ))}
            </GuessRow>
        </SecretCodeContainer>
    );

    const renderGuessHistory = () => (
        <HistoryContainer>
            <HistoryTitle>Guess History</HistoryTitle>
            {guessHistory.length === 0 ? (
                <EmptyHistory>No guesses yet</EmptyHistory>
            ) : (
                <HistoryList>
                    {guessHistory.map((guess, index) => (
                        <HistoryItem key={index}>
                            <HistoryIndex>{index + 1}.</HistoryIndex>
                            <GuessRow>
                                {guess.colors.map((color, i) => (
                                    <ColorPeg 
                                        key={i} 
                                        $color={color}
                                        $isEmpty={false}
                                        $small
                                    />
                                ))}
                            </GuessRow>
                            <FeedbackContainer>
                                {guess.feedback.map((feedback, i) => (
                                    <FeedbackPeg 
                                        key={i} 
                                        $feedback={feedback}
                                    />
                                ))}
                            </FeedbackContainer>
                        </HistoryItem>
                    ))}
                </HistoryList>
            )}
        </HistoryContainer>
    );

    return (
        <GameArena>
            <GameBackground />

            {/* Scanline effect */}
            <Scanline />

            <GameContent>
                <HeaderContainer>
                    <GameTitle level={1}>MASTERMIND</GameTitle>
                    <TitleUnderline />
                </HeaderContainer>

                {/* VS Screen with fighters */}
                <div style={{ marginBottom: "40px", position: "relative" }}>
                    <VSScreen fighter1={llm1} fighter2={llm2} />

                    {/* Current player indicator */}
                    <TurnIndicator>
                        <TurnPhase level={3} $isPlayerOne={currentPlayerType === "player1"} $gameOver={gameOver}>
                            {!gameOver ? `${getCurrentPlayer().name}'s Turn` : winner ? `${winner} Wins!` : "Code not broken!"}
                        </TurnPhase>
                    </TurnIndicator>
                </div>

                {/* Game board */}
                <GameBoardContainer>
                    {/* Instructions */}
                    <InstructionsContainer>
                        <InstructionsTitle>MISSION BRIEFING</InstructionsTitle>
                        <InstructionsText>
                            Break the secret code by guessing the correct sequence of 4 colors.
                            After each guess, you'll receive feedback:
                        </InstructionsText>
                        <FeedbackLegend>
                            <LegendItem>
                                <FeedbackPeg $feedback="correct" /> <LegendText>Correct color in correct position</LegendText>
                            </LegendItem>
                            <LegendItem>
                                <FeedbackPeg $feedback="wrong-position" /> <LegendText>Correct color in wrong position</LegendText>
                            </LegendItem>
                            <LegendItem>
                                <FeedbackPeg $feedback="incorrect" /> <LegendText>Color not in code</LegendText>
                            </LegendItem>
                        </FeedbackLegend>
                    </InstructionsContainer>

                    {/* Secret Code */}
                    {renderSecretCode()}

                    {/* Game Play Area */}
                    <GamePlayArea>
                        {/* History */}
                        {renderGuessHistory()}
                        
                        {/* Current Guess */}
                        <CurrentGuessArea>
                            {renderCurrentGuess()}
                            {renderColorPicker()}
                        </CurrentGuessArea>
                    </GamePlayArea>
                </GameBoardContainer>

                {/* Game Controls */}
                <ControlContainer>
                    {!gameOver && (
                        <>
                            <ActionButton
                                type="primary"
                                onClick={async () => await getCurrentPlayer().makeGuess()}
                                disabled={!isInitialized || (isHumanTurn() && currentGuess.length !== CODE_LENGTH)}
                            >
                                {isHumanTurn() ? "SUBMIT GUESS" : "MAKE MOVE"}
                            </ActionButton>
                            <ActionButton 
                                onClick={() => setAutoPlay(!autoPlay)} 
                                $isAutoPlay={autoPlay}
                                disabled={hasHuman}
                            >
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
    z-index: 5;
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

const InstructionsContainer = styled.div`
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
    text-align: center;
`;

const InstructionsTitle = styled.h3`
    color: ${themeColors.text};
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 10px;
    font-size: 1.2rem;
`;

const InstructionsText = styled.p`
    color: ${themeColors.text};
    margin-bottom: 15px;
    font-size: 0.95rem;
`;

const FeedbackLegend = styled.div`
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
`;

const LegendItem = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const LegendText = styled(Text)`
    color: ${themeColors.text};
    font-size: 0.9rem;
`;

const SecretCodeContainer = styled.div<{
    $revealed: boolean;
}>`
    background: ${props => props.$revealed ? "rgba(0, 150, 0, 0.2)" : "rgba(150, 0, 0, 0.2)"};
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid ${props => props.$revealed ? themeColors.accentBlue : themeColors.accent};
    transition: all 0.3s ease;
    width: 100%;
    max-width: 500px;
`;

const GamePlayArea = styled.div`
    display: flex;
    width: 100%;
    gap: 20px;
    flex-wrap: wrap;
    justify-content: center;
`;

const HistoryContainer = styled.div`
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 15px;
    flex: 1;
    min-width: 300px;
    max-width: 500px;
    max-height: 400px;
    overflow-y: auto;
`;

const HistoryTitle = styled.h3`
    color: ${themeColors.text};
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
    font-size: 1.1rem;
    text-align: center;
`;

const EmptyHistory = styled.p`
    color: ${themeColors.text};
    text-align: center;
    font-style: italic;
    opacity: 0.7;
`;

const HistoryList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const HistoryItem = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.2);
`;

const HistoryIndex = styled.span`
    color: ${themeColors.text};
    font-weight: bold;
    min-width: 25px;
`;

const CurrentGuessArea = styled.div`
    flex: 1;
    min-width: 300px;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const GuessContainer = styled.div`
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
`;

const GuessLabel = styled.h4`
    color: ${themeColors.text};
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0;
    font-size: 1rem;
`;

const GuessRow = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;
`;

const ColorPeg = styled.div<{
    $color: Color | "empty" | "hidden";
    $isEmpty: boolean;
    $small?: boolean;
}>`
    width: ${props => (props.$small ? "25px" : "35px")};
    height: ${props => (props.$small ? "25px" : "35px")};
    border-radius: 50%;
    background-color: ${props => {
        if (props.$isEmpty) return "transparent";
        if (props.$color === "hidden") return "#333";
        switch (props.$color) {
            case "red": return "#e74c3c";
            case "blue": return "#3498db";
            case "green": return "#2ecc71";
            case "yellow": return "#f1c40f";
            case "purple": return "#9b59b6";
            case "orange": return "#e67e22";
            default: return "transparent";
        }
    }};
    border: 2px solid ${props => props.$isEmpty ? themeColors.border : "#222"};
    box-shadow: ${props => props.$isEmpty ? "none" : "inset 0 0 5px rgba(0, 0, 0, 0.5)"};
    transition: all 0.2s ease;
`;

const FeedbackContainer = styled.div`
    display: flex;
    gap: 5px;
    margin-left: auto;
`;

const FeedbackPeg = styled.div<{
    $feedback: Feedback;
}>`
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background-color: ${props => {
        switch (props.$feedback) {
            case "correct": return "#2ecc71";
            case "wrong-position": return "#f1c40f";
            case "incorrect": return "#e74c3c";
            default: return "#333";
        }
    }};
    border: 1px solid #222;
`;

const ColorPickerContainer = styled.div`
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
`;

const ColorButton = styled.button<{
    $color: Color;
}>`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background-color: ${props => {
        switch (props.$color) {
            case "red": return "#e74c3c";
            case "blue": return "#3498db";
            case "green": return "#2ecc71";
            case "yellow": return "#f1c40f";
            case "purple": return "#9b59b6";
            case "orange": return "#e67e22";
            default: return "#333";
        }
    }};
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);

    &:hover:not(:disabled) {
        transform: scale(1.1);
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const RemoveButton = styled.button`
    width: 40px;
    height: 40px;
    border-radius: 6px;
    border: 1px solid ${themeColors.border};
    background: rgba(50, 50, 50, 0.5);
    color: ${themeColors.text};
    cursor: pointer;
    font-size: 18px;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background: rgba(80, 80, 80, 0.5);
        transform: translateY(-2px);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
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