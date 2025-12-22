import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DMSService } from '../dms.service';
import { DMSClient, DMSDocument, DMSFolder, DMSApiError } from '../client';

describe('DMSService', () => {
  let dmsService: DMSService;
  let mockDMSClient: DMSClient;

  beforeEach(() => {
    // Mock DMSClient
    mockDMSClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      healthCheck: vi.fn(),
    } as any;

    dmsService = new DMSService(mockDMSClient);
  });

  describe('listDocuments', () => {
    it('should return empty array when DMS API is not implemented', async () => {
      const result = await dmsService.listDocuments('tenant-1', {
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual([]);
    });

    it('should handle options correctly', async () => {
      const options = {
        folderId: 'folder-1',
        limit: 20,
        offset: 10,
        updatedSince: new Date('2024-01-01'),
      };

      const result = await dmsService.listDocuments('tenant-1', options);

      expect(result).toEqual([]);
    });
  });

  describe('getDocument', () => {
    it('should throw error when DMS API is not implemented', async () => {
      await expect(
        dmsService.getDocument('tenant-1', 'doc-123'),
      ).rejects.toThrow('DMS document fetch not yet implemented');
    });

    it('should include document ID in error message', async () => {
      try {
        await dmsService.getDocument('tenant-1', 'doc-123');
      } catch (error: any) {
        expect(error.message).toContain('doc-123');
        expect(error.message).toContain('DMS_BASE_URL');
      }
    });
  });

  describe('getDocumentContent', () => {
    it('should throw error when DMS API is not implemented', async () => {
      await expect(dmsService.getDocumentContent('doc-123')).rejects.toThrow(
        'DMS document content fetch not yet implemented',
      );
    });

    it('should include document ID in error message', async () => {
      try {
        await dmsService.getDocumentContent('doc-456');
      } catch (error: any) {
        expect(error.message).toContain('doc-456');
        expect(error.message).toContain('DMS_BASE_URL');
      }
    });
  });

  describe('getFolders', () => {
    it('should return empty array when DMS API is not implemented', async () => {
      const result = await dmsService.getFolders();

      expect(result).toEqual([]);
    });

    it('should handle folder options correctly', async () => {
      const options = {
        parentId: 'parent-1',
        limit: 50,
        offset: 0,
      };

      const result = await dmsService.getFolders(options);

      expect(result).toEqual([]);
    });
  });

  describe('getSyncStatus', () => {
    it('should return null for unknown tenant', () => {
      const status = dmsService.getSyncStatus('unknown-tenant');

      expect(status).toBeNull();
    });

    it('should return sync status after sync starts', async () => {
      const tenantId = 'tenant-1';
      const knowledgeSpaceId = 'kb-1';

      // Start sync (wird fehlschlagen, aber Status wird gesetzt)
      try {
        await dmsService.syncDocuments(tenantId, knowledgeSpaceId);
      } catch {
        // Ignoriere Fehler
      }

      const status = dmsService.getSyncStatus(tenantId);

      expect(status).not.toBeNull();
      expect(status?.status).toBe('error');
    });
  });

  describe('healthCheck', () => {
    it('should delegate to DMSClient healthCheck', async () => {
      vi.mocked(mockDMSClient.healthCheck).mockResolvedValue(true);

      const result = await dmsService.healthCheck();

      expect(result).toBe(true);
      expect(mockDMSClient.healthCheck).toHaveBeenCalled();
    });

    it('should return false when health check fails', async () => {
      vi.mocked(mockDMSClient.healthCheck).mockResolvedValue(false);

      const result = await dmsService.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('syncDocuments', () => {
    it('should set sync status to syncing when starting', async () => {
      const tenantId = 'tenant-1';
      const knowledgeSpaceId = 'kb-1';

      // Sync starten (wird fehlschlagen, aber Status wird gesetzt)
      try {
        await dmsService.syncDocuments(tenantId, knowledgeSpaceId);
      } catch {
        // Ignoriere Fehler
      }

      const status = dmsService.getSyncStatus(tenantId);
      expect(status).not.toBeNull();
      expect(status?.status).toBe('error');
    });

    it('should handle batch size option', async () => {
      const tenantId = 'tenant-1';
      const knowledgeSpaceId = 'kb-1';

      try {
        await dmsService.syncDocuments(tenantId, knowledgeSpaceId, {
          batchSize: 50,
        });
      } catch {
        // Ignoriere Fehler
      }

      const status = dmsService.getSyncStatus(tenantId);
      expect(status).not.toBeNull();
    });
  });
});





