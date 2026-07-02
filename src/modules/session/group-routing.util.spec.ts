import { buildAgentRoutingContext } from './group-routing.util';

describe('buildAgentRoutingContext', () => {
  it('returns null for non-group messages', () => {
    expect(
      buildAgentRoutingContext({
        id: 'msg-1',
        from: 'peer@c.us',
        to: 'me@c.us',
        chatId: 'peer@c.us',
        body: 'hello @ops #triage',
        type: 'text',
        timestamp: 1,
        fromMe: false,
        isGroup: false,
      }),
    ).toBeNull();
  });

  it('extracts text mentions, tags, and a stable ownership key for group messages', () => {
    expect(
      buildAgentRoutingContext({
        id: 'msg-1',
        from: 'group@g.us',
        to: 'me@c.us',
        chatId: 'group@g.us',
        author: '628111@c.us',
        body: 'Triage @ops-lead and #billing for @ops-lead',
        type: 'text',
        timestamp: 1,
        fromMe: false,
        isGroup: true,
      }),
    ).toEqual(
      expect.objectContaining({
        chatId: 'group@g.us',
        messageId: 'msg-1',
        senderId: '628111@c.us',
        threadId: 'msg-1',
        ownershipKey: 'group@g.us:msg-1',
        isGroup: true,
        isReply: false,
        textMentions: ['ops-lead'],
        tags: ['billing'],
        targetedAgents: ['ops-lead', 'billing'],
        needsTriage: false,
      }),
    );
  });

  it('uses the quoted message id as the thread and keeps whatsapp mentions alongside text targets', () => {
    expect(
      buildAgentRoutingContext({
        id: 'msg-2',
        from: 'group@g.us',
        to: 'me@c.us',
        chatId: 'group@g.us',
        author: '628111@c.us',
        body: 'thanks @alice',
        type: 'text',
        timestamp: 1,
        fromMe: false,
        isGroup: true,
        quotedMessage: { id: 'root-1', body: 'previous' },
        mentionedIds: ['628222@c.us', '628222@c.us'],
      }),
    ).toEqual(
      expect.objectContaining({
        threadId: 'root-1',
        ownershipKey: 'group@g.us:root-1',
        isReply: true,
        textMentions: ['alice'],
        whatsappMentions: ['628222@c.us'],
        targetedAgents: ['alice', '628222@c.us'],
        needsTriage: false,
      }),
    );
  });

  it('marks group messages without explicit targets as triage candidates', () => {
    expect(
      buildAgentRoutingContext({
        id: 'msg-3',
        from: 'group@g.us',
        to: 'me@c.us',
        chatId: 'group@g.us',
        body: 'general note',
        type: 'text',
        timestamp: 1,
        fromMe: false,
        isGroup: true,
      }),
    ).toEqual(
      expect.objectContaining({
        targetedAgents: [],
        needsTriage: true,
      }),
    );
  });
});
