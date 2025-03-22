// lib/tool/Tool.ts
export interface ITool {
    name: string;
    description: string;
    execute: (input: any) => Promise<any>;
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
    execute: (input: any) => Promise<any>;

    constructor(name: string, description: string = "", execute: (input: any) => Promise<any>) {
        this.name = name;
        this.description = description;
        this.execute = execute;
    }

    // Abstract method to be implemented by subclasses
    abstract getSchema(): any;
}
