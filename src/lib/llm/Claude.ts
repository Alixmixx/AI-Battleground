import Anthropic from "@anthropic-ai/sdk";
import { BaseLLM, GenerateResponse } from "./BaseLLM";
import { Tool } from "@/lib/tool";
import logger from "@/lib/logger";

export class Claude extends BaseLLM {
    private client: Anthropic;

    constructor(apiKey: string = process.env.ANTHROPIC_API_KEY || "") {
        super("Claude 3.7", apiKey, 0.7, 1000, "https://api.anthropic.com", "You are a strategic AI for games.");
        this.client = new Anthropic({ apiKey: this.apiKey });
    }

    async generate(prompt: string, tools: Tool[] = []): Promise<GenerateResponse> {
        logger.info("Generating LLM response", { model: this.name, prompt });

        // Convert tool schema
        const toolSchemas = tools.map(t => {
            const schema = t.getSchema();
            return {
                name: schema.name,
                description: schema.description,
                input_schema: schema.parameters,
            };
        });

        try {
            const response = await this.client.messages.create({
                model: "claude-3-7-sonnet-20240229",
                max_tokens: this.maxTokens,
                temperature: this.temperature,
                messages: [{ role: "user", content: prompt }],
                tools: toolSchemas.length ? toolSchemas : undefined,
                system: this.instructions,
            });

            const textContent = response.content
                .filter(part => part.type === "text")
                .map(part => (part.type === "text" ? part.text : ""))
                .join("");

            logger.info("LLM response received", {
                content: textContent,
                toolUse: response.content.filter(part => part.type === "tool_use"),
            });

            // Handle tool calls
            const toolUseParts = response.content.filter(part => part.type === "tool_use");
            if (toolUseParts.length > 0) {
                const toolCalls = toolUseParts.map(part => ({
                    name: part.name,
                    input: part.input,
                }));

                const toolResults = await this.executeTools(toolCalls, tools);
                return { content: textContent, toolResults };
            }

            return { content: textContent, toolResults: [] };
        } catch (error) {
            logger.error("LLM generation failed", { model: this.name, prompt, error: String(error) });
            throw error;
        }
    }
}
