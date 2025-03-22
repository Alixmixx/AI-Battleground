import { BaseLLM, GenerateResponse, Tool } from "./BaseLLM";

export class GPT4o extends BaseLLM {
    constructor(apiKey: string = "") {
        super("GPT-4o", apiKey, 0.7, 1000, "https://api.openai.com/v1", "You are an advanced strategic AI for games.");
    }

    async generate(prompt: string, tools: Tool[] = []): Promise<GenerateResponse> {
        const content = "Random move: 3,3";

        if (tools.length > 0) {
            console.log("Tools provided:", tools);
        }

        console.log("Prompt received:", prompt);
        return { content, toolResults: [] };
    }
}
