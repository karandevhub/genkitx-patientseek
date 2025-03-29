import { Genkit } from "genkit";
import { genkitPlugin } from "genkit/plugin";
import { OpenAI } from 'openai';
import {
  deepseekChat,
  deepseekReasoner,
  whyhowPatientSeek,
  SUPPORTED_DEEPSEEK_MODELS
} from "./models";
import { deepseekRunner } from "./runner";

export interface PluginOptions {
  apiKey?: string;
  baseURL?: string;
}
export {
  deepseekChat,
  deepseekReasoner, 
  whyhowPatientSeek
};

export const deepseek = (options?: PluginOptions) =>
  genkitPlugin("deepseek", async (ai: Genkit) => {
    const apiKey = options?.apiKey || process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("Deepseek API key is required. Pass plugin options or set DEEPSEEK_API_KEY environment variable.");
    }

    const baseURL = options?.baseURL || process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com';


    console.log("Deepseek API URL:", baseURL);
    
    const client = new OpenAI({apiKey, baseURL});
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

export default deepseek;