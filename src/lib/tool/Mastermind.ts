// src/lib/tool/Mastermind.ts
import { Tool } from "@/lib/tool/Tool";

type Color = "red" | "blue" | "green" | "yellow" | "purple" | "orange";
type Feedback = "correct" | "wrong-position" | "incorrect";
type CodeGuess = Color[];
type GuessFeedback = Feedback[];

export class MastermindTool extends Tool {
    constructor() {
        super(
            "makeGuess",
            "Validates and processes a suggested code guess in a Mastermind game and returns feedback on the guess"
        );
    }

    async execute(input: { code: Color[]; guess: Color[] }): Promise<any> {
        const { code, guess } = input;
        const CODE_LENGTH = 4;

        if (!Array.isArray(guess) || guess.length !== CODE_LENGTH) {
            return { valid: false, reason: "Guess must contain exactly 4 colors" };
        }

        // All colors must be valid
        const validColors: Color[] = ["red", "blue", "green", "yellow", "purple", "orange"];
        for (const color of guess) {
            if (!validColors.includes(color)) {
                return { valid: false, reason: `Invalid color: ${color}` };
            }
        }

        // Generate feedback
        const feedback: GuessFeedback = this.generateFeedback(code, guess);
        
        return { 
            valid: true, 
            guess,
            feedback,
            isCorrect: feedback.every(f => f === "correct") 
        };
    }

    private generateFeedback(code: Color[], guess: Color[]): GuessFeedback {
        const feedback: Feedback[] = [];
        const codeRemaining: (Color | null)[] = [...code];
        const guessRemaining: (Color | null)[] = [...guess];

        // First pass: check for correct positions
        for (let i = 0; i < code.length; i++) {
            if (guess[i] === code[i]) {
                feedback.push("correct");
                codeRemaining[i] = null;
                guessRemaining[i] = null;
            }
        }

        // Second pass: check for wrong positions
        for (let i = 0; i < guessRemaining.length; i++) {
            const color = guessRemaining[i];
            if (color === null) continue;

            const codeIndex = codeRemaining.findIndex(c => c === color);
            if (codeIndex !== -1) {
                feedback.push("wrong-position");
                codeRemaining[codeIndex] = null;
                guessRemaining[i] = null;
            } else {
                feedback.push("incorrect");
            }
        }

        return feedback;
    }

    getSchema(): any {
        return {
            type: "function",
            function: {
                name: this.name,
                description: this.description,
                parameters: {
                    type: "object",
                    properties: {
                        code: {
                            type: "array",
                            items: {
                                type: "string",
                                enum: ["red", "blue", "green", "yellow", "purple", "orange"],
                            },
                            description: "The secret code to be guessed (4 colors)",
                        },
                        guess: {
                            type: "array",
                            items: {
                                type: "string",
                                enum: ["red", "blue", "green", "yellow", "purple", "orange"],
                            },
                            description: "The player's guess (4 colors)",
                        },
                    },
                    required: ["code", "guess"],
                    additionalProperties: false,
                },
                strict: true,
            },
        };
    }
}
