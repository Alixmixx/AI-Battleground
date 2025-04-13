"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useBattleContext, Game } from "@/context/BattleContext";
import { LLMType } from "@/lib/llmStore";
import {
  FighterGrid,
  VSScreen,
  SelectionControls,
  BattlefieldSelection,
  // Styled components
  GameArena,
  GameBackground,
  GameContent,
  HeaderContainer,
  GameTitle,
  TitleUnderline,
  BlinkingCursor,
  SelectionStatus,
  SelectionPhase,
  SelectionGridCard
} from "@/components/FighterComponents";

export default function GameMenu() {
  const { llm1, llm2, game, setLLM1, setLLM2, setGame, availableLLMs } =
    useBattleContext();
  const [selectionStep, setSelectionStep] = useState<1 | 2>(1);
  const [animatedTitle, setAnimatedTitle] = useState<string>("");
  const router = useRouter();

  const gameOptions: Game[] = ["battleship", "tictactoe", "mastermind"];
  
  // Animate the title
  useEffect(() => {
    const fullTitle = "CHOOSE YOUR FIGHTER";
    let currentIndex = 0;
    
    const animationInterval = setInterval(() => {
      if (currentIndex <= fullTitle.length) {
        setAnimatedTitle(fullTitle.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(animationInterval);
      }
    }, 100);
    
    return () => clearInterval(animationInterval);
  }, []);

  const handleLLMSelect = (llm: LLMType) => {
    if (selectionStep === 1) {
      setLLM1(llm);
      setSelectionStep(2);
    } else {
      setLLM2(llm);
      if (!game) {
        setGame(gameOptions[0]);
      }
    }
  };

  const startBattle = () => {
    if (llm1 && llm2 && game) {
      router.push(`/${encodeURIComponent(game)}`);
    }
  };

  const resetSelection = () => {
    setLLM1(undefined);
    setLLM2(undefined);
    setSelectionStep(1);
  };

  const handleGameSelect = (selectedGame: Game) => {
    setGame(selectedGame);
  };

  return (
    <GameArena>
      {/* Background grid pattern */}
      <GameBackground />
      
      {/* Scanline effect */}
      <div className="scanline" />
      
      <GameContent>
        {/* Animated Header with title */}
        <HeaderContainer>
          <GameTitle level={1}>
            {animatedTitle}
            <BlinkingCursor
              style={{
                opacity: animatedTitle.length === "CHOOSE YOUR FIGHTER".length ? 0 : 1,
              }}
            >
              |
            </BlinkingCursor>
          </GameTitle>
          <TitleUnderline />
        </HeaderContainer>

        {/* VS Screen with fighters */}
        <div style={{ marginBottom: "40px", position: "relative" }}>
          <VSScreen fighter1={llm1} fighter2={llm2} />
          
          {/* Selection info with player color */}
          <SelectionStatus>
            <SelectionPhase
              level={3}
              $isPlayerOne={selectionStep === 1}
            >
              {selectionStep === 1 ? "Select Player 1" : "Select Player 2"}
            </SelectionPhase>
          </SelectionStatus>
        </div>

        {/* Fighter selection grid */}
        <SelectionGridCard bodyStyle={{ padding: "24px" }}>
          <FighterGrid
            fighters={availableLLMs}
            selectedFighter1={llm1}
            selectedFighter2={llm2}
            selectionStep={selectionStep}
            onSelect={handleLLMSelect}
          />
        </SelectionGridCard>

        {/* Battlefield Selection */}
        <BattlefieldSelection
          gameOptions={gameOptions}
          selectedGame={game}
          onGameSelect={handleGameSelect}
        />

        {/* Game Controls */}
        <SelectionControls
          onReset={resetSelection}
          onStart={startBattle}
          disableStart={!llm1 || !llm2 || !game}
        />
      </GameContent>
    </GameArena>
  );
}