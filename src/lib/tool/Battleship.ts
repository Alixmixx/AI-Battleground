// src/lib/tool/Battleship.ts
import { Tool } from "@/lib/tool/Tool";

type Cell = "empty" | "ship" | "hit" | "miss";
type Board = Cell[][];

export class BattleshipTool extends Tool {
    constructor() {
        super(
            "makeMove",
            "Validates and processes a suggested move in a 10x10 Battleship game based on the current view of the opponent's board"
        );
    }

    async execute(input: { view: Board; x: number; y: number }): Promise<any> {
        const { view, x, y } = input;
        const GRID_SIZE = 10;

        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
            return { valid: false, reason: "Coordinates out of bounds" };
        }

        if (view[x][y] !== "empty") {
            return { valid: false, reason: "Spot already targeted" };
        }

        return { valid: true, x, y };
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
                        view: {
                            type: "array",
                            items: {
                                type: "array",
                                items: {
                                    type: "string",
                                    enum: ["empty", "ship", "hit", "miss"],
                                },
                            },
                            description: "The 10x10 grid representing the player's view of the opponent's board",
                        },
                        x: {
                            type: "number",
                            description: "The x-coordinate of the suggested move (0-9)",
                        },
                        y: {
                            type: "number",
                            description: "The y-coordinate of the suggested move (0-9)",
                        },
                    },
                    required: ["view", "x", "y"],
                    additionalProperties: false,
                },
                strict: true,
            },
        };
    }
}
