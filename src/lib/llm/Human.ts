import OpenAI from "openai";
import { BaseLLM, GenerateResponse } from "./BaseLLM";
import { Tool } from "@/lib/tool";
import logger from "@/lib/logger";
export class Human extends BaseLLM {
    constructor(apiKey: string = process.env.OPENAI_API_KEY || "") {
        super("Human", apiKey, 0.7, 1000, "", "You are a Human.");
    }

    async generate(prompt: string, tools: Tool[] = []): Promise<GenerateResponse> {
        logger.info("Generating Human response", { model: this.name, prompt });

        // What should the human do? Maybe just use the prompt for toolCall and get it from the frontend?
        // Or should I make an other class?

        const toolSchemas = tools.map(t => t.getSchema());

        try {
            console.log("Prompt: ", prompt);
            console.log("Toolschemas: ", toolSchemas);

            // One tool support for now
            const toolCalls = [JSON.parse(prompt)];

            const toolResults = await this.executeTools(toolCalls, tools);
            return { content: "Human interaction", toolResults };
        } catch (error) {
            logger.error("Human call failed", { model: this.name, prompt, error: String(error) });
            throw error;
        }
    }
}
