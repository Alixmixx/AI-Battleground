"use client";
import { useRouter } from "next/navigation";
import { Typography, Button, Layout } from "antd";
import styled from "styled-components";

const { Title, Paragraph } = Typography;
const { Content } = Layout;

const StyledContent = styled(Content)`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: var(--color-tekken-background);
    position: relative;

    &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2) 1px, transparent 1px, transparent 3px);
        pointer-events: none;
        z-index: 10;
    }
`;

const StyledContainer = styled.div`
    border: 3px solid var(--color-tekken-border);
    border-radius: 2px;
    padding: 1.5rem;
    background-color: var(--color-tekken-card);
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.8);
    position: relative;
    text-align: center;
`;

const StyledButton = styled(Button)`
    background-color: var(--color-tekken-primary);
    color: var(--color-tekken-text);
    border: 2px solid var(--color-tekken-border);
    padding: 0.75rem 1.5rem;
    border-radius: 2px;
    font-weight: 700;
    letter-spacing: 2px;
    height: auto;

    &:hover {
        background-color: var(--color-tekken-secondary);
        box-shadow: 0 0 8px var(--color-tekken-accent);
    }
`;

export default function Home() {
    const router = useRouter();

    const enterBattleground = () => {
        router.push("/menu");
    };

    return (
        <StyledContent>
            <StyledContainer>
                <Title
                    level={1}
                    style={{
                        color: "var(--color-tekken-text)",
                        fontWeight: 700,
                        letterSpacing: "3px",
                        textShadow: "0 0 5px var(--color-tekken-accent)",
                        marginBottom: "1rem",
                    }}
                >
                    AI BATTLEGROUND
                </Title>
                <Paragraph
                    style={{
                        fontSize: "1.125rem",
                        marginBottom: "1.5rem",
                        color: "var(--color-tekken-text)",
                    }}
                >
                    CUTE AI, EPIC BATTLES - READY TO RUMBLE?
                </Paragraph>
                <StyledButton onClick={enterBattleground}>ENTER BATTLEGROUND</StyledButton>
            </StyledContainer>
        </StyledContent>
    );
}
