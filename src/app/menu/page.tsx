"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBattleContext, Game } from "@/context/BattleContext";
import { LLMType } from "@/lib/llmStore";
import { FighterGrid, VSScreen, SelectionControls } from "@/components/FighterComponents";
import { Typography, Button, Layout, Space, Card, Radio, Row, Col, Divider } from "antd";

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
        <Layout>
            <Content style={{ padding: "24px", minHeight: "100vh" }}>
                <Space direction="vertical" align="center" size="large" style={{ width: "100%" }}>
                    {/* Header */}
                    <Title level={1}>CHOOSE YOUR FIGHTER</Title>

                    {/* VS Screen */}
                    <Row justify="center" align="middle" style={{ width: "100%" }}>
                        <Col span={10} style={{ textAlign: "center" }}>
                            <Card bordered>
                                <Space direction="vertical" align="center">
                                    <div>{llm1 ? llm1 : "Player 1"}</div>
                                    {llm1 && <div>Wins: {scores[llm1] || 0}</div>}
                                </Space>
                            </Card>
                        </Col>
                        <Col span={4} style={{ textAlign: "center" }}>
                            <Title level={1}>VS</Title>
                        </Col>
                        <Col span={10} style={{ textAlign: "center" }}>
                            <Card bordered>
                                <Space direction="vertical" align="center">
                                    <div>{llm2 ? llm2 : "Player 2"}</div>
                                    {llm2 && <div>Wins: {scores[llm2] || 0}</div>}
                                </Space>
                            </Card>
                        </Col>
                    </Row>

                    {/* Selection info */}
                    <Title level={4}>{selectionStep === 1 ? "Select Player 1" : "Select Player 2"}</Title>

                    {/* Fighter selection grid */}
                    <Card style={{ width: "100%" }}>
                        <Row gutter={[16, 16]}>
                            {availableLLMs.map(llm => (
                                <Col key={llm} span={4}>
                                    <Card
                                        hoverable
                                        onClick={() => handleLLMSelect(llm)}
                                        style={{
                                            textAlign: "center",
                                            borderColor: llm1 === llm || llm2 === llm ? "#1677ff" : undefined,
                                        }}
                                    >
                                        {llm}
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Card>

                    {/* Game selection */}
                    <Card style={{ width: "100%" }} title="SELECT GAME">
                        <Radio.Group value={game} onChange={e => setGame(e.target.value)}>
                            <Space>
                                {gameOptions.map(g => (
                                    <Radio.Button key={g} value={g}>
                                        {g.toUpperCase()}
                                    </Radio.Button>
                                ))}
                            </Space>
                        </Radio.Group>
                    </Card>

                    {/* Controls */}
                    <Space>
                        <Button onClick={resetSelection}>RESET</Button>
                        <Button type="primary" onClick={startBattle} disabled={!llm1 || !llm2 || !game}>
                            START BATTLE
                        </Button>
                    </Space>
                </Space>
            </Content>
        </Layout>
    );
}
