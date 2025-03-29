import { Genkit } from "genkit";
import { genkitPlugin } from "genkit/plugin";
import { OpenAI } from "openai";
import { PatientSeekChat, SUPPORTED_DEEPSEEK_MODELS } from "./models";
import { deepseekRunner } from "./runner";
import * as dotenv from "dotenv";
dotenv.config();
export interface PluginOptions {
  apiKey?: string;
  baseURL?: string;
}
export { PatientSeekChat };

export const PatientSeek = (options?: PluginOptions) =>
  genkitPlugin("deepseek", async (ai: Genkit) => {
    const apiKey = options?.apiKey || process.env.PATIENT_SEEK_API_KEY;
    if (!apiKey) {
      throw new Error(
        "PatientSeek API key is required. Pass plugin options or set PATIENT_SEEK_API_KEY environment variable."
      );
    }

    const baseURL =
      options?.baseURL ||
      process.env.PATIENT_SEEK_API_URL ||
      "https://sjp8h5vzufpc6woi.us-east-1.aws.endpoints.huggingface.cloud/v1/";

    const client = new OpenAI({ apiKey, baseURL });
    for (const name of Object.keys(SUPPORTED_DEEPSEEK_MODELS)) {
      const model = SUPPORTED_DEEPSEEK_MODELS[name];
      ai.defineModel(
        {
          name: model.name,
          ...model.info,
          configSchema: model.configSchema,
        },
        deepseekRunner(name, client)
      );
    }
  });

export default PatientSeek;
