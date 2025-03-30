"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBattleContext, Game } from "@/context/BattleContext";
import { LLMType } from "@/lib/llmStore";
import { FighterGrid, VSScreen, SelectionControls } from "@/components/FighterComponents";
import { Typography, Button, Layout, Space, Card, Radio } from "antd";

const { Title } = Typography;
const { Content } = Layout;

export default function Menu() {
    const { llm1, llm2, game, setLLM1, setLLM2, setGame, scores, availableLLMs } = useBattleContext();
    const [selectionStep, setSelectionStep] = useState<1 | 2>(1);
    const router = useRouter();

    const gameOptions: Game[] = ["battleship", "tictactoe"];

    const handleLLMSelect = (llm: LLMType) => {
        if (selectionStep === 1) {
            setLLM1(llm);
            setSelectionStep(2);
        } else {
            setLLM2(llm);
            if (!game) {
                setGame(gameOptions[0]);
            }
        }
    };

    const startBattle = () => {
        if (llm1 && llm2 && game) {
            router.push(`/${encodeURIComponent(game)}`);
        }
    };

    const resetSelection = () => {
        setLLM1(undefined);
        setLLM2(undefined);
        setSelectionStep(1);
    };

    return (
        <Content style={{ padding: "24px" }}>
            <Space direction="vertical" align="center" size="large" style={{ width: "100%" }}>
                <Title
                    level={1}
                    style={{
                        marginBottom: "24px",
                    }}
                >
                    AI BATTLEGROUND
                </Title>

                <Card title="PLAYER 1" style={{ width: "100%" }}>
                    <Radio.Group value={llm1} onChange={e => setLLM1(e.target.value)}>
                        <Space wrap>
                            {availableLLMs.map(llm => (
                                <Radio.Button key={llm} value={llm}>
                                    {llm} (Wins: {scores[llm] || 0})
                                </Radio.Button>
                            ))}
                        </Space>
                    </Radio.Group>
                </Card>

                <Card title="PLAYER 2" style={{ width: "100%" }}>
                    <Radio.Group value={llm2} onChange={e => setLLM2(e.target.value)}>
                        <Space wrap>
                            {availableLLMs.map(llm => (
                                <Radio.Button key={llm} value={llm}>
                                    {llm} (Wins: {scores[llm] || 0})
                                </Radio.Button>
                            ))}
                        </Space>
                    </Radio.Group>
                </Card>

                <Card title="GAME" style={{ width: "100%" }}>
                    <Radio.Group value={game} onChange={e => setGame(e.target.value)}>
                        <Space wrap>
                            {gameOptions.map(g => (
                                <Radio.Button key={g} value={g}>
                                    {g}
                                </Radio.Button>
                            ))}
                        </Space>
                    </Radio.Group>
                </Card>

                <Button type="primary" onClick={startBattle} disabled={!llm1 || !llm2 || !game}>
                    START BATTLE
                </Button>
            </Space>
        </Content>
    );
}
