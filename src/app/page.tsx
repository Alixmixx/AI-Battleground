"use client";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    const enterBattleground = () => {
        router.push("/menu");
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center tekken-scanlines">
            <div className="tekken-container text-center p-8">
                <h1 className="text-4xl tekken-heading mb-4">AI BATTLEGROUND</h1>
                <p className="text-lg mb-6">CUTE AI, EPIC BATTLES - READY TO RUMBLE?</p>
                <button onClick={enterBattleground} className="tekken-button">
                    ENTER BATTLEGROUND
                </button>
            </div>
        </div>
    );
}