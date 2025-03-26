// lib/tool/Tool.ts
export interface ITool {
    name: string;
    description: string;
    getSchema: () => any; // Returns OpenAI-compatible tool schema
}

export interface ToolResult {
    toolName: string;
    input: any;
    output: any;
}

export abstract class Tool implements ITool {
    name: string;
    description: string;

    constructor(name: string, description: string = "") {
        this.name = name;
        this.description = description;
    }

    // Abstract method to be implemented by subclasses
    abstract getSchema(): any;
    abstract execute(input: any): Promise<any>;
}
