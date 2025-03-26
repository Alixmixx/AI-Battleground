import { LLMType } from "@/lib/llmStore";
import { Game } from "@/context/BattleContext";

interface FighterCardProps {
  llm: LLMType;
  isSelected: boolean;
  onClick: (llm: LLMType) => void;
  disabled: boolean;
}

export const FighterCard = ({
  llm,
  isSelected,
  onClick,
  disabled,
}: FighterCardProps) => (
  <button
    onClick={() => !disabled && onClick(llm)}
    className={`fighter-card ${isSelected ? "selected" : ""} ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    }`}
    disabled={disabled}
  >
    <div className="text-green-400 text-sm font-bold text-center">{llm}</div>
  </button>
);

interface FighterPortraitProps {
  llm: LLMType | undefined;
  side: string;
}

export const FighterPortrait = ({ llm, side }: FighterPortraitProps) => (
  <div className="fighter-display">
    <div className="fighter-portrait">
      <div className="text-green-400 text-2xl font-bold">{llm ?? "???"}</div>
    </div>
    <div className="fighter-name">{llm ?? side}</div>
  </div>
);

interface VSScreenProps {
  fighter1: LLMType | undefined;
  fighter2: LLMType | undefined;
}

export const VSScreen = ({ fighter1, fighter2 }: VSScreenProps) => (
  <div className="flex items-center justify-between w-full max-w-4xl mb-8">
    <FighterPortrait llm={fighter1} side="Player 1" />
    <div className="vs-text">VS</div>
    <FighterPortrait llm={fighter2} side="Player 2" />
  </div>
);

interface FighterGridProps {
  fighters: LLMType[];
  selectedFighter1: LLMType | undefined;
  selectedFighter2: LLMType | undefined;
  selectionStep: number;
  onSelect: (fighter: LLMType) => void;
}

export const FighterGrid = ({
  fighters,
  selectedFighter1,
  selectedFighter2,
  selectionStep,
  onSelect,
}: FighterGridProps) => (
  <div className="fighter-grid">
    {fighters.map((fighter) => (
      <FighterCard
        key={fighter}
        llm={fighter}
        isSelected={
          (selectionStep === 1 && fighter === selectedFighter1) ||
          (selectionStep === 2 && fighter === selectedFighter2)
        }
        onClick={onSelect}
        disabled={
          (selectionStep === 2 && fighter === selectedFighter1) ||
          (selectionStep === 1 && selectedFighter2 === fighter)
        }
      />
    ))}
  </div>
);

interface SelectionControlsProps {
  onReset: () => void;
  onStart: () => void;
  gameOptions: Game[];
  selectedGame: Game | undefined;
  onGameSelect: (game: Game) => void;
  disableStart: boolean;
}

export const SelectionControls = ({
  onReset,
  onStart,
  gameOptions,
  selectedGame,
  onGameSelect,
  disableStart,
}: SelectionControlsProps) => (
  <div className="mt-8 flex gap-4">
    <button
      onClick={onReset}
      className="tekken-button bg-red-900 hover:bg-red-800"
    >
      RESET
    </button>
    <button
      onClick={onStart}
      disabled={disableStart}
      className="tekken-button disabled:opacity-50 disabled:cursor-not-allowed"
    >
      START BATTLE
    </button>
    <div className="flex gap-2">
      {gameOptions.map((game) => (
        <button
          key={game}
          onClick={() => onGameSelect(game)}
          className={`px-4 py-2 uppercase ${
            selectedGame === game
              ? "bg-green-700 text-white"
              : "bg-gray-700 text-green-400 hover:bg-gray-600"
          }`}
        >
          {game}
        </button>
      ))}
    </div>
  </div>
);
