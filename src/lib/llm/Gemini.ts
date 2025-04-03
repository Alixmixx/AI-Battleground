import { GoogleGenerativeAI, SchemaType, FunctionDeclarationSchema } from "@google/generative-ai";
import { BaseLLM, GenerateResponse } from "./BaseLLM";
import { Tool, ToolResult } from "@/lib/tool";
import logger from "@/lib/logger";

export class Gemini extends BaseLLM {
    private client: GoogleGenerativeAI;
    private model: string = "gemini-1.5-pro-latest";

    constructor(apiKey: string = process.env.GOOGLE_API_KEY || "") {
        super("Gemini", apiKey, 0.7, 1000, "https://generativelanguage.googleapis.com", "You are a strategic AI for games.");
        this.client = new GoogleGenerativeAI(this.apiKey);
    }

    async generate(prompt: string, tools: Tool[] = []): Promise<GenerateResponse> {
        logger.info("Generating LLM response", { model: this.name, prompt });
        let executedToolResults: ToolResult[] = []; // Initialize empty

        try {
            const functionDeclarations = tools.map(t => {
                const schema = t.getSchema();

                const parameters = JSON.parse(JSON.stringify(schema.function.parameters));

                // Remove additionalProperties field which Gemini doesn't support :(
                if (parameters.hasOwnProperty("additionalProperties")) {
                    delete parameters.additionalProperties;
                }

                return {
                    name: schema.function.name,
                    description: schema.function.description,
                    parameters: parameters,
                };
            });

            const generativeModel = this.client.getGenerativeModel({
                model: this.model,
                generationConfig: {
                    temperature: this.temperature,
                    maxOutputTokens: this.maxTokens,
                },
                tools: functionDeclarations.length ? [{ functionDeclarations }] : undefined,
                systemInstruction: this.instructions,
            });

            const chat = generativeModel.startChat({ history: [] });
            logger.info("Sending message to Gemini", { prompt });

            // Make the API call
            const result = await chat.sendMessage(prompt);
            const response = result.response; // Get the response from the single call

            const textContent = response.text();
            logger.info("Initial LLM response text received", { content: textContent });

            const functionCalls = response.functionCalls();
            if (functionCalls && functionCalls.length > 0) {
                logger.info("LLM responded with function call requests", { functionCalls });

                const toolCallsToExecute = functionCalls.map(call => ({
                    name: call.name,
                    input: call.args,
                }));

                executedToolResults = await this.executeTools(toolCallsToExecute, tools);
                logger.info("Executed tools", { executedToolResults });
            }

            return { content: textContent, toolResults: executedToolResults };
        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error.response?.data || error.stack || "";
            logger.error("LLM generation failed", {
                model: this.name,
                prompt,
                error: errorMessage,
                details: errorDetails,
            });
            throw new Error(`Gemini generation failed: ${errorMessage}`);
        }
    }
}
