import { ReactNode } from "react";
import { BattleProvider } from "@/context/BattleContext";
import "./globals.css";
import { ConfigProvider } from "antd";
import StyledComponentsRegistry from "@/lib/registry";

export const metadata = {
    title: "AI Battleground",
    description: "Let AI battle it out!",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                <StyledComponentsRegistry>
                    <ConfigProvider
                        theme={{
                            token: {
                                fontFamily: "var(--font-tekken)",
                                colorPrimary: "var(--color-tekken-accent)",
                                colorBgContainer: "var(--color-tekken-card)",
                                colorText: "var(--color-tekken-text)",
                            },
                        }}
                    >
                        <BattleProvider>{children}</BattleProvider>
                    </ConfigProvider>
                </StyledComponentsRegistry>
            </body>
        </html>
    );
}
