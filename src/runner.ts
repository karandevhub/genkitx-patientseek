import type { CandidateData } from "genkit/model";
import type {
  StreamingCallback,
  GenerateRequest,
  GenerateResponseData,
  MessageData,
  Part,
  Role,
  ToolRequestPart,
} from "genkit";
import { Message } from "genkit";
import type { GenerateResponseChunkData, ToolDefinition } from "genkit/model";
import type OpenAI from "openai";
import {
  type ChatCompletion,
  type ChatCompletionChunk,
  type ChatCompletionCreateParamsNonStreaming,
  type ChatCompletionMessageParam,
  type ChatCompletionMessageToolCall,
  type ChatCompletionRole,
  type ChatCompletionTool,
  type CompletionChoice,
} from "openai/resources/index.mjs";
import {
  DeepSeekConfigSchema,
  MODELS_SUPPORTING_OPENAI_RESPONSE_FORMAT,
  SUPPORTED_DEEPSEEK_MODELS,
} from "./models.js";
import { removeEmptyKeys } from "./utils.js";

export function toOpenAIRole(role: Role): ChatCompletionRole {
  switch (role) {
    case "user":
      return "user";
    case "model":
      return "assistant";
    case "system":
      return "system";
    case "tool":
      return "tool";
    default:
      throw new Error(`role ${role} doesn't map to an OpenAI role.`);
  }
}

function toOpenAiTool(tool: ToolDefinition): ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: tool.name,
      parameters: tool.inputSchema !== null ? tool.inputSchema : undefined,
    },
  };
}

export function toOpenAiMessages(
  messages: MessageData[]
): ChatCompletionMessageParam[] {
  const openAiMsgs: ChatCompletionMessageParam[] = [];
  for (const message of messages) {
    const msg = new Message(message);
    const role = toOpenAIRole(message.role);
    switch (role) {
      case "user":
        openAiMsgs.push({
          role: role,
          content: msg.text,
        });
        break;
      case "system":
        openAiMsgs.push({
          role: role,
          content: msg.text,
        });
        break;
      case "assistant": {
        const toolCalls: ChatCompletionMessageToolCall[] = msg.content
          .filter(
            (
              part
            ): part is Part & {
              toolRequest: NonNullable<Part["toolRequest"]>;
            } => Boolean(part.toolRequest)
          )
          .map((part) => ({
            id: part.toolRequest.ref ?? "",
            type: "function",
            function: {
              name: part.toolRequest.name,
              arguments: JSON.stringify(part.toolRequest.input),
            },
          }));
        if (toolCalls.length > 0) {
          openAiMsgs.push({
            role: role,
            tool_calls: toolCalls,
          });
        } else {
          openAiMsgs.push({
            role: role,
            content: msg.text,
          });
        }
        break;
      }
      case "tool": {
        const toolResponseParts = msg.toolResponseParts();
        toolResponseParts.map((part) => {
          openAiMsgs.push({
            role: role,
            tool_call_id: part.toolResponse.ref ?? "",
            content:
              typeof part.toolResponse.output === "string"
                ? part.toolResponse.output
                : JSON.stringify(part.toolResponse.output),
          });
        });
        break;
      }
    }
  }
  return openAiMsgs;
}

const finishReasonMap: Record<
  CompletionChoice["finish_reason"] | "tool_calls" | "function_call",
  CandidateData["finishReason"]
> = {
  length: "length",
  stop: "stop",
  tool_calls: "stop",
  content_filter: "blocked",
  function_call: "other",
};

export function fromOpenAiToolCall(
  toolCall:
    | ChatCompletionMessageToolCall
    | ChatCompletionChunk.Choice.Delta.ToolCall,
  choice: ChatCompletion.Choice | ChatCompletionChunk.Choice
): ToolRequestPart {
  if (!toolCall.function) {
    throw Error(
      `Unexpected openAI chunk choice. tool_calls was provided but one or more tool_calls is missing.`
    );
  }
  const f = toolCall.function;

  if (choice.finish_reason === "tool_calls") {
    return {
      toolRequest: {
        name: f.name!,
        ref: toolCall.id,
        input: f.arguments ? JSON.parse(f.arguments) : f.arguments,
      },
    };
  } else {
    return {
      toolRequest: {
        name: f.name!,
        ref: toolCall.id,
        input: "",
      },
    };
  }
}

export function fromOpenAiChoice(
  choice: ChatCompletion.Choice,
  jsonMode = false
): CandidateData {
  const toolRequestParts = choice.message.tool_calls?.map((toolCall) =>
    fromOpenAiToolCall(toolCall, choice)
  );
  return {
    index: choice.index,
    finishReason:
      finishReasonMap[choice.finish_reason as keyof typeof finishReasonMap] ||
      "other",
    message: {
      role: "model",
      content: toolRequestParts
        ? (toolRequestParts as ToolRequestPart[])
        : [
            jsonMode
              ? { data: JSON.parse(choice.message.content!) }
              : { text: choice.message.content! },
          ],
    },
    custom: {},
  };
}

export function fromOpenAiChunkChoice(
  choice: ChatCompletionChunk.Choice,
  jsonMode = false
): CandidateData {
  const toolRequestParts = choice.delta.tool_calls?.map((toolCall) =>
    fromOpenAiToolCall(toolCall, choice)
  );
  return {
    index: choice.index,
    finishReason: choice.finish_reason
      ? finishReasonMap[choice.finish_reason] || "other"
      : "unknown",
    message: {
      role: "model",
      content: toolRequestParts
        ? (toolRequestParts as ToolRequestPart[])
        : [
            jsonMode
              ? { data: JSON.parse(choice.delta.content!) }
              : { text: choice.delta.content! },
          ],
    },
    custom: {},
  };
}

export function toOpenAiRequestBody(
  modelName: string,
  request: GenerateRequest<typeof DeepSeekConfigSchema>
) {
  const model = SUPPORTED_DEEPSEEK_MODELS[modelName];
  if (!model) throw new Error(`Unsupported model: ${modelName}`);
  const openAiMessages = toOpenAiMessages(request.messages);
  const mappedModelName = request.config?.version || model.version || modelName;
  const body = {
    model: mappedModelName,
    messages: openAiMessages,
    temperature: request.config?.temperature,
    max_tokens: request.config?.maxOutputTokens,
    top_p: request.config?.topP,
    stop: request.config?.stopSequences,
    frequency_penalty: request.config?.frequencyPenalty,
    logprobs: request.config?.logProbs,
    presence_penalty: request.config?.presencePenalty,
    seed: request.config?.seed,
    top_logprobs: request.config?.topLogProbs,
    user: request.config?.user,
    tools: request.tools?.map(toOpenAiTool),
    n: request.candidates,
  } as ChatCompletionCreateParamsNonStreaming;

  const response_format = request.output?.format;
  if (
    response_format &&
    MODELS_SUPPORTING_OPENAI_RESPONSE_FORMAT.includes(mappedModelName)
  ) {
    if (
      response_format === "json" &&
      model.info?.supports?.output?.includes("json")
    ) {
      body.response_format = {
        type: "json_schema",
        json_schema: {name:"default", strict: true, description: "default", schema: {type: "object", properties: {
          text: {type: "string"}
        }}},
      };
    } else if (
      response_format === "text" &&
      model.info?.supports?.output?.includes("text")
    ) {
      body.response_format = {
        type: "text",
      };
    } else {
      throw new Error(
        `${response_format} format is not supported for GPT models currently`
      );
    }
  }

  removeEmptyKeys(body);
  return body;
}

export function gptRunner(name: string, client: OpenAI) {
  return async (
    request: GenerateRequest<typeof DeepSeekConfigSchema>,
    streamingCallback?: StreamingCallback<GenerateResponseChunkData>
  ): Promise<GenerateResponseData> => {
    let response: ChatCompletion;
    const body = toOpenAiRequestBody(name, request);
    if (streamingCallback) {
      const streamResponse = await client.chat.completions.create({
        ...body,
        stream: true,
      });

      let accumulatedContent = "";
      let accumulatedReasoningContent = "";
      let currentIndex = 0;

      try {
        for await (const chunk of streamResponse) {
          if (chunk.choices && chunk.choices.length > 0) {
            const choice = chunk.choices[0];
            currentIndex = choice.index || 0;
            if (choice.delta) {
              const deltaAny = choice.delta as any;
              if (deltaAny.reasoning_content) {
                accumulatedReasoningContent += deltaAny.reasoning_content;
                streamingCallback?.({
                  index: currentIndex,
                  content: [{ text: deltaAny.reasoning_content }],
                  custom: { isReasoning: true }
                });
              }
              if (choice.delta.content) {
                accumulatedContent += choice.delta.content;
                
                streamingCallback?.({
                  index: currentIndex,
                  content: [{ text: choice.delta.content }],
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error processing stream chunk:", error);
      }
      response = {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: body.model,
        choices: [
          {
            index: currentIndex,
            message: {
              role: "assistant",
              content: accumulatedContent,
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      } as ChatCompletion;
      if (accumulatedReasoningContent) {
        (response as any).reasoning_content = accumulatedReasoningContent;
      }
    } else {
      response = await client.chat.completions.create(body);
    }
    
    return {
      candidates: response.choices.map((c) =>
        fromOpenAiChoice(c, request.output?.format === "json")
      ),
      usage: {
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
      },
      custom: {
        ...response,
        reasoning_content: (response as any).reasoning_content
      },
    };
  };
}