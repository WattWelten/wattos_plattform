import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChannelRouterService } from '../channel-router.service';
import { EventBusService } from '../../events/bus.service';
import { IChannel, ChannelSessionConfig, ChannelMessage } from '../interfaces/channel.interface';

// Gültige Test-UUIDs
const TEST_SESSION_ID = '00000000-0000-4000-8000-000000000001';
const TEST_TENANT_ID = '00000000-0000-4000-8000-000000000002';
const TEST_USER_ID = '00000000-0000-4000-8000-000000000003';
const TEST_CHANNEL_ID = '00000000-0000-4000-8000-000000000004';
const TEST_TENANT_1 = '00000000-0000-4000-8000-000000000005';
const TEST_TENANT_2 = '00000000-0000-4000-8000-000000000006';
const TEST_USER_1 = '00000000-0000-4000-8000-000000000007';
const TEST_USER_2 = '00000000-0000-4000-8000-000000000008';

describe('ChannelRouterService', () => {
  let channelRouter: ChannelRouterService;
  let mockEventBus: EventBusService;
  let mockChannel: IChannel;

  beforeEach(() => {
    // EventBus mocken - korrektes Mocking mit echten Funktionen
    mockEventBus = {
      emit: vi.fn().mockResolvedValue(undefined),
    } as unknown as EventBusService;

    channelRouter = new ChannelRouterService(mockEventBus);

    mockChannel = {
      name: 'test-channel',
      type: 'web' as any,
      createSession: vi.fn().mockResolvedValue({
        id: TEST_SESSION_ID,
        channel: 'test-channel',
        channelId: TEST_CHANNEL_ID,
        tenantId: TEST_TENANT_ID,
        userId: TEST_USER_ID,
        status: 'active',
        metadata: {},
      }),
      sendMessage: vi.fn().mockResolvedValue({
        success: true,
        messageId: 'msg-id',
      }),
      receiveMessage: vi.fn().mockResolvedValue(undefined),
      closeSession: vi.fn().mockResolvedValue(undefined),
      healthCheck: vi.fn().mockResolvedValue(true),
    };
  });

  describe('registerChannel', () => {
    it('should register a channel', () => {
      channelRouter.registerChannel(mockChannel);

      const channel = channelRouter.getChannel('test-channel');
      expect(channel).toBe(mockChannel);
    });

    it('should overwrite existing channel', () => {
      const channel1 = { ...mockChannel };
      const channel2 = { ...mockChannel, name: 'test-channel' };

      channelRouter.registerChannel(channel1);
      channelRouter.registerChannel(channel2);

      expect(channelRouter.listChannels()).toHaveLength(1);
    });
  });

  describe('getChannel', () => {
    beforeEach(() => {
      channelRouter.registerChannel(mockChannel);
    });

    it('should return registered channel', () => {
      const channel = channelRouter.getChannel('test-channel');
      expect(channel).toBe(mockChannel);
    });

    it('should throw NotFoundException for non-existent channel', () => {
      expect(() => {
        channelRouter.getChannel('non-existent');
      }).toThrow();
    });
  });

  describe('listChannels', () => {
    it('should return empty array when no channels registered', () => {
      expect(channelRouter.listChannels()).toHaveLength(0);
    });

    it('should return all registered channels', () => {
      const channel1 = { ...mockChannel, name: 'channel-1' };
      const channel2 = { ...mockChannel, name: 'channel-2' };

      channelRouter.registerChannel(channel1);
      channelRouter.registerChannel(channel2);

      const channels = channelRouter.listChannels();
      expect(channels).toHaveLength(2);
    });
  });

  describe('createSession', () => {
    beforeEach(() => {
      channelRouter.registerChannel(mockChannel);
    });

    it('should create a session', async () => {
      const config: ChannelSessionConfig = {
        tenantId: TEST_TENANT_ID,
        userId: TEST_USER_ID,
        channelId: TEST_CHANNEL_ID,
      };

      const session = await channelRouter.createSession('test-channel', config);

      expect(session).toBeDefined();
      expect(session.id).toBe(TEST_SESSION_ID);
      expect(mockChannel.createSession).toHaveBeenCalledWith(config);
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should throw error for non-existent channel', async () => {
      const config: ChannelSessionConfig = {
        tenantId: TEST_TENANT_ID,
        userId: TEST_USER_ID,
        channelId: TEST_CHANNEL_ID,
      };

      await expect(channelRouter.createSession('non-existent', config)).rejects.toThrow();
    });
  });

  describe('sendMessage', () => {
    beforeEach(async () => {
      channelRouter.registerChannel(mockChannel);
      const config: ChannelSessionConfig = {
        tenantId: TEST_TENANT_ID,
        userId: TEST_USER_ID,
        channelId: TEST_CHANNEL_ID,
      };
      await channelRouter.createSession('test-channel', config);
    });

    it('should send message', async () => {
      const message: ChannelMessage = {
        text: 'Hello',
        timestamp: Date.now(),
      };

      const response = await channelRouter.sendMessage('test-channel', TEST_SESSION_ID, message);

      expect(response.success).toBe(true);
      expect(mockChannel.sendMessage).toHaveBeenCalledWith(TEST_SESSION_ID, message);
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should throw error for non-existent session', async () => {
      const message: ChannelMessage = {
        text: 'Hello',
        timestamp: Date.now(),
      };

      await expect(
        channelRouter.sendMessage('test-channel', 'non-existent', message),
      ).rejects.toThrow();
    });
  });

  describe('receiveMessage', () => {
    beforeEach(() => {
      channelRouter.registerChannel(mockChannel);
    });

    it('should receive message', async () => {
      const message: ChannelMessage = {
        text: 'Hello',
        timestamp: Date.now(),
      };

      await channelRouter.receiveMessage('test-channel', TEST_SESSION_ID, message);

      expect(mockChannel.receiveMessage).toHaveBeenCalledWith(TEST_SESSION_ID, message);
      expect(mockEventBus.emit).toHaveBeenCalled();
    });
  });

  describe('closeSession', () => {
    beforeEach(async () => {
      channelRouter.registerChannel(mockChannel);
      const config: ChannelSessionConfig = {
        tenantId: TEST_TENANT_ID,
        userId: TEST_USER_ID,
        channelId: TEST_CHANNEL_ID,
      };
      await channelRouter.createSession('test-channel', config);
    });

    it('should close session', async () => {
      await channelRouter.closeSession('test-channel', TEST_SESSION_ID);

      expect(mockChannel.closeSession).toHaveBeenCalledWith(TEST_SESSION_ID);
      expect(mockEventBus.emit).toHaveBeenCalled();
      expect(channelRouter.getSession(TEST_SESSION_ID)).toBeUndefined();
    });

    it('should throw error for non-existent session', async () => {
      await expect(channelRouter.closeSession('test-channel', 'non-existent')).rejects.toThrow();
    });
  });

  describe('getSession', () => {
    beforeEach(async () => {
      channelRouter.registerChannel(mockChannel);
      const config: ChannelSessionConfig = {
        tenantId: TEST_TENANT_ID,
        userId: TEST_USER_ID,
        channelId: TEST_CHANNEL_ID,
      };
      await channelRouter.createSession('test-channel', config);
    });

    it('should return session', () => {
      const session = channelRouter.getSession(TEST_SESSION_ID);
      expect(session).toBeDefined();
      expect(session?.id).toBe(TEST_SESSION_ID);
    });

    it('should return undefined for non-existent session', () => {
      const session = channelRouter.getSession('non-existent');
      expect(session).toBeUndefined();
    });
  });

  describe('getSessionsByTenant', () => {
    beforeEach(async () => {
      channelRouter.registerChannel(mockChannel);
      await channelRouter.createSession('test-channel', {
        tenantId: TEST_TENANT_1,
        userId: TEST_USER_1,
        channelId: TEST_CHANNEL_ID,
      });
      await channelRouter.createSession('test-channel', {
        tenantId: TEST_TENANT_2,
        userId: TEST_USER_2,
        channelId: TEST_CHANNEL_ID,
      });
    });

    it('should filter sessions by tenant', () => {
      const sessions = channelRouter.getSessionsByTenant(TEST_TENANT_1);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].tenantId).toBe(TEST_TENANT_1);
    });
  });

  describe('switchChannel', () => {
    beforeEach(async () => {
      channelRouter.registerChannel(mockChannel);
      const otherChannel = {
        ...mockChannel,
        name: 'other-channel',
        createSession: vi.fn().mockImplementation((config: ChannelSessionConfig) => {
          return Promise.resolve({
            id: TEST_SESSION_ID,
            channel: 'other-channel',
            channelId: config.channelId,
            tenantId: config.tenantId,
            userId: config.userId,
            status: 'active',
            metadata: config.metadata || {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }),
      };
      channelRouter.registerChannel(otherChannel);

      await channelRouter.createSession('test-channel', {
        tenantId: TEST_TENANT_ID,
        userId: TEST_USER_ID,
        channelId: TEST_CHANNEL_ID,
      });
    });

    it('should switch channel', async () => {
      const newSession = await channelRouter.switchChannel(TEST_SESSION_ID, 'test-channel', 'other-channel');

      expect(newSession).toBeDefined();
      expect(newSession.channel).toBe('other-channel');
      expect(channelRouter.getSession(TEST_SESSION_ID)).toBeUndefined();
    });
  });

  describe('healthCheck', () => {
    beforeEach(() => {
      channelRouter.registerChannel(mockChannel);
    });

    it('should check health of all channels', async () => {
      const health = await channelRouter.healthCheck();

      expect(health['test-channel']).toBe(true);
      expect(mockChannel.healthCheck).toHaveBeenCalled();
    });
  });
});



