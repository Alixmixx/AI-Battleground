import { ReactNode } from "react";
import { BattleProvider } from "@/context/BattleContext";
import "./globals.css";
import { ConfigProvider } from "antd";
import { theme } from "@/lib/theme";

export const metadata = {
    title: "AI Battleground",
    description: "Let AI battle it out!",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                <ConfigProvider theme={theme}>
                    <BattleProvider>{children}</BattleProvider>
                </ConfigProvider>
            </body>
        </html>
    );
}
