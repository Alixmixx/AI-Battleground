"use client";
import { useRouter } from "next/navigation";
import { useBattleContext, LLM, Game } from "@/context/BattleContext";

export default function Menu() {
    const { llm1, llm2, game, setLLM1, setLLM2, setGame, scores } = useBattleContext();
    const router = useRouter();

    const llmOptions: LLM[] = ["GPT-4o", "GPT-3.5"];
    const gameOptions: Game[] = ["battleship"];

    const startBattle = () => {
        if (llm1 && llm2 && game) {
            router.push(`/${encodeURIComponent(game)}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-center mb-6">Choose Your Fighters</h1>
            <div className="flex flex-col items-center gap-8">
                <div>
                    <h2 className="text-xl mb-2">Player 1</h2>
                    <div className="flex gap-4">
                        {llmOptions.map(llm => (
                            <button
                                key={llm}
                                onClick={() => setLLM1(llm)}
                                className={`px-4 py-2 rounded ${llm1 === llm ? "bg-blue-600 text-white" : "bg-gray-300"}`}
                            >
                                {llm} (Wins: {scores[llm] || 0})
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-xl mb-2">Player 2</h2>
                    <div className="flex gap-4">
                        {llmOptions.map(llm => (
                            <button
                                key={llm}
                                onClick={() => setLLM2(llm)}
                                className={`px-4 py-2 rounded ${llm2 === llm ? "bg-red-600 text-white" : "bg-gray-300"}`}
                            >
                                {llm} (Wins: {scores[llm] || 0})
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-xl mb-2">Game</h2>
                    <div className="flex gap-4">
                        {gameOptions.map(g => (
                            <button
                                key={g}
                                onClick={() => setGame(g)}
                                className={`px-4 py-2 rounded ${game === g ? "bg-green-600 text-white" : "bg-gray-300"}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={startBattle}
                    disabled={!llm1 || !llm2 || !game}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg disabled:bg-gray-400"
                >
                    Start Battle
                </button>
            </div>
        </div>
    );
}
