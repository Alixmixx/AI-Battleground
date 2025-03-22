import { BaseLLM, GenerateResponse, Tool } from "./BaseLLM";

export class GPT35 extends BaseLLM {
    constructor(apiKey: string = "") {
        super("GPT-3.5", apiKey, 0.7, 1000, "https://api.openai.com/v1", "You are a strategic AI for games.");
    }

    async generate(prompt: string, tools: Tool[] = []): Promise<GenerateResponse> {
        const content = "Random move: 5,5"; 
        console.log("Prompt received:", prompt);

        if (tools.length > 0) {
            console.log("Tools provided:", tools);
        }
        return { content, toolResults: [] };
    }
}
