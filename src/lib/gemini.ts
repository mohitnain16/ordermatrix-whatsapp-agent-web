import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Content, FunctionResponsePart } from '@google/generative-ai';
import { toolDeclarations, callTool, type ToolName } from './tools/index';
import type { Tenant, ChatMessage } from './types';

function buildSystemPrompt(tenant: Tenant): string {
  const { businessInfo } = tenant;
  return [
    `You are a helpful WhatsApp customer support agent for ${businessInfo.name}.`,
    '',
    `About the business: ${businessInfo.description}`,
    `Category: ${businessInfo.category}`,
    businessInfo.supportEmail ? `Support email: ${businessInfo.supportEmail}` : '',
    '',
    'Guidelines:',
    '- Be concise and friendly. WhatsApp messages should feel conversational, not formal.',
    '- Respond in the same language the customer uses (Hindi or English).',
    '- Use the available tools when a customer asks about products, pricing, or payment issues.',
    '- Never invent prices or order details — use the tools.',
  ]
    .filter((l) => l !== null)
    .join('\n');
}

function toGeminiHistory(messages: ChatMessage[]): Content[] {
  return messages.map((m) => ({ role: m.role, parts: m.parts }));
}

export async function runGeminiLoop(
  tenant: Tenant,
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: buildSystemPrompt(tenant),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ functionDeclarations: toolDeclarations as any }],
  });

  const chat = model.startChat({ history: toGeminiHistory(history) });

  let result = await chat.sendMessage(userMessage);
  let response = result.response;

  // Tool-calling loop — keep going until Gemini stops requesting tools
  while (response.functionCalls()?.length) {
    const calls = response.functionCalls()!;

    const toolResults: FunctionResponsePart[] = await Promise.all(
      calls.map(async (call) => ({
        functionResponse: {
          name: call.name,
          response: {
            output: await callTool(call.name as ToolName, call.args as Record<string, unknown>),
          },
        },
      }))
    );

    result = await chat.sendMessage(toolResults);
    response = result.response;
  }

  return response.text();
}
