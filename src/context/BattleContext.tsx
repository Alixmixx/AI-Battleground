"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type LLM = "GPT-4o" | "GPT-3.5";
export type Game = "battleship";
export type Scores = Record<string, number>;

interface BattleContextType {
    llm1: LLM | null;
    llm2: LLM | null;
    game: Game | null;
    scores: Scores;
    setLLM1: (llm: LLM) => void;
    setLLM2: (llm: LLM) => void;
    setGame: (game: Game) => void;
    updateScore: (winner: LLM) => void;
}

const BattleContext = createContext<BattleContextType | undefined>(undefined);

export const BattleProvider = ({ children }: { children: ReactNode }) => {
    const [llm1, setLLM1] = useState<LLM | null>(null);
    const [llm2, setLLM2] = useState<LLM | null>(null);
    const [game, setGame] = useState<Game | null>(null);
    const [scores, setScores] = useState<Scores>({});

    useEffect(() => {
        const stored = localStorage.getItem("battleScores");
        if (stored) setScores(JSON.parse(stored));
    }, []);

    const updateScore = (winner: LLM) => {
        setScores(prev => {
            const newScores = { ...prev, [winner]: (prev[winner] || 0) + 1 };
            localStorage.setItem("battleScores", JSON.stringify(newScores));
            return newScores;
        });
    };

    return (
        <BattleContext.Provider value={{ llm1, llm2, game, scores, setLLM1, setLLM2, setGame, updateScore }}>
            {children}
        </BattleContext.Provider>
    );
};

export const useBattleContext = () => {
    const context = useContext(BattleContext);
    if (!context) throw new Error("useBattleContext must be used within BattleProvider");
    return context;
};
