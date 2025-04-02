import { ThemeConfig } from "antd";

// Define color constants
const colors = {
    primary: "#121212",
    accent: "#ff3e00", // Red (Player 2)
    accentBlue: "#00b4ff", // Blue (Player 1)
    text: "#ffffff",
    background: "#121212",
    secondary: "#1e1e1e",
    border: "#333333",
    highlight: "#ff3e00",
    neonBlue: "#00b4ff",
    glowAccent: "0 0 10px #ff3e00, 0 0 20px rgba(255, 62, 0, 0.5)",
    glowBlue: "0 0 10px #00b4ff, 0 0 20px rgba(0, 180, 255, 0.5)",
    // Game board colors
    boardEmpty: "#1e1e1e",
    boardShip: "#666666",
    boardHit: "#ff3e00",
    boardMiss: "#00b4ff",
    boardHover: "rgba(255, 62, 0, 0.3)",
};

// Create a reusable Ant Design theme configuration
export const theme: ThemeConfig = {
    token: {
        colorPrimary: colors.accent,
        colorText: colors.text,
        colorBgContainer: colors.primary,
        borderRadius: 4,
        colorBgElevated: colors.secondary,
        colorBorder: colors.border,
        colorBgContainerDisabled: colors.secondary,
        fontFamily: "'Russo One', 'Black Ops One', sans-serif",
    },
    components: {
        Button: {
            borderRadius: 4,
            colorText: colors.text,
            colorPrimaryHover: colors.neonBlue,
        },
        Card: {
            borderRadius: 8,
            colorBorderSecondary: colors.border,
            colorBgContainer: colors.secondary,
        },
        Typography: {
            colorText: colors.text,
            colorTextHeading: colors.text,
        },
        Input: {
            borderRadius: 4,
        },
        Select: {
            borderRadius: 4,
        },
        Modal: {
            borderRadius: 8,
        },
        Radio: {
            colorPrimary: colors.accent,
        },
        Checkbox: {
            colorPrimary: colors.accent,
        },
        Layout: {
            colorBgLayout: colors.background,
        },
    },
};

// Export color constants for direct usage
export const themeColors = colors;