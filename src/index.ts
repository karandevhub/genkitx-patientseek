import type { GenerateRequest, Genkit } from "genkit";
import { genkitPlugin } from "genkit/plugin";
import { OpenAI, ClientOptions } from "openai";
import { ModelAction, ModelInfo } from "genkit/model";
import { modelRef } from "genkit/model";
import { gptRunner } from "./runner";
import {
  DeepSeekConfigSchema,
  ModelDefinition,
  SUPPORTED_DEEPSEEK_MODELS,
} from "./models";
import { PatientSeekChat } from "./models";

export { PatientSeekChat };
export interface DeepSeekPluginOptions extends Partial<ClientOptions> {
  apiKey?: string;
  baseURL?: string;
  models?: ModelDefinition[];
}

export const PatientSeek = (options: DeepSeekPluginOptions) =>
  genkitPlugin("deepseek", async (ai: Genkit) => {
    const baseURL =
      options?.baseURL ||
      process.env.PATIENT_SEEK_API_URL ||
      "https://sjp8h5vzufpc6woi.us-east-1.aws.endpoints.huggingface.cloud/v1/";

    const { apiKey } = options;
    const client = new OpenAI({ apiKey, baseURL });

    for (const name of Object.keys(SUPPORTED_DEEPSEEK_MODELS)) {
      deepseekModel(ai, name, client);
    }

    options.models?.forEach((model) => {
      if (!model.name || !model.info) {
        throw new Error(`Model ${model.name} is missing required fields`);
      }
      deepseekModel(ai, model.name, client, model.info, model.configSchema);
    });
  });

export function deepseekModel(
  ai: Genkit,
  name: string,
  client: OpenAI,
  modelInfo?: ModelInfo,
  modelConfig?: any
): ModelAction<typeof DeepSeekConfigSchema> {
  const modelId = `deepseek/${name}`;
  const model = SUPPORTED_DEEPSEEK_MODELS[name];
  if (!model) {
    SUPPORTED_DEEPSEEK_MODELS[name] = modelRef({
      name: modelId,
      info: modelInfo,
      configSchema: modelConfig?.configSchema,
    });
  }

  const modelInformation = modelInfo ? modelInfo : model.info;
  const configSchema = modelConfig
    ? modelConfig.configSchema
    : model.configSchema;

  return ai.defineModel(
    {
      name: modelId,
      ...modelInformation,
      configSchema,
    },
    gptRunner(name, client)
  );
}

export default PatientSeek;
