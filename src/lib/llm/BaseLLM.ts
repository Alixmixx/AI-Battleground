import logger from "@/lib/logger";
import { Tool, ToolResult } from "@/lib/tool/Tool";

export interface GenerateResponse {
    content: string;
    toolResults: ToolResult[];
}

export interface ILLM {
    name: string;
    apiKey: string;
    temperature: number;
    maxTokens: number;
    baseUrl: string;
    instructions: string;

    generate(prompt: string, tools?: Tool[]): Promise<GenerateResponse>;
    updateInstructions(newInstructions: string): void;
    addKey(apiKey: string): void;
    setTemperature(temp: number): void;
    setMaxTokens(tokens: number): void;
}

export abstract class BaseLLM implements ILLM {
    name: string;
    apiKey: string;
    temperature: number;
    maxTokens: number;
    baseUrl: string;
    instructions: string;

    constructor(
        name: string,
        apiKey: string = "",
        temperature: number = 0.7,
        maxTokens: number = 1000,
        baseUrl: string = "",
        instructions: string = ""
    ) {
        this.name = name;
        this.apiKey = apiKey;
        this.temperature = temperature;
        this.maxTokens = maxTokens;
        this.baseUrl = baseUrl;
        this.instructions = instructions;
    }

    updateInstructions(newInstructions: string): void {
        this.instructions = newInstructions;
    }

    addKey(apiKey: string): void {
        this.apiKey = apiKey;
    }

    setTemperature(temp: number): void {
        this.temperature = Math.max(0, Math.min(2, temp));
    }

    setMaxTokens(tokens: number): void {
        this.maxTokens = Math.max(1, tokens);
    }

    abstract generate(prompt: string, tools?: Tool[]): Promise<GenerateResponse>;

    protected async executeTools(toolCalls: { name: string; input: any }[], tools: Tool[]): Promise<ToolResult[]> {
        const results: ToolResult[] = [];
        for (const call of toolCalls) {
            const tool = tools.find(t => t.name === call.name);
            if (tool) {
                try {
                    logger.info("Executing tool", { toolName: call.name, input: call.input });
                    const output = await tool.execute(call.input);
                    results.push({ toolName: call.name, input: call.input, output });
                    logger.info("Tool execution result", { toolName: call.name, output });
                } catch (error) {
                    logger.error(`Error executing tool ${call.name}: ${error}`);
                    results.push({ toolName: call.name, input: call.input, output: `Error: ${error}` });
                }
            } else {
                logger.warn(`Tool not found: ${call.name}`);
                results.push({ toolName: call.name, input: call.input, output: `Error: Tool not found` });
            }
        }
        return results;
    }
}
