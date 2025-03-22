"use client";
import { useRouter } from "next/navigation";
import { useBattleContext, Game } from "@/context/BattleContext";

export default function Menu() {
    const { llm1, llm2, game, setLLM1, setLLM2, setGame, scores, availableLLMs } = useBattleContext();
    const router = useRouter();

    const gameOptions: Game[] = ["battleship"];

    const startBattle = () => {
        if (llm1 && llm2 && game) {
            router.push(`/${encodeURIComponent(game)}`);
        }
    };

    return (
        <div className="min-h-screen tekken-scanlines">
            <div className="container mx-auto p-6">
                <h1 className="text-3xl tekken-heading text-center mb-6">AI BATTLEGROUND</h1>

                <div className="flex flex-col items-center gap-8">
                    <div className="tekken-container w-full max-w-md">
                        <h2 className="text-xl tekken-heading mb-2">PLAYER 1</h2>
                        <div className="flex gap-4">
                            {availableLLMs.map(llm => (
                                <button
                                    key={llm}
                                    onClick={() => setLLM1(llm)}
                                    className={`px-4 py-2 rounded ${llm1 === llm ? "tekken-button" : "border border-solid border-current"}`}
                                >
                                    {llm} (Wins: {scores[llm] || 0})
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="tekken-container w-full max-w-md">
                        <h2 className="text-xl tekken-heading mb-2">PLAYER 2</h2>
                        <div className="flex gap-4">
                            {availableLLMs.map(llm => (
                                <button
                                    key={llm}
                                    onClick={() => setLLM2(llm)}
                                    className={`px-4 py-2 rounded ${llm2 === llm ? "tekken-button" : "border border-solid border-current"}`}
                                >
                                    {llm} (Wins: {scores[llm] || 0})
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="tekken-container w-full max-w-md">
                        <h2 className="text-xl tekken-heading mb-2">GAME</h2>
                        <div className="flex gap-4">
                            {gameOptions.map(g => (
                                <button
                                    key={g}
                                    onClick={() => setGame(g)}
                                    className={`px-4 py-2 rounded ${game === g ? "tekken-button" : "border border-solid border-current"}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={startBattle}
                        disabled={!llm1 || !llm2 || !game}
                        className="tekken-button disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        START BATTLE
                    </button>
                </div>
            </div>
        </div>
    );
}
