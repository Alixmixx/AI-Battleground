import { NextResponse } from "next/server";
import { GPT4o } from "@/lib/llm/GPT4o";
import { TicTacToeTool } from "@/lib/tool/TicTacToe";
import logger from "@/lib/logger";

export async function POST(request: Request) {
    try {
        const { prompt, llmName } = await request.json();

        const llm = new GPT4o(process.env.OPENAI_API_KEY);
        const tools = [new TicTacToeTool()];

        const response = await llm.generate(prompt, tools);
        logger.info("API response", { endpoint: "/api/tictactoe/move", response });

        return NextResponse.json(response);
    } catch (error) {
        logger.error("API request failed", { endpoint: "/api/tictactoe/move", error: String(error) });
        return NextResponse.json({ error: "Failed to process move" }, { status: 500 });
    }
}
