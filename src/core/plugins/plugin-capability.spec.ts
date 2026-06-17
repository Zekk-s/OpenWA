import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { PluginLoaderService } from './plugin-loader.service';
import { PluginStorageService } from './plugin-storage.service';
import { HookManager } from '../hooks';
import {
  PluginCapabilityError,
  PluginContext,
  PluginInstance,
  PluginManifest,
  PluginStatus,
  PluginType,
} from './plugin.interfaces';
import { MessageService } from '../../modules/message/message.service';

function makePlugin(sessions?: string[]): PluginInstance {
  const manifest: PluginManifest = {
    id: 'test-ext',
    name: 'Test Extension',
    version: '1.0.0',
    type: PluginType.EXTENSION,
    main: 'index.ts',
    sessions,
  };
  return { manifest, status: PluginStatus.INSTALLED, config: {}, instance: null };
}

describe('PluginLoaderService capability facade — ctx.messages', () => {
  let loader: PluginLoaderService;
  let messageService: { sendText: jest.Mock; reply: jest.Mock };
  let moduleRef: { get: jest.Mock };

  beforeEach(() => {
    messageService = {
      sendText: jest.fn().mockResolvedValue({ messageId: 'wamid', timestamp: 1 }),
      reply: jest.fn().mockResolvedValue({ messageId: 'wamid', timestamp: 1 }),
    };
    moduleRef = { get: jest.fn().mockReturnValue(messageService) };
    const configService = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const pluginStorage = {
      createPluginStorage: jest.fn().mockReturnValue({}),
    } as unknown as PluginStorageService;
    loader = new PluginLoaderService(
      configService,
      new HookManager(),
      pluginStorage,
      moduleRef as unknown as ModuleRef,
    );
  });

  function contextFor(plugin: PluginInstance): PluginContext {
    return (
      loader as unknown as { createPluginContext: (p: PluginInstance) => PluginContext }
    ).createPluginContext(plugin);
  }

  it('messages.sendText delegates to MessageService.sendText with a wrapped dto', async () => {
    const ctx = contextFor(makePlugin(['*']));
    await ctx.messages.sendText('sess-1', '628@c.us', 'hi');
    expect(moduleRef.get).toHaveBeenCalledWith(MessageService, { strict: false });
    expect(messageService.sendText).toHaveBeenCalledWith('sess-1', { chatId: '628@c.us', text: 'hi' });
  });

  it('messages.reply delegates to MessageService.reply', async () => {
    const ctx = contextFor(makePlugin(['*']));
    await ctx.messages.reply('sess-1', '628@c.us', 'quoted-id', 'pong');
    expect(messageService.reply).toHaveBeenCalledWith('sess-1', {
      chatId: '628@c.us',
      quotedMessageId: 'quoted-id',
      text: 'pong',
    });
  });

  it('rejects an out-of-scope session BEFORE resolving the service', async () => {
    const ctx = contextFor(makePlugin(['allowed-session']));
    await expect(ctx.messages.sendText('other-session', '628@c.us', 'hi')).rejects.toBeInstanceOf(
      PluginCapabilityError,
    );
    expect(moduleRef.get).not.toHaveBeenCalled();
    expect(messageService.sendText).not.toHaveBeenCalled();
  });
});
