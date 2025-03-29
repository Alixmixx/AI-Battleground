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
                fontFamily: "var(--font-modern)",
                colorPrimary: "var(--color-accent)",
                colorBgContainer: "var(--color-card)",
                colorText: "var(--color-text)",
              },
              components: {
                Button: {
                  borderRadius: 0,
                },
                Card: {
                  borderRadius: 0,
                },
                Input: {
                  borderRadius: 0,
                },
                Select: {
                  borderRadius: 0,
                },
                Modal: {
                  borderRadius: 0,
                },
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
