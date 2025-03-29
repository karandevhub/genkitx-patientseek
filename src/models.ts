import { GenerationCommonConfigSchema, ModelReference } from "genkit";
import { modelRef } from "genkit/model";
import { z } from "zod";

export const DeepSeekConfigSchema = GenerationCommonConfigSchema.extend({
  frequencyPenalty: z.number().min(-2).max(2).optional(),
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
      tools: true,
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
