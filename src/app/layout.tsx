import { ReactNode } from "react";
import { BattleProvider } from "@/context/BattleContext";
import "./globals.css";

export const metadata = {
    title: "AI Battleground",
    description: "Let AI battle it out!",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                <BattleProvider>{children}</BattleProvider>
            </body>
        </html>
    );
}
