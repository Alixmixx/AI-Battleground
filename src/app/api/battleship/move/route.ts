import { NextResponse } from "next/server";
import { GPT4o } from "@/lib/llm/GPT4o";
import { BattleshipTool } from "@/lib/tool/Battleship";

export async function POST(request: Request) {
  try {
    // Get the right llm later
    const { prompt, llmName } = await request.json();

    // Initialize the LLM on the server with the API key from environment variables
    const llm = new GPT4o(process.env.OPENAI_API_KEY);
    const tools = [new BattleshipTool()];

    // Generate response using the LLM
    const response = await llm.generate(prompt, tools);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json({ error: "Failed to process move" }, { status: 500 });
  }
}