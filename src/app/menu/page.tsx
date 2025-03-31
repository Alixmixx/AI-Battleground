"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBattleContext, Game } from "@/context/BattleContext";
import { LLMType } from "@/lib/llmStore";
import {
  FighterGrid,
  VSScreen,
  SelectionControls,
} from "@/components/FighterComponents";
import { Typography, Layout, Space, Card } from "antd";

const { Title } = Typography;
const { Content } = Layout;

export default function Menu() {
  const { llm1, llm2, game, setLLM1, setLLM2, setGame, scores, availableLLMs } =
    useBattleContext();
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

  const handleGameSelect = (selectedGame: Game) => {
    setGame(selectedGame);
  };

  return (
    <Layout>
      <Content style={{ padding: "24px", minHeight: "100vh" }}>
        <Space
          direction="vertical"
          align="center"
          size="large"
          style={{ width: "100%" }}
        >
          {/* Header */}
          <Title level={1}>CHOOSE YOUR FIGHTER</Title>

          {/* VS Screen */}
          <VSScreen fighter1={llm1} fighter2={llm2} />

          {/* Selection info */}
          <Title level={4}>
            {selectionStep === 1 ? "Select Player 1" : "Select Player 2"}
          </Title>

          {/* Fighter selection grid */}
          <Card style={{ width: "100%" }}>
            <FighterGrid
              fighters={availableLLMs}
              selectedFighter1={llm1}
              selectedFighter2={llm2}
              selectionStep={selectionStep}
              onSelect={handleLLMSelect}
            />
          </Card>

          {/* Game selection and controls */}
          <SelectionControls
            onReset={resetSelection}
            onStart={startBattle}
            gameOptions={gameOptions}
            selectedGame={game}
            onGameSelect={handleGameSelect}
            disableStart={!llm1 || !llm2 || !game}
          />
        </Space>
      </Content>
    </Layout>
  );
}
