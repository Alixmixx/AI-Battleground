"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const enterBattleground = () => {
    router.push("/menu");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">AI Battleground</h1>
      <p className="text-lg mb-6">Cute AI, Epic Battles - ready to rumble?</p>
      <button
        onClick={enterBattleground}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Enter Battleground
      </button>
    </div>
  );
}