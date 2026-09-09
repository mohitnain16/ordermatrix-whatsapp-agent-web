import type { ChatMessage } from './types';
import { isTestMode, getTestHistory, appendTestMessage } from './testStore';

export async function getHistory(phoneNumber: string): Promise<ChatMessage[]> {
  if (isTestMode()) {
    return getTestHistory(phoneNumber);
  }

  // TODO: query Conversation collection when MongoDB is wired up
  // const { ConversationModel } = await import('./models/Conversation');
  // const conv = await ConversationModel.findOne({ phoneNumber }).lean();
  // return (conv?.messages ?? []) as ChatMessage[];
  throw new Error('Production DB path not implemented — set TEST_MODE=true');
}

export async function appendMessage(phoneNumber: string, message: ChatMessage): Promise<void> {
  if (isTestMode()) {
    appendTestMessage(phoneNumber, message);
    return;
  }

  // TODO: upsert into Conversation collection when MongoDB is wired up
  // const { ConversationModel } = await import('./models/Conversation');
  // await ConversationModel.findOneAndUpdate(
  //   { phoneNumber },
  //   { $push: { messages: { $each: [message], $slice: -20 } } },
  //   { upsert: true }
  // );
  throw new Error('Production DB path not implemented — set TEST_MODE=true');
}
