import { NextResponse } from "next/server";
import { BaseLLM, GPT4o, GPT35, Claude, Gemini, Human } from "@/lib/llm";
import { MastermindTool } from "@/lib/tool/Mastermind";
import logger from "@/lib/logger";

export async function POST(request: Request) {
    try {
        const { prompt, llmName } = await request.json();

        // Initialize the correct LLM based on the name
        let llm: BaseLLM;

        switch (llmName) {
            case "GPT-4o":
                llm = new GPT4o(process.env.OPENAI_API_KEY);
                break;
            case "GPT-3.5":
                llm = new GPT35(process.env.OPENAI_API_KEY);
                break;
            case "Claude":
                llm = new Claude(process.env.ANTHROPIC_API_KEY);
                break;
            case "Gemini":
                llm = new Gemini(process.env.GOOGLE_API_KEY);
                break;
            case "Human":
                llm = new Human("");
                break;
            default:
                llm = new GPT4o(process.env.OPENAI_API_KEY);
                break;
        }

        const tools = [new MastermindTool()];

        // Generate response using the LLM
        const response = await llm.generate(prompt, tools);
        logger.info("API response", { endpoint: "/api/mastermind/move", llmName, response });

        return NextResponse.json(response);
    } catch (error) {
        logger.error("API request failed", { endpoint: "/api/mastermind/move", error: String(error) });
        return NextResponse.json({ error: "Failed to process move" }, { status: 500 });
    }
}
