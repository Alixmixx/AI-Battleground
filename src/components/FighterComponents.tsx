import { LLMType } from "@/lib/llmStore";
import { Game } from "@/context/BattleContext";
import { Button, Card, Typography, Space, Row, Col, Image } from "antd";

const { Title, Text } = Typography;

interface FighterCardProps {
    llm: LLMType;
    isSelected: boolean;
    onClick: (llm: LLMType) => void;
    disabled: boolean;
}

export const FighterCard = ({ llm, isSelected, onClick, disabled }: FighterCardProps) => (
    <Button
        onClick={() => !disabled && onClick(llm)}
        disabled={disabled}
        type={isSelected ? "primary" : "default"}
        style={{ width: "100%" }}
    >
        <Text>{llm}</Text>
    </Button>
);

interface FighterPortraitProps {
    llm: LLMType | undefined;
    side: string;
}

export const FighterPortrait = ({ llm, side }: FighterPortraitProps) => (
    <Card style={{ textAlign: "center" }}>
        <Image width={256} src="/assets/images/fighters/gpt4o.png" />
        <Title level={3}>{llm ?? "???"}</Title>
        <Text>{llm ?? side}</Text>
    </Card>
);

interface VSScreenProps {
    fighter1: LLMType | undefined;
    fighter2: LLMType | undefined;
}

export const VSScreen = ({ fighter1, fighter2 }: VSScreenProps) => (
    <Row justify="space-between" align="middle" style={{ width: "100%", maxWidth: "1200px", marginBottom: "2rem" }}>
        <Col span={10}>
            <FighterPortrait llm={fighter1} side="Player 1" />
        </Col>
        <Col span={4} style={{ textAlign: "center" }}>
            <Title level={2}>VS</Title>
        </Col>
        <Col span={10}>
            <FighterPortrait llm={fighter2} side="Player 2" />
        </Col>
    </Row>
);

interface FighterGridProps {
    fighters: LLMType[];
    selectedFighter1: LLMType | undefined;
    selectedFighter2: LLMType | undefined;
    selectionStep: number;
    onSelect: (fighter: LLMType) => void;
}

export const FighterGrid = ({ fighters, selectedFighter1, selectedFighter2, selectionStep, onSelect }: FighterGridProps) => (
    <Row gutter={[16, 16]}>
        {fighters.map(fighter => (
            <Col xs={12} sm={8} md={6} lg={4} key={fighter}>
                <FighterCard
                    llm={fighter}
                    isSelected={
                        (selectionStep === 1 && fighter === selectedFighter1) || (selectionStep === 2 && fighter === selectedFighter2)
                    }
                    onClick={onSelect}
                    disabled={
                        (selectionStep === 2 && fighter === selectedFighter1) || (selectionStep === 1 && selectedFighter2 === fighter)
                    }
                />
            </Col>
        ))}
    </Row>
);

interface SelectionControlsProps {
    onReset: () => void;
    onStart: () => void;
    gameOptions: Game[];
    selectedGame: Game | undefined;
    onGameSelect: (game: Game) => void;
    disableStart: boolean;
}

export const SelectionControls = ({ onReset, onStart, gameOptions, selectedGame, onGameSelect, disableStart }: SelectionControlsProps) => (
    <Space size="large" style={{ marginTop: "2rem" }}>
        <Button danger onClick={onReset}>
            RESET
        </Button>
        <Button type="primary" onClick={onStart} disabled={disableStart}>
            START BATTLE
        </Button>
        <Space>
            {gameOptions.map(game => (
                <Button key={game} onClick={() => onGameSelect(game)} type={selectedGame === game ? "primary" : "default"}>
                    {game}
                </Button>
            ))}
        </Space>
    </Space>
);
