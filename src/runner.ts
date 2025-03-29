import { GenerateRequest, GenerateResponseData, Message, Part, StreamingCallback } from 'genkit';
import { GenerateResponseChunkData } from 'genkit/model';
import OpenAI from 'openai';
import { ChatCompletionCreateParamsNonStreaming, ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { z } from 'zod';
import { DeepSeekConfigSchema, SUPPORTED_DEEPSEEK_MODELS } from './models';
import { removeEmptyKeys } from './utils';


export const DeepSeekCandidateSchema = z.object({
  index: z.number(),
  finishReason: z.string(),
  message: z.object({
    role: z.literal('assistant'),
    text: z.string(),
  }),
  custom: z.any(),
});

export type DeepSeekCandidate = z.infer<typeof DeepSeekCandidateSchema>;

export function fromDeepSeekChunkChoice(choice: any): DeepSeekCandidate {
  return DeepSeekCandidateSchema.parse({
    index: choice.index,
    finishReason: choice.finish_reason || 'other',
    message: { role: 'assistant', text: choice.delta.content },
    custom: {},
  });
}

export function fromDeepSeekChoice(choice: any): DeepSeekCandidate {
  return DeepSeekCandidateSchema.parse({
    index: choice.index,
    finishReason: choice.finish_reason || 'other',
    message: { role: 'assistant', text: choice.message.content },
    custom: {},
  });
}

function toDeepSeekMessages(messages: any[]): ChatCompletionMessageParam[] {
  return messages.map((msg) => {
    const m = new Message(msg);
    // Assert explicit literal type for roles
    const role = toDeepSeekRole(msg.role) as "system" | "assistant" | "user" | "function";

    if (role === "function") {
      // For function messages, include a required name property.
      return { role, content: m.text, name: msg.name || "function" } as ChatCompletionMessageParam;
    }

    // For other messages, ensure no name property is present.
    return { role, content: m.text } as ChatCompletionMessageParam;
  });
}


function toDeepSeekRole(role: string): string {
  // Example: mapping roles. Adjust as necessary.
  if (role === "system") return "system";
  if (role === "assistant") return "assistant";
  if (role === "user") return "user";
  if (role === "function") return "function";
  return role;
}

function toDeepSeekTool(tool: any): any {
  return {
    type: 'function',
    function: {
      name: tool.name,
      parameters: tool.inputSchema !== null ? tool.inputSchema : undefined,
    },
  };
}

export function toDeepSeekRequestBody(
  modelName: string,
  request: GenerateRequest<typeof DeepSeekConfigSchema>
): ChatCompletionCreateParamsNonStreaming {
  const model = SUPPORTED_DEEPSEEK_MODELS[modelName];
  if (!model) throw new Error(`Unsupported model: ${modelName}`);

  const config = request.config;
  if (!config) {
    throw new Error('Missing configuration in request');
  }
  
 const body = {
    model: modelName,
    messages: toDeepSeekMessages(request.messages),
    temperature: config.temperature,
    max_tokens: config.maxOutputTokens,
    top_p: config.topP,
    stop: config.stopSequences,
    frequency_penalty: config.frequencyPenalty,
    presence_penalty: config.presencePenalty,
    logprobs: config.logProbs,
    top_logprobs: config.topLogProbs,
    tools: request.tools ? request.tools.map(toDeepSeekTool) : undefined,
    tool_choice: (config as any).tool_choice || "none",
    response_format: { type: "text" },
    stream: false, 
    stream_options: null,
  } as ChatCompletionCreateParamsNonStreaming;

  return removeEmptyKeys(body);
}

export function toDeepSeekTextContent(
  part: Part
): { type: 'text'; text: string } {
  if (part.text) {
    return {
      type: 'text',
      text: part.text,
    };
  }
  throw new Error(
    `DeepSeek only supports text parts; received: ${JSON.stringify(part)}.`
  );
}

export function deepseekRunner(name: string, client: OpenAI) {
  return async (
    request: GenerateRequest<typeof DeepSeekConfigSchema>,
    streamingCallback?: StreamingCallback<GenerateResponseChunkData>
  ): Promise<GenerateResponseData> => {
    let response: any;
    // Build the DeepSeek request body.
    const body = toDeepSeekRequestBody(name, request);

    if (streamingCallback) {
      // Enable streaming when a callback is provided.
      const stream = client.beta.chat.completions.stream({
        ...body,
        stream: true,
      });
      for await (const chunk of stream) {
        chunk.choices?.forEach((chunkChoice: any) => {
          const candidate = fromDeepSeekChunkChoice(chunkChoice);
          streamingCallback({
            index: candidate.index,
            content: [{ text: candidate.message.text }],
          });
        });
      }
      response = await stream.finalChatCompletion();
    } else {
      // Standard (non-streaming) request.
      response = await client.chat.completions.create(body);
    }

    // Map the DeepSeek response into Genkit's expected format.
    return {
      candidates: response.choices.map((c: any) => fromDeepSeekChoice(c)),
      usage: {
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
      },
      custom: response,
    };
  };
}