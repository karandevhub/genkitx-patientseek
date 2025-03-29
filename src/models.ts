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

export const deepseekChat = modelRef({
  name: "deepseek/deepseek-chat",
  info: {
    label: "DeepSeek - Chat",
    supports: {
      media: false,
      output: ["text"],
      multiturn: true,
      systemRole: true,
      tools: false,
    },
  },
  configSchema: DeepSeekConfigSchema,
});

export const deepseekReasoner = modelRef({
  name: "deepseek/deepseek-reasoner",
  info: {
    label: "DeepSeek - Reasoner",
    supports: {
      media: false,
      output: ["text"],
      multiturn: true,
      systemRole: true,
      tools: false,
    },
  },
  configSchema: DeepSeekConfigSchema,
});

export const whyhowPatientSeek = modelRef({
  name: "deepseek/whyhow-ai/PatientSeek",
  info: {
    label: "Whyhow - PatientSeek",
    supports: {
      media: false,
      output: ["text"],
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
  "deepseek-chat": deepseekChat,
  "deepseek-reasoner": deepseekReasoner,
  "whyhow-ai/PatientSeek": whyhowPatientSeek,
};
