import { LLMType } from "@/lib/llmStore";
import { Game } from "@/context/BattleContext";
import { Row, Col, Space, Button, Card, Typography, Image, Layout } from "antd";
import { themeColors } from "@/lib/theme";
import styled from "styled-components";

const { Title, Text } = Typography;
const { Content } = Layout;

// Individual Fighter Card Component
interface FighterCardProps {
    llm: LLMType;
    isSelected: boolean;
    onClick: (llm: LLMType) => void;
    disabled: boolean;
    selectionStep: 1 | 2;
}

export const FighterCard = ({ llm, isSelected, onClick, disabled, selectionStep }: FighterCardProps) => {
    // Map LLM types to corresponding image paths
    const getImagePath = (llmType: LLMType) => {
        const mapping: Record<string, string> = {
            GPT4o: "/assets/images/fighters/gpt4o.png",
            GPT35: "/assets/images/fighters/gpt4o.png",
            Claude: "/assets/images/fighters/claude.png",
            Grok: "/assets/images/fighters/grok.png",
            Gemini: "/assets/images/fighters/gemini.png",
        };

        return mapping[llmType] || "/assets/images/fighters/gpt4o.png";
    };

    return (
        <FighterCardContainer
            $isSelected={isSelected}
            $selectionStep={selectionStep}
            $disabled={disabled}
            hoverable
            bordered={isSelected}
            onClick={() => !disabled && onClick(llm)}
            bodyStyle={{ padding: "12px", textAlign: "center" }}
        >
            <FighterImageWrapper>
                <FighterImage preview={false} src={getImagePath(llm)} alt={llm} />
            </FighterImageWrapper>
            <FighterName $isSelected={isSelected} $selectionStep={selectionStep} strong>
                {llm}
            </FighterName>
        </FighterCardContainer>
    );
};

// Fighter Portrait Component
interface FighterPortraitProps {
    llm: LLMType | undefined;
    side: string;
    isPlayerOne: boolean;
}

export const FighterPortrait = ({ llm, side, isPlayerOne }: FighterPortraitProps) => {
    // Map LLM types to corresponding image paths
    const getImagePath = (llmType: LLMType | undefined) => {
        if (!llmType) return "/assets/images/fighters/gpt4o.png";

        const mapping: Record<string, string> = {
            GPT4o: "/assets/images/fighters/gpt4o.png",
            GPT35: "/assets/images/fighters/gpt4o.png",
            Claude: "/assets/images/fighters/claude.png",
            Grok: "/assets/images/fighters/grok.png",
            Gemini: "/assets/images/fighters/gemini.png",
        };

        return mapping[llmType] || "/assets/images/fighters/gpt4o.png";
    };

    return (
        <PortraitContainer $isPlayerOne={isPlayerOne} $hasLlm={!!llm}>
            <PortraitImageWrapper>
                <PortraitImage preview={false} src={getImagePath(llm)} alt={llm || side} $hasLlm={!!llm} />
                {!llm && <PortraitPlaceholder>SELECT FIGHTER</PortraitPlaceholder>}
            </PortraitImageWrapper>
            <PortraitInfo>
                <PortraitName level={3} $hasLlm={!!llm} $isPlayerOne={isPlayerOne}>
                    {llm || "???"}
                </PortraitName>
                <PortraitSide>{side}</PortraitSide>
            </PortraitInfo>
        </PortraitContainer>
    );
};

// VS Screen Component
interface VSScreenProps {
    fighter1: LLMType | undefined;
    fighter2: LLMType | undefined;
}

export const VSScreen = ({ fighter1, fighter2 }: VSScreenProps) => (
    <VSContainer justify="space-between" align="middle">
        <PlayerColumn xs={24} sm={11} $isLeft>
            <FighterPortrait llm={fighter1} side="Player 1" isPlayerOne={true} />
        </PlayerColumn>

        <VSColumn xs={24} sm={2}>
            <VSWrapper>
                <VSText level={1}>VS</VSText>
                {fighter1 && fighter2 && <VSGlow />}
            </VSWrapper>
        </VSColumn>

        <PlayerColumn xs={24} sm={11}>
            <FighterPortrait llm={fighter2} side="Player 2" isPlayerOne={false} />
        </PlayerColumn>
    </VSContainer>
);

// Fighter Selection Grid Component
interface FighterGridProps {
    fighters: LLMType[];
    selectedFighter1: LLMType | undefined;
    selectedFighter2: LLMType | undefined;
    selectionStep: 1 | 2;
    onSelect: (fighter: LLMType) => void;
}

export const FighterGrid = ({ fighters, selectedFighter1, selectedFighter2, selectionStep, onSelect }: FighterGridProps) => (
    <Row gutter={[16, 16]}>
        {fighters.map(fighter => (
            <Col xs={12} sm={8} md={6} key={fighter}>
                <FighterCard
                    llm={fighter}
                    isSelected={
                        (selectionStep === 1 && fighter === selectedFighter1) || (selectionStep === 2 && fighter === selectedFighter2)
                    }
                    onClick={onSelect}
                    disabled={
                        (selectionStep === 2 && fighter === selectedFighter1) || (selectionStep === 1 && selectedFighter2 === fighter)
                    }
                    selectionStep={fighter === selectedFighter1 ? 1 : fighter === selectedFighter2 ? 2 : selectionStep}
                />
            </Col>
        ))}
    </Row>
);

// Battlefield Selection Component
interface BattlefieldSelectionProps {
    gameOptions: Game[];
    selectedGame: Game | undefined;
    onGameSelect: (game: Game) => void;
}

export const BattlefieldSelection = ({ gameOptions, selectedGame, onGameSelect }: BattlefieldSelectionProps) => (
    <BattlefieldCard bodyStyle={{ padding: "24px" }}>
        <Space direction="vertical" size="middle" style={{ width: "100%", textAlign: "center" }}>
            <BattlefieldTitle level={4}>SELECT BATTLEFIELD</BattlefieldTitle>
            <Row justify="center" gutter={[16, 16]}>
                {gameOptions.map(game => (
                    <Col key={game} xs={12} sm={8} md={6}>
                        <GameOptionCard
                            hoverable
                            $isSelected={game === selectedGame}
                            onClick={() => onGameSelect(game)}
                            bodyStyle={{ padding: "12px" }}
                        >
                            <GameOptionName level={5} $isSelected={game === selectedGame}>
                                {game}
                            </GameOptionName>
                        </GameOptionCard>
                    </Col>
                ))}
            </Row>
        </Space>
    </BattlefieldCard>
);

// Game Controls Component
interface SelectionControlsProps {
    onReset: () => void;
    onStart: () => void;
    disableStart: boolean;
}

export const SelectionControls = ({ onReset, onStart, disableStart }: SelectionControlsProps) => (
    <ControlContainer>
        <ResetButton danger onClick={onReset}>
            RESET
        </ResetButton>
        <StartButton type="primary" onClick={onStart} disabled={disableStart} $disabled={disableStart} className="start-battle">
            START BATTLE
        </StartButton>
    </ControlContainer>
);

// Styled Components
export const GameArena = styled(Layout)`
    background: radial-gradient(circle at center, ${themeColors.secondary} 0%, ${themeColors.primary} 100%);
    min-height: 100vh;
    position: relative;
    overflow: hidden;
`;

export const GameBackground = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
        linear-gradient(to right, ${themeColors.border} 1px, transparent 1px),
        linear-gradient(to bottom, ${themeColors.border} 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.1;
    z-index: 0;
`;

export const GameContent = styled(Content)`
    padding: 40px 24px;
    min-height: 100vh;
    position: relative;
    z-index: 1;
    max-width: 1400px;
    margin: 0 auto;
`;

// Header Components
export const HeaderContainer = styled.div`
    text-align: center;
    margin-bottom: 40px;
    position: relative;
`;

export const GameTitle = styled(Title)`
    color: ${themeColors.text};
    font-size: 3.5rem;
    text-transform: uppercase;
    letter-spacing: 4px;
    margin: 0;
    padding: 20px 0;
    font-weight: 900;
    text-shadow:
        0 0 10px ${themeColors.accent},
        0 0 20px rgba(255, 62, 0, 0.5);
    position: relative;
    display: inline-block;
`;

export const TitleUnderline = styled.div`
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 4px;
    background: ${themeColors.accent};
    box-shadow: ${themeColors.glowAccent};
`;

export const BlinkingCursor = styled.span`
    animation: blink 1s infinite;
`;

// Fighter Card Components
export const FighterCardContainer = styled(Card)<{
    $isSelected?: boolean;
    $selectionStep?: 1 | 2;
    $disabled?: boolean;
}>`
    overflow: hidden;
    position: relative;
    cursor: ${props => (props.$disabled ? "not-allowed" : "pointer")};
    border-color: ${props =>
        props.$isSelected ? (props.$selectionStep === 1 ? themeColors.accentBlue : themeColors.accent) : "transparent"};
    border-width: ${props => (props.$isSelected ? "2px" : "0")};
    box-shadow: ${props => (props.$isSelected ? (props.$selectionStep === 1 ? themeColors.glowBlue : themeColors.glowAccent) : "none")};
    opacity: ${props => (props.$disabled ? 0.5 : 1)};
    transition: all 0.3s ease;
    background: ${props =>
        props.$isSelected ? `linear-gradient(135deg, ${themeColors.secondary} 0%, ${themeColors.primary} 100%)` : themeColors.secondary};

    &:hover {
        transform: ${props => (props.$disabled ? "none" : "translateY(-5px)")};
    }
`;

export const FighterImageWrapper = styled.div`
    margin-bottom: 12px;
    position: relative;
    overflow: hidden;
    border-radius: 4px;
`;

export const FighterImage = styled(Image)`
    width: 100%;
`;

export const FighterName = styled(Text)<{
    $isSelected?: boolean;
    $selectionStep?: 1 | 2;
}>`
    font-size: 16px;
    font-weight: bold;
    color: ${props => {
        if (!props.$isSelected) return themeColors.text;
        return props.$selectionStep === 1 ? themeColors.accentBlue : themeColors.accent;
    }};
    text-transform: uppercase;
    letter-spacing: 1px;
`;

// Fighter Portrait Components
export const PortraitContainer = styled(Card)<{
    $isPlayerOne?: boolean;
    $hasLlm?: boolean;
}>`
    text-align: center;
    border-color: ${props => (props.$hasLlm ? (props.$isPlayerOne ? themeColors.accentBlue : themeColors.accent) : themeColors.border)};
    border-width: ${props => (props.$hasLlm ? "2px" : "1px")};
    box-shadow: ${props => (props.$hasLlm ? (props.$isPlayerOne ? themeColors.glowBlue : themeColors.glowAccent) : "none")};
    background: linear-gradient(135deg, ${themeColors.secondary} 0%, ${themeColors.primary} 100%);
    overflow: hidden;
    position: relative;
`;

export const PortraitImageWrapper = styled.div`
    margin-bottom: 16px;
    position: relative;
    border-radius: 8px;
    overflow: hidden;
`;

export const PortraitImage = styled(Image)<{
    $hasLlm?: boolean;
}>`
    max-width: 300px;
    filter: ${props => (props.$hasLlm ? "none" : "grayscale(100%) brightness(0.7)")};
    transition: all 0.5s ease;
`;

export const PortraitPlaceholder = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    color: ${themeColors.text};
    font-size: 24px;
    font-weight: bold;
`;

export const PortraitInfo = styled.div`
    background: rgba(0, 0, 0, 0.5);
    padding: 12px;
    border-radius: 4px;
`;

export const PortraitName = styled(Title)<{
    $hasLlm?: boolean;
    $isPlayerOne?: boolean;
}>`
    margin: 0;
    color: ${props => (props.$hasLlm ? (props.$isPlayerOne ? themeColors.accentBlue : themeColors.accent) : themeColors.text)};
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: ${props =>
        props.$hasLlm ? `0 0 10px ${props.$isPlayerOne ? "rgba(0, 180, 255, 0.5)" : "rgba(255, 62, 0, 0.5)"}` : "none"};
`;

export const PortraitSide = styled(Text)`
    color: ${themeColors.text};
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 1px;
`;

// VS Screen Components
export const VSContainer = styled(Row)`
    width: 100%;
    margin-bottom: 2rem;
`;

export const PlayerColumn = styled(Col)<{
    $isLeft?: boolean;
}>`
    position: relative;
    transform: perspective(1000px) rotateY(${props => (props.$isLeft ? "5deg" : "-5deg")});
    transition: all 0.5s ease;
`;

export const VSColumn = styled(Col)`
    text-align: center;
    margin: 16px 0;
    position: relative;
`;

export const VSWrapper = styled.div`
    position: relative;
    padding: 20px 0;
`;

export const VSText = styled(Title)`
    margin: 0;
    color: ${themeColors.accent};
    text-shadow: ${themeColors.glowAccent};
    font-weight: bold;
    font-size: 48px;
    transform: skewX(-15deg);
    letter-spacing: 2px;
`;

export const VSGlow = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle, rgba(0, 180, 255, 0.2) 0%, rgba(255, 62, 0, 0.2) 100%);
    filter: blur(20px);
    z-index: -1;
`;

// Selection Status Components
export const SelectionStatus = styled.div`
    text-align: center;
    margin-top: 30px;
    margin-bottom: 20px;
    position: relative;
`;

export const SelectionPhase = styled(Title)<{
    $isPlayerOne?: boolean;
}>`
    color: ${props => (props.$isPlayerOne ? themeColors.accentBlue : themeColors.accent)};
    text-transform: uppercase;
    letter-spacing: 3px;
    display: inline-block;
    background: rgba(0, 0, 0, 0.3);
    padding: 10px 30px;
    border-radius: 4px;
    box-shadow: ${props => (props.$isPlayerOne ? themeColors.glowBlue : themeColors.glowAccent)};
    margin: 0;
`;

// Fighter Grid Components
export const SelectionGridCard = styled(Card)`
    width: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    border: 1px solid ${themeColors.border};
    margin-bottom: 40px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

// Battlefield Selection Components
export const BattlefieldCard = styled(Card)`
    width: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    border: 1px solid ${themeColors.border};
    margin-bottom: 40px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

export const BattlefieldTitle = styled(Title)`
    color: ${themeColors.text};
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 20px;
`;

export const GameOptionCard = styled(Card)<{
    $isSelected?: boolean;
}>`
    border-color: ${props => (props.$isSelected ? themeColors.accent : "transparent")};
    border-width: ${props => (props.$isSelected ? "2px" : "0")};
    box-shadow: ${props => (props.$isSelected ? themeColors.glowAccent : "none")};
    background: ${props =>
        props.$isSelected ? `linear-gradient(135deg, ${themeColors.secondary} 0%, ${themeColors.primary} 100%)` : themeColors.secondary};
    text-align: center;
    padding: 20px 10px;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-5px);
    }
`;

export const GameOptionName = styled(Title)<{
    $isSelected?: boolean;
}>`
    color: ${props => (props.$isSelected ? themeColors.accent : themeColors.text)};
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0;
`;

// Controls Components
export const ControlContainer = styled.div`
    width: 100%;
    padding: 20px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: center;
    gap: 24px;
`;

export const ResetButton = styled(Button)`
    min-width: 120px;
    height: 48px;
    letter-spacing: 1px;
    font-weight: bold;
`;

export const StartButton = styled(Button)<{
    $disabled?: boolean;
}>`
    min-width: 200px;
    height: 48px;
    letter-spacing: 2px;
    font-weight: bold;
    background: ${props => (props.$disabled ? "rgba(30,30,30,0.7)" : themeColors.accent)};
    box-shadow: ${props => (props.$disabled ? "none" : themeColors.glowAccent)};
    border: none;

    &:not(:disabled) {
        animation: glow 2s infinite;
    }

    &:not(:disabled):hover {
        animation:
            pulse 0.5s ease-in-out,
            glow 2s infinite;
    }
`;
