"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBattleContext, Game } from "@/context/BattleContext";
import { LLMType } from "@/lib/llmStore";
import {
  FighterGrid,
  VSScreen,
  SelectionControls,
} from "@/components/FighterComponents";

export default function Menu() {
  const { llm1, llm2, game, setLLM1, setLLM2, setGame, scores, availableLLMs } =
    useBattleContext();
  const [selectionStep, setSelectionStep] = useState<1 | 2>(1);
  const router = useRouter();

  const gameOptions: Game[] = ["battleship", "tictactoe"];

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

  return (
    <div className="min-h-screen bg-gray-900 tekken-scanlines flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-5xl tekken-heading mb-8">CHOOSE YOUR FIGHTER</div>

      {/* VS Screen with fighter portraits */}
      <VSScreen fighter1={llm1} fighter2={llm2} />

      {/* Fighter selection grid */}
      <div className="w-full max-w-4xl mb-4">
        <FighterGrid
          fighters={availableLLMs}
          selectedFighter1={llm1}
          selectedFighter2={llm2}
          selectionStep={selectionStep}
          onSelect={handleLLMSelect}
        />
      </div>

      {/* Selection info */}
      <div className="mt-2 text-green-400 text-xl">
        {selectionStep === 1 ? "Select Player 1" : "Select Player 2"}
      </div>

      {/* Controls */}
      <SelectionControls
        onReset={resetSelection}
        onStart={startBattle}
        gameOptions={gameOptions}
        selectedGame={game}
        onGameSelect={setGame}
        disableStart={!llm1 || !llm2 || !game}
      />

      {/* Scores display */}
      {llm1 && llm2 && (
        <div className="mt-6 tekken-container">
          <div className="text-center text-xl mb-2">FIGHTER STATS</div>
          <div className="flex justify-around">
            <div>
              <span className="text-green-400">{llm1}:</span>{" "}
              {scores[llm1] || 0} wins
            </div>
            <div>
              <span className="text-green-400">{llm2}:</span>{" "}
              {scores[llm2] || 0} wins
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
