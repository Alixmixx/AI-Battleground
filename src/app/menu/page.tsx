"use client";
import { useRouter } from "next/navigation";
import { useBattleContext, Game } from "@/context/BattleContext";
import { Typography, Button, Layout, Space, Card, Radio } from "antd";
import styled from "styled-components";

const { Title, Text } = Typography;
const { Content } = Layout;

const StyledContent = styled(Content)`
    min-height: 100vh;
    background-color: var(--color-tekken-background);
    position: relative;
    padding: 24px;

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

const StyledCard = styled(Card)`
    background-color: var(--color-tekken-card);
    border: 3px solid var(--color-tekken-border);
    border-radius: 2px;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.8);
    margin-bottom: 24px;
    width: 100%;
    max-width: 512px;

    .ant-card-head {
        border-bottom: 2px solid var(--color-tekken-border);
    }

    .ant-card-head-title {
        color: var(--color-tekken-text);
        font-weight: 700;
        letter-spacing: 2px;
    }
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

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const StyledRadioButton = styled(Radio.Button)`
    color: var(--color-tekken-text);
    border-color: var(--color-tekken-border);
    font-weight: 700;
    letter-spacing: 1px;

    &.ant-radio-button-wrapper-checked {
        background-color: var(--color-tekken-primary);
        border-color: var(--color-tekken-border);
        box-shadow: 0 0 8px var(--color-tekken-accent);
    }

    &:hover {
        color: var(--color-tekken-text);
        border-color: var(--color-tekken-border);
    }
`;

export default function Menu() {
    const { llm1, llm2, game, setLLM1, setLLM2, setGame, scores, availableLLMs } = useBattleContext();
    const router = useRouter();

    const gameOptions: Game[] = ["battleship", "tictactoe"];

    const startBattle = () => {
        if (llm1 && llm2 && game) {
            router.push(`/${encodeURIComponent(game)}`);
        }
    };

    return (
        <StyledContent>
            <Space direction="vertical" align="center" size="large" style={{ width: "100%" }}>
                <Title
                    level={1}
                    style={{
                        color: "var(--color-tekken-text)",
                        textAlign: "center",
                        marginBottom: "24px",
                        textShadow: "0 0 5px var(--color-tekken-accent)",
                    }}
                >
                    AI BATTLEGROUND
                </Title>

                <StyledCard title="PLAYER 1">
                    <Radio.Group value={llm1} onChange={e => setLLM1(e.target.value)}>
                        <Space wrap>
                            {availableLLMs.map(llm => (
                                <StyledRadioButton key={llm} value={llm}>
                                    {llm} (Wins: {scores[llm] || 0})
                                </StyledRadioButton>
                            ))}
                        </Space>
                    </Radio.Group>
                </StyledCard>

                <StyledCard title="PLAYER 2">
                    <Radio.Group value={llm2} onChange={e => setLLM2(e.target.value)}>
                        <Space wrap>
                            {availableLLMs.map(llm => (
                                <StyledRadioButton key={llm} value={llm}>
                                    {llm} (Wins: {scores[llm] || 0})
                                </StyledRadioButton>
                            ))}
                        </Space>
                    </Radio.Group>
                </StyledCard>

                <StyledCard title="GAME">
                    <Radio.Group value={game} onChange={e => setGame(e.target.value)}>
                        <Space wrap>
                            {gameOptions.map(g => (
                                <StyledRadioButton key={g} value={g}>
                                    {g}
                                </StyledRadioButton>
                            ))}
                        </Space>
                    </Radio.Group>
                </StyledCard>

                <StyledButton onClick={startBattle} disabled={!llm1 || !llm2 || !game}>
                    START BATTLE
                </StyledButton>
            </Space>
        </StyledContent>
    );
}
