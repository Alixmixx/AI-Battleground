"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { LLMType, getAvailableLLMs } from "@/lib/llmStore";

export type Game = "battleship" | "tictactoe";

interface BattleContextType {
  llm1: LLMType | undefined;
  llm2: LLMType | undefined;
  game: Game | undefined;
  setLLM1: (llm: LLMType | undefined) => void;
  setLLM2: (llm: LLMType | undefined) => void;
  setGame: (game: Game) => void;
  scores: Record<string, number>;
  availableLLMs: LLMType[];
}

const BattleContext = createContext<BattleContextType | undefined>(undefined);

export const BattleProvider = ({ children }: { children: ReactNode }) => {
  const [llm1, setLLM1] = useState<LLMType | undefined>(undefined);
  const [llm2, setLLM2] = useState<LLMType | undefined>(undefined);
  const [game, setGame] = useState<Game | undefined>(undefined);
  const [scores] = useState<Record<string, number>>({});

  const availableLLMs = getAvailableLLMs();

  return (
    <BattleContext.Provider
      value={{
        llm1,
        llm2,
        game,
        setLLM1,
        setLLM2,
        setGame,
        scores,
        availableLLMs,
      }}
    >
      {children}
    </BattleContext.Provider>
  );
};

export const useBattleContext = () => {
  const context = useContext(BattleContext);
  if (!context)
    throw new Error("useBattleContext must be used within a BattleProvider");
  return context;
};
