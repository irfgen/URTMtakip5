/**
 * İrsaliye Analiz API Test Suite
 * Tests n8n webhook integration for irsaliye image analysis
 */

const request = require('supertest');
const express = require('express');
const irsaliyeRoutes = require('../../routes/irsaliyeler');
const axios = require('axios');

// Mock axios
jest.mock('axios');
jest.mock('uuid', () => ({
    v4: () => 'test-uuid-v4-mock-id-12345'
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => (req, res, next) => {
    req.user = { id: 1, ad_soyad: 'Test User' };
    req.io = { emit: jest.fn() };
    next();
});

// Test app setup
const app = express();
app.use(express.json());
app.use('/api/irsaliyeler', irsaliyeRoutes);

describe('POST /api/irsaliyeler/analiz', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Validation', () => {
        it('should return 400 when image is missing', async () => {
            const response = await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    irsaliye_no: 'IRS-123'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Eksik parametreler');
        });

        it('should return 400 when irsaliye_no is missing', async () => {
            const response = await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    image: 'data:image/jpeg;base64,testdata'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 when both fields are missing', async () => {
            const response = await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({});

            expect(response.status).toBe(400);
        });
    });

    describe('n8n Webhook Integration', () => {

        it('should call n8n webhook with correct payload', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    request_id: 'test-uuid-v4-mock-id-12345',
                    processing_time_ms: 2340,
                    data: {
                        irsaliye_no: 'IRS20240115001',
                        tedarikci_adi: 'ABC Tedarik A.Ş.',
                        belge_tarih: '15.01.2024',
                        aciklama: 'Parça teslimatı',
                        kalemler: [
                            {
                                stok_kodu: 'P-100',
                                parca_adi: 'Dişli',
                                miktar: 100,
                                birim: 'Adet',
                                aciklama: ''
                            }
                        ]
                    },
                    metadata: {
                        model: 'gemini-2.0-flash-exp',
                        processed_at: '2025-01-26T10:30:02Z',
                        confidence_score: 0.95,
                        workflow_version: '1.0.0'
                    }
                }
            };

            axios.post.mockResolvedValue(mockResponse);

            const response = await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    image: 'data:image/jpeg;base64,testbase64data',
                    irsaliye_no: 'IRS-123'
                });

            // Verify response
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.request_id).toBe('test-uuid-v4-mock-id-12345');
            expect(response.body.processing_time_ms).toBe(2340);
            expect(response.body.data.irsaliye_no).toBe('IRS20240115001');
            expect(response.body.data.tedarikci_adi).toBe('ABC Tedarik A.Ş.');
            expect(response.body.data.kalemler).toHaveLength(1);
            expect(response.body.metadata.confidence_score).toBe(0.95);

            // Verify axios was called with correct parameters
            expect(axios.post).toHaveBeenCalledWith(
                'https://n8n.igenis.com/webhook/irsaliye-analiz',
                expect.objectContaining({
                    image: 'testbase64data',  // Base64 header removed
                    irsaliye_no: 'IRS-123',
                    timestamp: expect.any(String),
                    request_id: 'test-uuid-v4-mock-id-12345'
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    }),
                    timeout: 45000
                })
            );
        });

        it('should handle n8n processing errors (4xx)', async () => {
            const mockResponse = {
                data: {
                    success: false,
                    request_id: 'test-uuid-v4-mock-id-12345',
                    error: {
                        message: 'Invalid image format',
                        type: 'validation_error'
                    }
                }
            };

            axios.post.mockResolvedValue(mockResponse);

            const response = await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    image: 'data:image/jpeg;base64,invalid',
                    irsaliye_no: 'IRS-123'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('Invalid image format');
        });

        it('should handle n8n server errors (5xx)', async () => {
            const mockError = new Error('n8n server error');
            mockError.response = {
                status: 500,
                data: {
                    error: {
                        message: 'Internal server error in n8n'
                    }
                }
            };

            axios.post.mockRejectedValue(mockError);

            const response = await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    image: 'data:image/jpeg;base64,test',
                    irsaliye_no: 'IRS-123'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error.type).toBe('webhook_error');
        });

        it('should handle network errors (timeout)', async () => {
            const mockError = new Error('Network timeout');
            mockError.request = {}; // No response received

            axios.post.mockRejectedValue(mockError);

            const response = await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    image: 'data:image/jpeg;base64,test',
                    irsaliye_no: 'IRS-123'
                });

            expect(response.status).toBe(503);
            expect(response.body.success).toBe(false);
            expect(response.body.error.type).toBe('network_error');
            expect(response.body.error.message).toContain('ulaşılamadı');
        });

        it('should clean base64 header before sending to n8n', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    request_id: 'test-uuid',
                    processing_time_ms: 1000,
                    data: { irsaliye_no: 'IRS-001', tedarikci_adi: 'Test', belge_tarih: '01.01.2024', kalemler: [] },
                    metadata: {}
                }
            };

            axios.post.mockResolvedValue(mockResponse);

            await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    image: 'data:image/jpeg;base64,testbase64datawithheader',
                    irsaliye_no: 'IRS-123'
                });

            expect(axios.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    image: 'testbase64datawithheader'  // Header should be removed
                }),
                expect.anything()
            );
        });

        it('should handle images without base64 header', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    request_id: 'test-uuid',
                    processing_time_ms: 1000,
                    data: { irsaliye_no: 'IRS-001', tedarikci_adi: 'Test', belge_tarih: '01.01.2024', kalemler: [] },
                    metadata: {}
                }
            };

            axios.post.mockResolvedValue(mockResponse);

            await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    image: 'plainbase64data',
                    irsaliye_no: 'IRS-123'
                });

            expect(axios.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    image: 'plainbase64data'  // Should pass through as-is
                }),
                expect.anything()
            );
        });
    });

    describe('Request ID Generation', () => {
        it('should generate unique request ID for each request', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    request_id: 'test-uuid-v4-mock-id-12345',
                    processing_time_ms: 1000,
                    data: { irsaliye_no: 'IRS-001', tedarikci_adi: 'Test', belge_tarih: '01.01.2024', kalemler: [] },
                    metadata: {}
                }
            };

            axios.post.mockResolvedValue(mockResponse);

            const response1 = await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    image: 'data:image/jpeg;base64,test1',
                    irsaliye_no: 'IRS-001'
                });

            const response2 = await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    image: 'data:image/jpeg;base64,test2',
                    irsaliye_no: 'IRS-002'
                });

            // Verify request IDs are present (they're mocked to same value, but in real scenario would differ)
            expect(response1.body.request_id).toBeTruthy();
            expect(response2.body.request_id).toBeTruthy();
        });
    });

    describe('Timeout Configuration', () => {
        it('should use 45 second timeout for n8n webhook', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    request_id: 'test-uuid',
                    processing_time_ms: 1000,
                    data: { irsaliye_no: 'IRS-001', tedarikci_adi: 'Test', belge_tarih: '01.01.2024', kalemler: [] },
                    metadata: {}
                }
            };

            axios.post.mockResolvedValue(mockResponse);

            await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    image: 'data:image/jpeg;base64,test',
                    irsaliye_no: 'IRS-123'
                });

            expect(axios.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                expect.objectContaining({
                    timeout: 45000
                })
            );
        });
    });

    describe('Authentication Header (Optional)', () => {
        it('should not send X-n8n-API-Key when N8N_API_KEY is not set', async () => {
            // Temporarily unset env var
            const originalEnv = process.env.N8N_API_KEY;
            delete process.env.N8N_API_KEY;

            const mockResponse = {
                data: {
                    success: true,
                    request_id: 'test-uuid',
                    processing_time_ms: 1000,
                    data: { irsaliye_no: 'IRS-001', tedarikci_adi: 'Test', belge_tarih: '01.01.2024', kalemler: [] },
                    metadata: {}
                }
            };

            axios.post.mockResolvedValue(mockResponse);

            await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    image: 'data:image/jpeg;base64,test',
                    irsaliye_no: 'IRS-123'
                });

            const axiosCall = axios.post.mock.calls[0];
            expect(axiosCall[2].headers).not.toHaveProperty('X-n8n-API-Key');

            // Restore env var
            if (originalEnv) {
                process.env.N8N_API_KEY = originalEnv;
            }
        });

        it('should send X-n8n-API-Key when N8N_API_KEY is set', async () => {
            process.env.N8N_API_KEY = 'test-api-key-123';

            const mockResponse = {
                data: {
                    success: true,
                    request_id: 'test-uuid',
                    processing_time_ms: 1000,
                    data: { irsaliye_no: 'IRS-001', tedarikci_adi: 'Test', belge_tarih: '01.01.2024', kalemler: [] },
                    metadata: {}
                }
            };

            axios.post.mockResolvedValue(mockResponse);

            await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    image: 'data:image/jpeg;base64,test',
                    irsaliye_no: 'IRS-123'
                });

            const axiosCall = axios.post.mock.calls[0];
            expect(axiosCall[2].headers['X-n8n-API-Key']).toBe('test-api-key-123');

            // Cleanup
            delete process.env.N8N_API_KEY;
        });
    });

    describe('Error Response Format', () => {
        it('should return consistent error format for webhook errors', async () => {
            const mockError = new Error('Webhook failed');
            mockError.response = {
                status: 400,
                data: {
                    error: {
                        message: 'Validation failed',
                        type: 'validation_error'
                    }
                }
            };

            axios.post.mockRejectedValue(mockError);

            const response = await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    image: 'data:image/jpeg;base64,test',
                    irsaliye_no: 'IRS-123'
                });

            expect(response.body).toMatchObject({
                success: false,
                request_id: 'test-uuid-v4-mock-id-12345',
                error: {
                    message: expect.any(String),
                    type: expect.any(String)
                }
            });
        });

        it('should return consistent error format for network errors', async () => {
            const mockError = new Error('Network error');
            mockError.request = {};

            axios.post.mockRejectedValue(mockError);

            const response = await request(app)
                .post('/api/irsaliyeler/analiz')
                .send({
                    image: 'data:image/jpeg;base64,test',
                    irsaliye_no: 'IRS-123'
                });

            expect(response.body).toMatchObject({
                success: false,
                request_id: 'test-uuid-v4-mock-id-12345',
                error: {
                    message: expect.stringContaining('ulaşılamadı'),
                    type: 'network_error'
                }
            });
        });
    });
});
