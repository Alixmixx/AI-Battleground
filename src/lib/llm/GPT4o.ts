import OpenAI from "openai";
import { BaseLLM, GenerateResponse } from "./BaseLLM";
import { Tool } from "@/lib/tool";
export class GPT4o extends BaseLLM {
    private client: OpenAI;

    constructor(apiKey: string = process.env.OPENAI_API_KEY || "") {
        super("GPT-4o", apiKey, 0.7, 1000, "https://api.openai.com/v1", "You are a strategic AI for games.");
        this.client = new OpenAI({ apiKey: this.apiKey });
    }

    async generate(prompt: string, tools: Tool[] = []): Promise<GenerateResponse> {
        // Extract tool schemas here, right before the API call
        const toolSchemas = tools.map(t => t.getSchema());

        const response = await this.client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            tools: toolSchemas, // Pass the schemas to OpenAI
            tool_choice: "required", // Forces the LLM to use a tool
        });

        const message = response.choices[0].message;
        if (message.tool_calls) {
            const toolCalls = message.tool_calls.map(call => ({
                name: call.function.name,
                input: JSON.parse(call.function.arguments),
            }));
            const toolResults = await this.executeTools(toolCalls, tools);
            return { content: message.content || "", toolResults };
        }

        return { content: message.content || "", toolResults: [] };
    }
}
