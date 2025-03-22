export interface Tool {
    name: string;
    description: string;
    execute: (input: any) => Promise<any>;
}

export interface ToolResult {
    toolName: string;
    input: any;
    output: any;
}

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
                    const output = await tool.execute(call.input);
                    results.push({ toolName: call.name, input: call.input, output });
                } catch (error) {
                    results.push({ toolName: call.name, input: call.input, output: `Error: ${error}` });
                }
            }
        }
        return results;
    }
}
