import { IncomingMessage } from '../../engine/interfaces/whatsapp-engine.interface';

export interface AgentRoutingContext {
  chatId: string;
  messageId: string;
  senderId: string;
  threadId: string;
  ownershipKey: string;
  isGroup: boolean;
  isReply: boolean;
  whatsappMentions: string[];
  textMentions: string[];
  tags: string[];
  targetedAgents: string[];
  needsTriage: boolean;
}

export interface IncomingMessageWithCollaboration extends IncomingMessage {
  collaboration?: AgentRoutingContext;
}

// Match Slack-like routing tokens in free-form text:
// - group 1: the boundary before the token (start-of-string or whitespace/punctuation)
// - group 2: the token type (`@` for agent handles, `#` for tags)
// - group 3: the token value (letter/digit first, then `.`, `_`, or `-`, up to 64 chars total)
// Uppercase is accepted here and normalized later.
const ROUTING_TOKEN_PATTERN = /(^|[\s([{<"'`.,;:!?])([@#])([a-zA-Z0-9][a-zA-Z0-9._-]{0,63})\b/gi;

function uniqueLowercased(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim().toLowerCase()).filter(Boolean))];
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}

function extractTextTargets(body: string): { mentions: string[]; tags: string[] } {
  const mentions: string[] = [];
  const tags: string[] = [];

  for (const match of body.matchAll(ROUTING_TOKEN_PATTERN)) {
    const tokenType = match[2];
    const tokenValue = match[3];
    if (tokenType === '@') {
      mentions.push(tokenValue);
    } else {
      tags.push(tokenValue);
    }
  }

  return {
    mentions: uniqueLowercased(mentions),
    tags: uniqueLowercased(tags),
  };
}

export function buildAgentRoutingContext(message: IncomingMessage): AgentRoutingContext | null {
  if (!message.isGroup) return null;

  const senderId = message.author ?? message.from;
  const threadId = message.quotedMessage?.id ?? message.id;
  const textTargets = extractTextTargets(message.body ?? '');
  const whatsappMentions = uniqueValues(message.mentionedIds ?? []);
  const targetedAgents = uniqueLowercased([...textTargets.mentions, ...textTargets.tags, ...whatsappMentions]);

  return {
    chatId: message.chatId,
    messageId: message.id,
    senderId,
    threadId,
    ownershipKey: `${message.chatId}:${threadId}`,
    isGroup: true,
    isReply: Boolean(message.quotedMessage?.id),
    whatsappMentions,
    textMentions: textTargets.mentions,
    tags: textTargets.tags,
    targetedAgents,
    needsTriage: targetedAgents.length === 0,
  };
}

export function attachAgentRoutingContext(message: IncomingMessageWithCollaboration): AgentRoutingContext | null {
  const collaboration = buildAgentRoutingContext(message);
  if (collaboration) {
    message.collaboration = collaboration;
  }
  return collaboration;
}
