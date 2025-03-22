"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BaseLLM } from "@/lib/llm";
import { LLM_REGISTRY, LLMType } from "@/lib/llmStore";

export type Game = "battleship";
export type Scores = Record<string, number>;

interface BattleContextType {
    llm1: LLMType | null;
    llm2: LLMType | null;
    game: Game | null;
    scores: Scores;
    availableLLMs: LLMType[];
    getLLMInstance: (llmName: LLMType) => BaseLLM;
    setLLM1: (llm: LLMType) => void;
    setLLM2: (llm: LLMType) => void;
    setGame: (game: Game) => void;
    updateScore: (winner: LLMType) => void;
}

const BattleContext = createContext<BattleContextType | undefined>(undefined);

export const BattleProvider = ({ children }: { children: ReactNode }) => {
    const [llm1, setLLM1] = useState<LLMType | null>(null);
    const [llm2, setLLM2] = useState<LLMType | null>(null);
    const [game, setGame] = useState<Game | null>(null);
    const [scores, setScores] = useState<Scores>({});

    useEffect(() => {
        const stored = localStorage.getItem("battleScores");
        if (stored) setScores(JSON.parse(stored));
    }, []);

    const llmInstances = new Map<LLMType, BaseLLM>();
    const getLLMInstance = (llmName: LLMType): BaseLLM => {
        if (!llmInstances.has(llmName)) {
            const llmEntry = LLM_REGISTRY.find(entry => entry.name === llmName);
            if (!llmEntry) {
                throw new Error(`LLM ${llmName} not found in registry`);
            }
            llmInstances.set(llmName, llmEntry.create());
        }
        return llmInstances.get(llmName)!;
    };

    const updateScore = (winner: LLMType) => {
        setScores(prev => {
            const newScores = { ...prev, [winner]: (prev[winner] || 0) + 1 };
            localStorage.setItem("battleScores", JSON.stringify(newScores));
            return newScores;
        });
    };

    const availableLLMs = LLM_REGISTRY.map(entry => entry.name);

    return (
        <BattleContext.Provider
            value={{
                llm1,
                llm2,
                game,
                scores,
                availableLLMs,
                getLLMInstance,
                setLLM1,
                setLLM2,
                setGame,
                updateScore,
            }}
        >
            {children}
        </BattleContext.Provider>
    );
};

export const useBattleContext = () => {
    const context = useContext(BattleContext);
    if (!context) throw new Error("useBattleContext must be used within BattleProvider");
    return context;
};
