// lib/llmStore.ts
import { GPT35, GPT4o, BaseLLM } from "@/lib/llm";

// Define the LLM registry with const assertion for type inference
export const LLM_REGISTRY = [
    {
        name: "GPT-3.5" as const,
        create: (apiKey = "your-api-key-here") => new GPT35(apiKey),
    },
    {
        name: "GPT-4o" as const,
        create: (apiKey = "your-api-key-here") => new GPT4o(apiKey),
    },
] as const;

// Derive LLMType from the registry
export type LLMType = (typeof LLM_REGISTRY)[number]["name"];

// Interface for registry entries
export interface LLMRegistryEntry {
    name: LLMType;
    create: (apiKey?: string) => BaseLLM;
}

// Optional utility to get all LLM names
export const getAvailableLLMs = (): LLMType[] => LLM_REGISTRY.map(entry => entry.name);
