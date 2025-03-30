import { GenerationCommonConfigSchema, ModelReference } from "genkit";
import { ModelInfo, modelRef } from "genkit/model";
import { z } from "zod";

export const MODELS_SUPPORTING_OPENAI_RESPONSE_FORMAT = [
  "whyhow-ai/PatientSeek",
];

export interface ModelDefinition {
  name: string;
  info: ModelInfo;
  configSchema?: any;
}

export const DeepSeekConfigSchema = GenerationCommonConfigSchema.extend({
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  logitBias: z.record(z.string(), z.number().min(-100).max(100)).optional(),
  logProbs: z.boolean().optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  seed: z.number().int().optional(),
  topLogProbs: z.number().int().min(0).max(20).optional(),
  user: z.string().optional(),
});

export const PatientSeekChat = modelRef({
  name: "deepseek/whyhow-ai/PatientSeek",
  info: {
    label: "Whyhow - PatientSeek",
    supports: {
      media: false,
      output: ["text", "json"],
      multiturn: true,
      systemRole: true,
      tools: false,
    },
  },
  configSchema: DeepSeekConfigSchema,
});

export const SUPPORTED_DEEPSEEK_MODELS: Record<
  string,
  ModelReference<typeof DeepSeekConfigSchema>
> = {
  "whyhow-ai/PatientSeek": PatientSeekChat,
};
