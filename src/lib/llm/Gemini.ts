import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { BaseLLM, GenerateResponse } from "./BaseLLM";
import { Tool } from "@/lib/tool";
import logger from "@/lib/logger";

export class Gemini extends BaseLLM {
    private client: GoogleGenerativeAI;
    private model: string = "gemini-2.0-pro";

    constructor(apiKey: string = process.env.GOOGLE_API_KEY || "") {
        super("Gemini", apiKey, 0.7, 1000, "https://generativelanguage.googleapis.com", "You are a strategic AI for games.");
        this.client = new GoogleGenerativeAI(this.apiKey);
    }

    async generate(prompt: string, tools: Tool[] = []): Promise<GenerateResponse> {
        logger.info("Generating LLM response", { model: this.name, prompt });

        try {
            const generativeModel = this.client.getGenerativeModel({
                model: this.model,
                generationConfig: {
                    temperature: this.temperature,
                    maxOutputTokens: this.maxTokens,
                },
                safetySettings: [
                    {
                        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    },
                ],
            });

            // Convert tool schemas to Google AI format
            const toolSchemas = tools.map(t => {
                const schema = t.getSchema();
                return {
                    functionDeclarations: [
                        {
                            name: schema.name,
                            description: schema.description,
                            parameters: schema.parameters,
                        },
                    ],
                };
            });

            // Create chat session
            const chat = generativeModel.startChat({
                tools: toolSchemas.length ? toolSchemas : undefined,
                systemInstruction: this.instructions,
            });

            // Send message and get response
            const response = await chat.sendMessage(prompt);
            
            const textContent = response.text();
            logger.info("LLM response received", { content: textContent, functionCalls: response.functionCalls() });

            // Handle tool calls
            if (response.functionCalls().length > 0) {
                const toolCalls = response.functionCalls().map(call => ({
                    name: call.name,
                    input: call.args,
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