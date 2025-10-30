import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadDocuments, uploadDocumentsToFolder } from '../document';
import { prisma } from '@/lib/prisma';
import * as supabaseStorage from '@/services/supabaseStorage';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

// Mock dependencies
vi.mock('@clerk/nextjs/server');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    documentQueue: {
      create: vi.fn(),
    },
  },
}));
vi.mock('@/services/supabaseStorage', () => ({
  uploadToS3: vi.fn(),
  generateS3Key: vi.fn(),
  getSignedDownloadUrl: vi.fn(),
}));
vi.mock('crypto');

describe('Document Upload - Story 2.2 Tests', () => {
  const mockUserId = 'user_123';
  const mockProjectId = 'project_456';

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({ userId: mockUserId });
  });

  describe('File Validation (AC-5, AC-9)', () => {
    it('should reject files larger than 15MB', async () => {
      const largeFile = new File(
        [new ArrayBuffer(16 * 1024 * 1024)], // 16MB
        'large-file.pdf',
        { type: 'application/pdf' }
      );

      const formData = new FormData();
      formData.append('projectId', mockProjectId);
      formData.append('files', largeFile);

      const result = await uploadDocuments(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
      expect(result.error?.message).toContain('exceeds 15MB limit');
    });

    it('should accept files at exactly 15MB boundary', async () => {
      const exactSizeFile = new File(
        [new ArrayBuffer(15 * 1024 * 1024)], // Exactly 15MB
        'exact-size.pdf',
        { type: 'application/pdf' }
      );

      const formData = new FormData();
      formData.append('projectId', mockProjectId);
      formData.append('folderPath', 'Documents/General');
      formData.append('files', exactSizeFile);

      // Mock successful upload
      (crypto.createHash as any).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('abc123'),
      });
      (prisma.document.findFirst as any).mockResolvedValue(null);
      (supabaseStorage.generateS3Key as any).mockReturnValue('project_456/Documents/General/file.pdf');
      (supabaseStorage.uploadToS3 as any).mockResolvedValue({
        bucket: 'test-bucket',
        url: 'https://s3.amazonaws.com/test-bucket/file.pdf',
      });
      (prisma.document.create as any).mockResolvedValue({
        id: 'doc_123',
        name: 'exact-size.pdf',
      });
      (prisma.documentQueue.create as any).mockResolvedValue({});

      const result = await uploadDocuments(formData);

      expect(result.success).toBe(true);
    });

    it('should reject unsupported file types (AC-9)', async () => {
      const exeFile = new File(
        [new ArrayBuffer(1024)],
        'malware.exe',
        { type: 'application/x-msdownload' }
      );

      const formData = new FormData();
      formData.append('projectId', mockProjectId);
      formData.append('files', exeFile);

      const result = await uploadDocuments(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_TYPE');
      expect(result.error?.message).toContain('unsupported type');
    });

    it('should accept all allowed MIME types', async () => {
      const allowedTypes = [
        { type: 'application/pdf', extension: '.pdf' },
        { type: 'image/png', extension: '.png' },
        { type: 'image/jpeg', extension: '.jpg' },
        { type: 'application/msword', extension: '.doc' },
        { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: '.docx' },
      ];

      for (const { type, extension } of allowedTypes) {
        const file = new File(
          [new ArrayBuffer(1024)],
          `test${extension}`,
          { type }
        );

        const formData = new FormData();
        formData.append('projectId', mockProjectId);
        formData.append('folderPath', '');
        formData.append('files', file);

        // Mock successful upload
        (crypto.createHash as any).mockReturnValue({
          update: vi.fn().mockReturnThis(),
          digest: vi.fn().mockReturnValue('abc123'),
        });
        (prisma.document.findFirst as any).mockResolvedValue(null);
        (supabaseStorage.generateS3Key as any).mockReturnValue(`project_456/test${extension}`);
        (supabaseStorage.uploadToS3 as any).mockResolvedValue({
          bucket: 'test-bucket',
          url: `https://s3.amazonaws.com/test-bucket/test${extension}`,
        });
        (prisma.document.create as any).mockResolvedValue({
          id: `doc_${type}`,
          name: `test${extension}`,
        });
        (prisma.documentQueue.create as any).mockResolvedValue({});

        const result = await uploadDocuments(formData);

        expect(result.success).toBe(true);
      }
    });
  });

  describe('Checksum Calculation (AC-7)', () => {
    it('should calculate MD5 checksum for uploaded files', async () => {
      const file = new File([new ArrayBuffer(1024)], 'test.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('projectId', mockProjectId);
      formData.append('folderPath', '');
      formData.append('files', file);

      const mockChecksum = 'abcdef123456';
      const mockHashInstance = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue(mockChecksum),
      };
      (crypto.createHash as any).mockReturnValue(mockHashInstance);

      (prisma.document.findFirst as any).mockResolvedValue(null);
      (supabaseStorage.generateS3Key as any).mockReturnValue('project_456/test.pdf');
      (supabaseStorage.uploadToS3 as any).mockResolvedValue({
        bucket: 'test-bucket',
        url: 'https://s3.amazonaws.com/test-bucket/test.pdf',
      });
      (prisma.document.create as any).mockResolvedValue({ id: 'doc_123' });
      (prisma.documentQueue.create as any).mockResolvedValue({});

      await uploadDocuments(formData);

      expect(crypto.createHash).toHaveBeenCalledWith('md5');
      expect(mockHashInstance.update).toHaveBeenCalled();
      expect(mockHashInstance.digest).toHaveBeenCalledWith('hex');
      expect(prisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            checksum: mockChecksum,
          }),
        })
      );
    });

    it('should skip duplicate files based on checksum', async () => {
      const file = new File([new ArrayBuffer(1024)], 'duplicate.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('projectId', mockProjectId);
      formData.append('files', file);

      const existingDocument = {
        id: 'existing_doc',
        name: 'duplicate.pdf',
        checksum: 'existing_checksum',
      };

      (crypto.createHash as any).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('existing_checksum'),
      });
      (prisma.document.findFirst as any).mockResolvedValue(existingDocument);

      const result = await uploadDocuments(formData);

      expect(result.success).toBe(true);
      expect(result.data).toContain(existingDocument);
      expect(supabaseStorage.uploadToS3).not.toHaveBeenCalled();
      expect(prisma.document.create).not.toHaveBeenCalled();
    });
  });

  describe('Bulk Upload (AC-2, AC-3, AC-4)', () => {
    it('should upload multiple files simultaneously (up to 10 files)', async () => {
      const files = Array.from({ length: 10 }, (_, i) =>
        new File([new ArrayBuffer(1024)], `file${i}.pdf`, { type: 'application/pdf' })
      );

      const formData = new FormData();
      formData.append('projectId', mockProjectId);
      formData.append('folderPath', 'Documents/General');
      files.forEach(file => formData.append('files', file));

      (crypto.createHash as any).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockImplementation((format) => `checksum_${Math.random()}`),
      });
      (prisma.document.findFirst as any).mockResolvedValue(null);
      (supabaseStorage.generateS3Key as any).mockImplementation((projectId, folderPath, filename) =>
        `${projectId}/${folderPath}/${filename}`
      );
      (supabaseStorage.uploadToS3 as any).mockResolvedValue({
        bucket: 'test-bucket',
        url: 'https://s3.amazonaws.com/test-bucket/file.pdf',
      });
      (prisma.document.create as any).mockImplementation((data) =>
        Promise.resolve({ id: `doc_${Math.random()}`, ...data.data })
      );
      (prisma.documentQueue.create as any).mockResolvedValue({});

      const result = await uploadDocuments(formData);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(10);
      expect(supabaseStorage.uploadToS3).toHaveBeenCalledTimes(10);
      expect(prisma.document.create).toHaveBeenCalledTimes(10);
    });

    it('should upload files to specific folder path (AC-4)', async () => {
      const file = new File([new ArrayBuffer(1024)], 'report.pdf', { type: 'application/pdf' });
      const targetFolder = 'Documents/Consultant/Architect';

      const formData = new FormData();
      formData.append('projectId', mockProjectId);
      formData.append('folderPath', targetFolder);
      formData.append('files', file);

      (crypto.createHash as any).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('checksum123'),
      });
      (prisma.document.findFirst as any).mockResolvedValue(null);
      (supabaseStorage.generateS3Key as any).mockReturnValue(`${mockProjectId}/${targetFolder}/report.pdf`);
      (supabaseStorage.uploadToS3 as any).mockResolvedValue({
        bucket: 'test-bucket',
        url: 'https://s3.amazonaws.com/test-bucket/file.pdf',
      });
      (prisma.document.create as any).mockResolvedValue({ id: 'doc_123' });
      (prisma.documentQueue.create as any).mockResolvedValue({});

      await uploadDocuments(formData);

      expect(prisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            path: targetFolder,
          }),
        })
      );
    });
  });

  describe('S3 Integration (AC-7, AC-8)', () => {
    it('should upload to S3 with unique keys', async () => {
      const file = new File([new ArrayBuffer(1024)], 'test.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('projectId', mockProjectId);
      formData.append('folderPath', 'Documents');
      formData.append('files', file);

      const mockS3Key = `${mockProjectId}/Documents/${Date.now()}-test.pdf`;

      (crypto.createHash as any).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('checksum'),
      });
      (prisma.document.findFirst as any).mockResolvedValue(null);
      (supabaseStorage.generateS3Key as any).mockReturnValue(mockS3Key);
      (supabaseStorage.uploadToS3 as any).mockResolvedValue({
        bucket: 'test-bucket',
        url: `https://s3.amazonaws.com/test-bucket/${mockS3Key}`,
      });
      (prisma.document.create as any).mockResolvedValue({ id: 'doc_123' });
      (prisma.documentQueue.create as any).mockResolvedValue({});

      await uploadDocuments(formData);

      expect(supabaseStorage.uploadToS3).toHaveBeenCalledWith(
        expect.any(Buffer),
        mockS3Key,
        'application/pdf'
      );
      expect(prisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            s3Key: mockS3Key,
            s3Bucket: 'test-bucket',
          }),
        })
      );
    });

    it('should queue documents for AI processing', async () => {
      const file = new File([new ArrayBuffer(1024)], 'test.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('projectId', mockProjectId);
      formData.append('files', file);

      const mockDocId = 'doc_xyz';

      (crypto.createHash as any).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('checksum'),
      });
      (prisma.document.findFirst as any).mockResolvedValue(null);
      (supabaseStorage.generateS3Key as any).mockReturnValue('key');
      (supabaseStorage.uploadToS3 as any).mockResolvedValue({
        bucket: 'test-bucket',
        url: 'https://s3.amazonaws.com/file.pdf',
      });
      (prisma.document.create as any).mockResolvedValue({ id: mockDocId });
      (prisma.documentQueue.create as any).mockResolvedValue({});

      await uploadDocuments(formData);

      expect(prisma.documentQueue.create).toHaveBeenCalledWith({
        data: {
          documentId: mockDocId,
          status: 'pending',
        },
      });
    });
  });

  describe('Authentication (Security)', () => {
    it('should reject unauthenticated requests', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const file = new File([new ArrayBuffer(1024)], 'test.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('projectId', mockProjectId);
      formData.append('files', file);

      const result = await uploadDocuments(formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });
  });

  describe('uploadDocumentsToFolder helper (AC-3, AC-4)', () => {
    it('should construct FormData and call uploadDocuments', async () => {
      const files = [
        new File([new ArrayBuffer(1024)], 'test1.pdf', { type: 'application/pdf' }),
        new File([new ArrayBuffer(1024)], 'test2.pdf', { type: 'application/pdf' }),
      ];
      const folderPath = 'Documents/Invoices';

      // We can't easily spy on uploadDocuments since it's in the same module,
      // so we'll just ensure it returns a result
      (crypto.createHash as any).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockImplementation(() => `checksum_${Math.random()}`),
      });
      (prisma.document.findFirst as any).mockResolvedValue(null);
      (supabaseStorage.generateS3Key as any).mockImplementation((projectId, folderPath, filename) =>
        `${projectId}/${folderPath}/${filename}`
      );
      (supabaseStorage.uploadToS3 as any).mockResolvedValue({
        bucket: 'test-bucket',
        url: 'https://s3.amazonaws.com/test-bucket/file.pdf',
      });
      (prisma.document.create as any).mockImplementation((data) =>
        Promise.resolve({ id: `doc_${Math.random()}`, ...data.data })
      );
      (prisma.documentQueue.create as any).mockResolvedValue({});

      const result = await uploadDocumentsToFolder(mockProjectId, folderPath, files);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });
});
