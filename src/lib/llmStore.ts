export const LLM_REGISTRY = [
  {
    name: "GPT-3.5" as const,
  },
  {
    name: "GPT-4o" as const,
  },
  {
    name: "Claude" as const,
  },
  // {
  //   name: "Grok" as const,
  // },
  // {
  //   name: "Gemini" as const,
  // },
] as const;

// Derive LLMType from the registry
export type LLMType = (typeof LLM_REGISTRY)[number]["name"];

// Interface for registry entries
export interface LLMRegistryEntry {
  name: LLMType;
}

// Optional utility to get all LLM names
export const getAvailableLLMs = (): LLMType[] =>
  LLM_REGISTRY.map((entry) => entry.name);
