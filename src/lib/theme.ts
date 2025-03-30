import { ThemeConfig } from "antd";

// Define color constants
const colors = {
    primary: "#ffffff",
    accent: "#ff6600",
    text: "#333333",
    background: "#ffffff",
    secondary: "#f5f5f5",
    border: "#e0e0e0",
    // Game board colors
    boardEmpty: "#f8f8f8",
    boardShip: "#b0b0b0",
    boardHit: "#ff4d4d",
    boardMiss: "#66a3ff",
    boardHover: "rgba(255, 102, 0, 0.2)",
};

// Create a reusable Ant Design theme configuration
export const theme: ThemeConfig = {
    token: {
        colorPrimary: colors.accent,
        colorText: colors.text,
        colorBgContainer: colors.primary,
        borderRadius: 0,
        colorBgElevated: colors.primary,
        colorBorder: colors.border,
        colorBgContainerDisabled: colors.secondary,
        fontFamily: "Arial, Helvetica, sans-serif",
    },
    components: {
        Button: {
            borderRadius: 0,
            colorText: colors.text,
        },
        Card: {
            borderRadius: 0,
            colorBorderSecondary: colors.border,
            colorBgContainer: colors.primary,
        },
        Typography: {
            colorText: colors.text,
            colorTextHeading: colors.text,
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
        Radio: {
            colorPrimary: colors.accent,
        },
        Checkbox: {
            colorPrimary: colors.accent,
        },
    },
};

// Export color constants for direct usage
export const themeColors = colors;
