import { Tool } from "@/lib/tool/Tool";

type Cell = "empty" | "X" | "O";
type Board = Cell[][];

export class TicTacToeTool extends Tool {
    constructor() {
        super("makeMove", "Validates and processes a suggested move in a 3x3 Tic-Tac-Toe game based on the current board");
    }

    async execute(input: { board: Board; x: number; y: number }): Promise<any> {
        const { board, x, y } = input;
        const GRID_SIZE = 3;

        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
            return { valid: false, reason: "Coordinates out of bounds" };
        }

        if (board[x][y] !== "empty") {
            return { valid: false, reason: "Spot already taken" };
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
                        board: {
                            type: "array",
                            items: {
                                type: "array",
                                items: {
                                    type: "string",
                                    enum: ["empty", "X", "O"],
                                },
                            },
                            description: "The 3x3 grid representing the current game board",
                        },
                        x: {
                            type: "number",
                            description: "The x-coordinate of the suggested move (0-2)",
                        },
                        y: {
                            type: "number",
                            description: "The y-coordinate of the suggested move (0-2)",
                        },
                    },
                    required: ["board", "x", "y"],
                    additionalProperties: false,
                },
                strict: true,
            },
        };
    }
}
