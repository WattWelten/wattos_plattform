import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChannelRouterService } from '../channel-router.service';
import { EventBusService } from '../../events/bus.service';
import { IChannel, ChannelSessionConfig, ChannelMessage } from '../interfaces/channel.interface';
import { createMockEventBus } from '../../__tests__/helpers/mocks';

describe('ChannelRouterService', () => {
  let channelRouter: ChannelRouterService;
  let mockEventBus: EventBusService;
  let mockChannel: IChannel;

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    channelRouter = new ChannelRouterService(mockEventBus);

    mockChannel = {
      name: 'test-channel',
      type: 'web' as any,
      createSession: vi.fn().mockResolvedValue({
        id: 'session-id',
        channel: 'test-channel',
        channelId: 'channel-id',
        tenantId: 'tenant-id',
        userId: 'user-id',
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
        tenantId: 'tenant-id',
        userId: 'user-id',
        channelId: 'channel-id',
      };

      const session = await channelRouter.createSession('test-channel', config);

      expect(session).toBeDefined();
      expect(session.id).toBe('session-id');
      expect(mockChannel.createSession).toHaveBeenCalledWith(config);
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should throw error for non-existent channel', async () => {
      const config: ChannelSessionConfig = {
        tenantId: 'tenant-id',
        userId: 'user-id',
        channelId: 'channel-id',
      };

      await expect(channelRouter.createSession('non-existent', config)).rejects.toThrow();
    });
  });

  describe('sendMessage', () => {
    beforeEach(async () => {
      channelRouter.registerChannel(mockChannel);
      const config: ChannelSessionConfig = {
        tenantId: 'tenant-id',
        userId: 'user-id',
        channelId: 'channel-id',
      };
      await channelRouter.createSession('test-channel', config);
    });

    it('should send message', async () => {
      const message: ChannelMessage = {
        text: 'Hello',
        timestamp: Date.now(),
      };

      const response = await channelRouter.sendMessage('test-channel', 'session-id', message);

      expect(response.success).toBe(true);
      expect(mockChannel.sendMessage).toHaveBeenCalledWith('session-id', message);
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

      await channelRouter.receiveMessage('test-channel', 'session-id', message);

      expect(mockChannel.receiveMessage).toHaveBeenCalledWith('session-id', message);
      expect(mockEventBus.emit).toHaveBeenCalled();
    });
  });

  describe('closeSession', () => {
    beforeEach(async () => {
      channelRouter.registerChannel(mockChannel);
      const config: ChannelSessionConfig = {
        tenantId: 'tenant-id',
        userId: 'user-id',
        channelId: 'channel-id',
      };
      await channelRouter.createSession('test-channel', config);
    });

    it('should close session', async () => {
      await channelRouter.closeSession('test-channel', 'session-id');

      expect(mockChannel.closeSession).toHaveBeenCalledWith('session-id');
      expect(mockEventBus.emit).toHaveBeenCalled();
      expect(channelRouter.getSession('session-id')).toBeUndefined();
    });

    it('should throw error for non-existent session', async () => {
      await expect(channelRouter.closeSession('test-channel', 'non-existent')).rejects.toThrow();
    });
  });

  describe('getSession', () => {
    beforeEach(async () => {
      channelRouter.registerChannel(mockChannel);
      const config: ChannelSessionConfig = {
        tenantId: 'tenant-id',
        userId: 'user-id',
        channelId: 'channel-id',
      };
      await channelRouter.createSession('test-channel', config);
    });

    it('should return session', () => {
      const session = channelRouter.getSession('session-id');
      expect(session).toBeDefined();
      expect(session?.id).toBe('session-id');
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
        tenantId: 'tenant-1',
        userId: 'user-1',
        channelId: 'channel-1',
      });
      await channelRouter.createSession('test-channel', {
        tenantId: 'tenant-2',
        userId: 'user-2',
        channelId: 'channel-2',
      });
    });

    it('should filter sessions by tenant', () => {
      const sessions = channelRouter.getSessionsByTenant('tenant-1');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].tenantId).toBe('tenant-1');
    });
  });

  describe('switchChannel', () => {
    beforeEach(async () => {
      channelRouter.registerChannel(mockChannel);
      const otherChannel = { ...mockChannel, name: 'other-channel' };
      channelRouter.registerChannel(otherChannel);

      await channelRouter.createSession('test-channel', {
        tenantId: 'tenant-id',
        userId: 'user-id',
        channelId: 'channel-id',
      });
    });

    it('should switch channel', async () => {
      const newSession = await channelRouter.switchChannel('session-id', 'test-channel', 'other-channel');

      expect(newSession).toBeDefined();
      expect(newSession.channel).toBe('other-channel');
      expect(channelRouter.getSession('session-id')).toBeUndefined();
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





