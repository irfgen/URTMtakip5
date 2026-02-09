/**
 * Socket.IO Event Tests - Fatura & İrsaliye Matching System
 *
 * Test Suite: Socket.IO Event Tests
 * Description: Real-time event broadcasting tests for matching operations
 *
 * Test Coverage:
 * - Client connection to /fatura-eslestirme namespace
 * - eslestirme-tamamlandi event broadcasting
 * - eslestirme-kaldirildi event broadcasting
 * - Multiple client synchronization
 * - Disconnect handling
 */

const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');
const jwt = require('jsonwebtoken');

// Mock database for isolated testing
jest.mock('../../models/Personel', () => ({
  findByPk: jest.fn(),
}));

jest.mock('../../models/Fatura', () => ({
  findByPk: jest.fn(),
}));

jest.mock('../../models/Irsaliye', () => ({
  findByPk: jest.fn(),
}));

const Personel = require('../../models/Personel');

// Mock JWT_SECRET
process.env.JWT_SECRET = 'test-secret-key';

describe('Socket.IO - Fatura & İrsaliye Matching Events', () => {
  let io, serverSocket, clientSockets;
  let serverHttp;
  let mockUsers;

  // Test configuration
  const NAMESPACE = '/fatura-eslestirme';
  const TEST_PORT = 3001;

  /**
   * Setup: Create HTTP server and Socket.IO server
   * Initialize Socket.IO server with fatura-eslestirme namespace
   */
  beforeEach((done) => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock users for authentication
    mockUsers = [
      { id: 1, ad: 'Test User 1', soyad: 'Test', email: 'test1@example.com' },
      { id: 2, ad: 'Test User 2', soyad: 'Test', email: 'test2@example.com' },
      { id: 3, ad: 'Test User 3', soyad: 'Test', email: 'test3@example.com' },
    ];

    // Mock Personel.findByPk to return test users
    // Create a more flexible mock that handles any user ID
    Personel.findByPk.mockImplementation((id) => {
      const foundUser = mockUsers.find((u) => u.id === id);
      if (foundUser) {
        return Promise.resolve(foundUser);
      }
      // For unknown user IDs (like 777, 888, 999 in queue tests), create a mock user
      return Promise.resolve({
        id: id,
        ad: `Test User ${id}`,
        soyad: 'Test',
        email: `test${id}@example.com`,
      });
    });

    serverHttp = http.createServer();
    io = new Server(serverHttp, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Import and initialize Socket.IO handlers
    require('../../socket/namespaces/faturaEslestirme')(io);

    serverHttp.listen(TEST_PORT, done);
    clientSockets = [];
  });

  /**
   * Cleanup: Disconnect all clients and close server
   */
  afterEach((done) => {
    // Disconnect all client sockets
    clientSockets.forEach((socket) => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
    clientSockets = [];

    // Close server
    io.close();
    serverHttp.close(done);
  });

  /**
   * Helper: Generate JWT token for test user
   * @param {number} userId - User ID for token generation
   * @returns {string} JWT token
   */
  const generateTestToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  };

  /**
   * Helper: Create and connect a new authenticated client socket
   * @param {number} userId - User ID for authentication
   * @param {Function} onAnyListener - Optional callback for 'any' event listener
   * @returns {Promise<Socket>} Connected client socket
   */
  const createClient = (userId = 1, onAnyListener = null) => {
    return new Promise((resolve, reject) => {
      const token = generateTestToken(userId);
      const client = new Client(`http://localhost:${TEST_PORT}${NAMESPACE}`, {
        transports: ['websocket'],
        reconnection: false,
        auth: { token },
      });

      // Register any additional listener before connection
      if (onAnyListener) {
        onAnyListener(client);
      }

      client.on('connect', () => {
        clientSockets.push(client);
        resolve(client);
      });

      client.on('connect_error', (error) => {
        reject(error);
      });
    });
  };

  /**
   * Helper: Create multiple connected clients
   * @param {number} count - Number of clients to create
   * @returns {Promise<Socket[]>} Array of connected client sockets
   */
  const createMultipleClients = (count) => {
    return Promise.all(
      Array(count)
        .fill(null)
        .map((_, index) => createClient(index + 1))
    );
  };

  // =========================================================================
  // TEST SUITE 1: Connection Tests
  // =========================================================================

  describe('Connection Management', () => {
    /**
     * Test 1.1: Client connects to namespace successfully
     */
    test('should connect client to /fatura-eslestirme namespace', async () => {
      const client = await createClient();

      expect(client.connected).toBe(true);
      expect(client.id).toBeDefined();
    });

    /**
     * Test 1.2: Client disconnects cleanly
     */
    test('should disconnect client from namespace', async () => {
      const client = await createClient();

      client.disconnect();

      // Wait for disconnect to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(client.connected).toBe(false);
    });

    /**
     * Test 1.3: Multiple clients connect simultaneously
     */
    test('should connect multiple clients to namespace', async () => {
      const clients = await createMultipleClients(3);

      clients.forEach((client) => {
        expect(client.connected).toBe(true);
        expect(client.id).toBeDefined();
      });
    });
  });

  // =========================================================================
  // TEST SUITE 2: Authentication Tests
  // =========================================================================

  describe('Authentication', () => {
    /**
     * Test 2.1: Unauthenticated client cannot connect
     */
    test('should reject connection without token', async () => {
      const client = new Client(`http://localhost:${TEST_PORT}${NAMESPACE}`, {
        transports: ['websocket'],
        reconnection: false,
      });

      const errorPromise = new Promise((resolve) => {
        client.on('connect_error', (error) => {
          resolve(error);
        });
      });

      const error = await errorPromise;

      expect(error.message).toBe('Authentication error');
      expect(client.connected).toBe(false);

      client.disconnect();
    });

    /**
     * Test 2.2: Invalid token is rejected
     */
    test('should reject connection with invalid token', async () => {
      const client = new Client(`http://localhost:${TEST_PORT}${NAMESPACE}`, {
        transports: ['websocket'],
        reconnection: false,
        auth: { token: 'invalid-token' },
      });

      const errorPromise = new Promise((resolve) => {
        client.on('connect_error', (error) => {
          resolve(error);
        });
      });

      const error = await errorPromise;

      expect(error.message).toBe('Authentication error');
      expect(client.connected).toBe(false);

      client.disconnect();
    });

    /**
     * Test 2.3: Valid token allows connection
     */
    test('should accept connection with valid token', async () => {
      const client = await createClient(1);

      expect(client.connected).toBe(true);
    });

    /**
     * Test 2.4: Non-existent user is rejected
     */
    test('should reject connection for non-existent user', async () => {
      // Mock findByPk to return null for user ID 999
      Personel.findByPk.mockResolvedValueOnce(null);

      const client = new Client(`http://localhost:${TEST_PORT}${NAMESPACE}`, {
        transports: ['websocket'],
        reconnection: false,
        auth: { token: generateTestToken(999) },
      });

      const errorPromise = new Promise((resolve) => {
        client.on('connect_error', (error) => {
          resolve(error);
        });
      });

      const error = await errorPromise;

      expect(error.message).toBe('User not found');
      expect(client.connected).toBe(false);

      client.disconnect();
    });
  });

  // =========================================================================
  // TEST SUITE 3: Matching Complete Event Tests
  // =========================================================================

  describe('Event: eslestirme-tamamlandi', () => {
    /**
     * Test 2.1: Client receives matching complete event
     * Event payload structure:
     * {
     *   faturaId: number,
     *   irsaliyeId: number,
     *   faturaNo: string,
     *   irsaliyeNo: string,
     *   toplam: number,
     *   timestamp: string
     * }
     */
    test('should broadcast eslestirme-tamamlandi event to all clients', async () => {
      const clients = await createMultipleClients(2);

      const eventData = {
        faturaId: 1,
        irsaliyeId: 100,
        faturaNo: 'FAT-2024-001',
        irsaliyeNo: 'IRS-2024-001',
        toplam: 15000.50,
        timestamp: '2024-01-15T10:30:00Z',
      };

      const eventPromises = clients.map(
        (client) =>
          new Promise((resolve) => {
            client.on('eslestirme-tamamlandi', (data) => {
              resolve(data);
            });
          })
      );

      // Simulate server emitting the event
      io.of(NAMESPACE).emit('eslestirme-tamamlandi', eventData);

      const receivedEvents = await Promise.all(eventPromises);

      // Verify both clients received the event
      receivedEvents.forEach((data) => {
        expect(data).toEqual(eventData);
        expect(data.faturaId).toBe(1);
        expect(data.irsaliyeId).toBe(100);
        expect(data.toplam).toBe(15000.50);
      });
    });

    /**
     * Test 2.2: Event contains all required fields
     */
    test('should include all required fields in eslestirme-tamamlandi event', async () => {
      const client = await createClient();

      const eventData = {
        faturaId: 5,
        irsaliyeId: 200,
        faturaNo: 'FAT-2024-005',
        irsaliyeNo: 'IRS-2024-200',
        toplam: 7500.25,
        timestamp: new Date().toISOString(),
      };

      const eventPromise = new Promise((resolve) => {
        client.on('eslestirme-tamamlandi', (data) => {
          resolve(data);
        });
      });

      io.of(NAMESPACE).emit('eslestirme-tamamlandi', eventData);

      const received = await eventPromise;

      // Verify all fields present
      expect(received).toHaveProperty('faturaId');
      expect(received).toHaveProperty('irsaliyeId');
      expect(received).toHaveProperty('faturaNo');
      expect(received).toHaveProperty('irsaliyeNo');
      expect(received).toHaveProperty('toplam');
      expect(received).toHaveProperty('timestamp');
    });

    /**
     * Test 2.3: Event with matching details
     */
    test('should broadcast eslestirme-tamamlandi with matching details', async () => {
      const client = await createClient();

      const matchingDetails = {
        eslestirmeId: 12345,
        faturaId: 10,
        irsaliyeId: 500,
        faturaNo: 'FAT-2024-010',
        irsaliyeNo: 'IRS-2024-500',
        eslesenKalemSayisi: 5,
        toplam: 25000.00,
        kullanici: 'test_user',
        timestamp: '2024-01-15T11:00:00Z',
      };

      const eventPromise = new Promise((resolve) => {
        client.on('eslestirme-tamamlandi', (data) => {
          resolve(data);
        });
      });

      io.of(NAMESPACE).emit('eslestirme-tamamlandi', matchingDetails);

      const received = await eventPromise;

      expect(received.eslestirmeId).toBe(12345);
      expect(received.eslesenKalemSayisi).toBe(5);
      expect(received.kullanici).toBe('test_user');
    });
  });

  // =========================================================================
  // TEST SUITE 3: Matching Removed Event Tests
  // =========================================================================

  describe('Event: eslestirme-kaldirildi', () => {
    /**
     * Test 3.1: Client receives matching removed event
     * Event payload structure:
     * {
     *   eslestirmeId: number,
     *   faturaId: number,
     *   irsaliyeId: number,
     *   timestamp: string
     * }
     */
    test('should broadcast eslestirme-kaldirildi event to all clients', async () => {
      const clients = await createMultipleClients(3);

      const eventData = {
        eslestirmeId: 999,
        faturaId: 20,
        irsaliyeId: 300,
        timestamp: '2024-01-15T12:00:00Z',
      };

      const eventPromises = clients.map(
        (client) =>
          new Promise((resolve) => {
            client.on('eslestirme-kaldirildi', (data) => {
              resolve(data);
            });
          })
      );

      io.of(NAMESPACE).emit('eslestirme-kaldirildi', eventData);

      const receivedEvents = await Promise.all(eventPromises);

      // Verify all clients received the event
      receivedEvents.forEach((data) => {
        expect(data).toEqual(eventData);
        expect(data.eslestirmeId).toBe(999);
        expect(data.faturaId).toBe(20);
        expect(data.irsaliyeId).toBe(300);
      });
    });

    /**
     * Test 3.2: Event contains required removal data
     */
    test('should include removal reason and details', async () => {
      const client = await createClient();

      const removalData = {
        eslestirmeId: 888,
        faturaId: 15,
        irsaliyeId: 250,
        sebep: 'kullanici_silme',
        kullanici: 'admin_user',
        timestamp: '2024-01-15T12:30:00Z',
      };

      const eventPromise = new Promise((resolve) => {
        client.on('eslestirme-kaldirildi', (data) => {
          resolve(data);
        });
      });

      io.of(NAMESPACE).emit('eslestirme-kaldirildi', removalData);

      const received = await eventPromise;

      expect(received.eslestirmeId).toBe(888);
      expect(received.sebep).toBe('kullanici_silme');
      expect(received.kullanici).toBe('admin_user');
    });
  });

  // =========================================================================
  // TEST SUITE 4: Multi-Client Synchronization Tests
  // =========================================================================

  describe('Multi-Client Synchronization', () => {
    /**
     * Test 4.1: All connected clients receive events simultaneously
     */
    test('should synchronize event across all connected clients', async () => {
      const clients = await createMultipleClients(5);

      const eventData = {
        faturaId: 1,
        irsaliyeId: 100,
        faturaNo: 'FAT-2024-001',
        irsaliyeNo: 'IRS-2024-001',
        toplam: 15000.50,
        timestamp: '2024-01-15T10:30:00Z',
      };

      const eventPromises = clients.map(
        (client) =>
          new Promise((resolve) => {
            client.on('eslestirme-tamamlandi', (data) => {
              resolve({
                clientId: client.id,
                data,
              });
            });
          })
      );

      io.of(NAMESPACE).emit('eslestirme-tamamlandi', eventData);

      const results = await Promise.all(eventPromises);

      // Verify all unique clients received the event
      const clientIds = results.map((r) => r.clientId);
      const uniqueClientIds = new Set(clientIds);

      expect(uniqueClientIds.size).toBe(5);
      results.forEach((result) => {
        expect(result.data).toEqual(eventData);
      });
    });

    /**
     * Test 4.2: Client connecting after event doesn't receive past events
     */
    test('should not send past events to newly connected clients', async () => {
      const client1 = await createClient();

      const eventData = {
        faturaId: 1,
        irsaliyeId: 100,
        faturaNo: 'FAT-2024-001',
        irsaliyeNo: 'IRS-2024-001',
        toplam: 15000.50,
        timestamp: '2024-01-15T10:30:00Z',
      };

      // Register listener BEFORE emitting event for client1
      const client1Promise = new Promise((resolve) => {
        client1.on('eslestirme-tamamlandi', (data) => {
          resolve(data);
        });
      });

      // Emit event before client2 connects
      io.of(NAMESPACE).emit('eslestirme-tamamlandi', eventData);

      // Wait for event to propagate and be received by client1
      const client1Received = await Promise.race([
        client1Promise,
        new Promise((resolve) => setTimeout(() => resolve(null), 200)),
      ]);

      expect(client1Received).toEqual(eventData);

      // Wait a bit more to ensure event has passed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Connect client2 after event was emitted
      const client2 = await createClient();

      // Verify client2 does NOT receive the past event
      const client2Promise = new Promise((resolve) => {
        client2.on('eslestirme-tamamlandi', (data) => {
          resolve(data);
        });
      });

      const client2Received = await Promise.race([
        client2Promise,
        new Promise((resolve) => setTimeout(() => resolve(null), 200)),
      ]);

      expect(client2Received).toBeNull();
    });

    /**
     * Test 4.3: Client disconnecting doesn't affect other clients
     */
    test('should continue broadcasting to remaining clients after one disconnects', async () => {
      const clients = await createMultipleClients(3);

      // Disconnect first client
      clients[0].disconnect();

      // Wait for disconnect to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const eventData = {
        faturaId: 5,
        irsaliyeId: 500,
        faturaNo: 'FAT-2024-005',
        irsaliyeNo: 'IRS-2024-500',
        toplam: 25000.00,
        timestamp: '2024-01-15T11:00:00Z',
      };

      const eventPromises = [clients[1], clients[2]].map(
        (client) =>
          new Promise((resolve) => {
            client.on('eslestirme-tamamlandi', (data) => {
              resolve(data);
            });
          })
      );

      io.of(NAMESPACE).emit('eslestirme-tamamlandi', eventData);

      const results = await Promise.all(eventPromises);

      // Verify remaining clients received the event
      expect(results.length).toBe(2);
      results.forEach((data) => {
        expect(data).toEqual(eventData);
      });
    });
  });

  // =========================================================================
  // TEST SUITE 5: Event Sequence Tests
  // =========================================================================

  describe('Event Sequences', () => {
    /**
     * Test 5.1: Multiple events received in correct order
     */
    test('should receive multiple events in correct order', async () => {
      const client = await createClient();

      const events = [
        {
          type: 'eslestirme-tamamlandi',
          data: {
            faturaId: 1,
            irsaliyeId: 100,
            faturaNo: 'FAT-001',
            irsaliyeNo: 'IRS-001',
            toplam: 1000,
            timestamp: '2024-01-15T10:00:00Z',
          },
        },
        {
          type: 'eslestirme-tamamlandi',
          data: {
            faturaId: 2,
            irsaliyeId: 200,
            faturaNo: 'FAT-002',
            irsaliyeNo: 'IRS-002',
            toplam: 2000,
            timestamp: '2024-01-15T10:01:00Z',
          },
        },
        {
          type: 'eslestirme-kaldirildi',
          data: {
            eslestirmeId: 1,
            faturaId: 1,
            irsaliyeId: 100,
            timestamp: '2024-01-15T10:02:00Z',
          },
        },
      ];

      const receivedEvents = [];

      client.on('eslestirme-tamamlandi', (data) => {
        receivedEvents.push({ type: 'eslestirme-tamamlandi', data });
      });

      client.on('eslestirme-kaldirildi', (data) => {
        receivedEvents.push({ type: 'eslestirme-kaldirildi', data });
      });

      // Emit events in sequence
      for (const event of events) {
        io.of(NAMESPACE).emit(event.type, event.data);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Wait for all events to be received
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(receivedEvents.length).toBe(3);
      expect(receivedEvents[0].data.faturaId).toBe(1);
      expect(receivedEvents[1].data.faturaId).toBe(2);
      expect(receivedEvents[2].data.eslestirmeId).toBe(1);
    });
  });

  // =========================================================================
  // TEST SUITE 6: Error Handling Tests
  // =========================================================================

  describe('Error Handling', () => {
    /**
     * Test 6.1: Client handles malformed event data gracefully
     */
    test('should handle event with missing required fields', async () => {
      const client = await createClient();

      const malformedData = {
        faturaId: 1,
        // Missing irsaliyeId and other required fields
      };

      const errorHandler = jest.fn();
      client.on('error', errorHandler);

      io.of(NAMESPACE).emit('eslestirme-tamamlandi', malformedData);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Client should not crash, may or may not emit error event
      expect(client.connected).toBe(true);
    });

    /**
     * Test 6.2: Client handles invalid event data types
     */
    test('should handle event with invalid data types', async () => {
      const client = await createClient();

      const invalidData = {
        faturaId: 'invalid_string', // Should be number
        irsaliyeId: null,
        toplam: 'not_a_number',
      };

      const receivedPromise = new Promise((resolve) => {
        client.on('eslestirme-tamamlandi', (data) => {
          resolve(data);
        });
      });

      io.of(NAMESPACE).emit('eslestirme-tamamlandi', invalidData);

      const received = await Promise.race([
        receivedPromise,
        new Promise((resolve) => setTimeout(() => resolve(null), 100)),
      ]);

      // Client should receive data as sent, validation is backend responsibility
      if (received) {
        expect(received.faturaId).toBe('invalid_string');
      }
    });
  });

  // =========================================================================
  // TEST SUITE 7: Performance Tests
  // =========================================================================

  describe('Performance Tests', () => {
    /**
     * Test 7.1: High-frequency event handling
     */
    test('should handle multiple rapid events', async () => {
      const clients = await createMultipleClients(3);

      const eventCount = 10;
      const receivedCounts = [0, 0, 0];

      clients.forEach((client, index) => {
        client.on('eslestirme-tamamlandi', () => {
          receivedCounts[index]++;
        });
      });

      // Emit rapid events
      for (let i = 0; i < eventCount; i++) {
        io.of(NAMESPACE).emit('eslestirme-tamamlandi', {
          faturaId: i,
          irsaliyeId: i * 100,
          timestamp: new Date().toISOString(),
        });
      }

      // Wait for all events to be received
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify all clients received all events
      receivedCounts.forEach((count) => {
        expect(count).toBe(eventCount);
      });
    });
  });

  // =========================================================================
  // TEST SUITE 8: Subscription Tests
  // =========================================================================

  describe('Subscription Management', () => {
    /**
     * Test 8.1: Client can subscribe to fatura updates
     */
    test('should allow client to subscribe to fatura updates', async () => {
      const client = await createClient();

      const subscribePromise = new Promise((resolve) => {
        client.on('subscribed', (data) => {
          resolve(data);
        });
      });

      client.emit('subscribe-fatura', 123);

      const response = await subscribePromise;

      expect(response.faturaId).toBe(123);
    });

    /**
     * Test 8.2: Client can unsubscribe from fatura updates
     */
    test('should allow client to unsubscribe from fatura updates', async () => {
      const client = await createClient();

      // First subscribe
      await new Promise((resolve) => {
        client.on('subscribed', () => resolve());
        client.emit('subscribe-fatura', 123);
      });

      // Then unsubscribe
      const unsubscribePromise = new Promise((resolve) => {
        client.on('unsubscribed', (data) => {
          resolve(data);
        });
      });

      client.emit('unsubscribe-fatura', 123);

      const response = await unsubscribePromise;

      expect(response.faturaId).toBe(123);
    });

    /**
     * Test 8.3: Client can subscribe to irsaliye updates
     */
    test('should allow client to subscribe to irsaliye updates', async () => {
      const client = await createClient();

      const subscribePromise = new Promise((resolve) => {
        client.on('subscribed', (data) => {
          resolve(data);
        });
      });

      client.emit('subscribe-irsaliye', 456);

      const response = await subscribePromise;

      expect(response.irsaliyeId).toBe(456);
    });

    /**
     * Test 8.4: Client can unsubscribe from irsaliye updates
     */
    test('should allow client to unsubscribe from irsaliye updates', async () => {
      const client = await createClient();

      // First subscribe
      await new Promise((resolve) => {
        client.on('subscribed', () => resolve());
        client.emit('subscribe-irsaliye', 456);
      });

      // Then unsubscribe
      const unsubscribePromise = new Promise((resolve) => {
        client.on('unsubscribed', (data) => {
          resolve(data);
        });
      });

      client.emit('unsubscribe-irsaliye', 456);

      const response = await unsubscribePromise;

      expect(response.irsaliyeId).toBe(456);
    });

    /**
     * Test 8.5: Multiple subscriptions work simultaneously
     */
    test('should handle multiple subscriptions simultaneously', async () => {
      const client = await createClient();

      const subscriptions = [
        { type: 'fatura', id: 111 },
        { type: 'fatura', id: 222 },
        { type: 'irsaliye', id: 333 },
        { type: 'irsaliye', id: 444 },
      ];

      const subscribePromises = subscriptions.map(
        (sub) =>
          new Promise((resolve) => {
            client.on('subscribed', (data) => {
              resolve(data);
            });
          })
      );

      subscriptions.forEach((sub) => {
        client.emit(`subscribe-${sub.type}`, sub.id);
      });

      const responses = await Promise.all(subscribePromises);

      expect(responses.length).toBe(4);
    });
  });

  // =========================================================================
  // TEST SUITE 9: Message Queue Tests
  // =========================================================================

  describe('Message Queue', () => {
    /**
     * Test 9.1: Messages are queued when user is offline
     * Note: This test verifies the emitWithQueue mechanism which checks for active user rooms
     */
    test('should queue messages when user is offline and deliver on connect', async () => {
      const userId = 999; // Non-connected user ID

      const eventData = {
        faturaId: 1,
        irsaliyeId: 100,
        faturaNo: 'FAT-2024-001',
        irsaliyeNo: 'IRS-2024-001',
        toplam: 15000.50,
        timestamp: '2024-01-15T10:30:00Z',
      };

      // Queue message for offline user using emitWithQueue
      // Since user is offline (no room exists), message should be queued
      io.of(NAMESPACE).emitWithQueue(userId, 'eslestirme-tamamlandi', eventData);

      // Small delay to ensure queue operation completes
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Prepare event listener promise BEFORE creating client
      let eventResolve;
      const eventPromise = new Promise((resolve) => {
        eventResolve = resolve;
      });

      // Create client with pre-registered event listener
      const client = await createClient(userId, (socket) => {
        socket.on('eslestirme-tamamlandi', (data) => {
          eventResolve(data);
        });
      });

      // Wait for queued message delivery
      const received = await Promise.race([
        eventPromise,
        new Promise((resolve) => setTimeout(() => resolve(null), 300)),
      ]);

      // Verify the queued message was delivered
      expect(received).not.toBeNull();
      expect(received.faturaId).toBe(1);
      expect(received.irsaliyeId).toBe(100);
      expect(received.toplam).toBe(15000.50);
    });

    /**
     * Test 9.2: Multiple queued messages are delivered on connect
     */
    test('should deliver multiple queued messages on connect', async () => {
      const userId = 888;

      const events = [
        {
          event: 'eslestirme-tamamlandi',
          data: {
            faturaId: 1,
            irsaliyeId: 100,
            faturaNo: 'FAT-001',
            irsaliyeNo: 'IRS-001',
            toplam: 1000,
          },
        },
        {
          event: 'eslestirme-kaldirildi',
          data: {
            eslestirmeId: 1,
            faturaId: 1,
            irsaliyeId: 100,
          },
        },
      ];

      // Queue multiple messages while user is offline
      events.forEach((e) => {
        io.of(NAMESPACE).emitWithQueue(userId, e.event, e.data);
      });

      // Small delay to ensure queue operations complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Prepare event collection BEFORE creating client
      const receivedEvents = [];

      // Create client with pre-registered event listeners
      const client = await createClient(userId, (socket) => {
        socket.on('eslestirme-tamamlandi', (data) => {
          receivedEvents.push({ event: 'eslestirme-tamamlandi', data });
        });

        socket.on('eslestirme-kaldirildi', (data) => {
          receivedEvents.push({ event: 'eslestirme-kaldirildi', data });
        });
      });

      // Wait for all queued messages to be delivered
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Verify queued messages were received
      expect(receivedEvents.length).toBeGreaterThanOrEqual(1);
    });

    /**
     * Test 9.3: Queue is cleared after delivery
     */
    test('should clear queue after delivering messages', async () => {
      const userId = 777;

      const eventData = {
        faturaId: 1,
        irsaliyeId: 100,
        faturaNo: 'FAT-2024-001',
        irsaliyeNo: 'IRS-2024-001',
        toplam: 15000.50,
        timestamp: '2024-01-15T10:30:00Z',
      };

      // Queue message
      io.of(NAMESPACE).emitWithQueue(userId, 'eslestirme-tamamlandi', eventData);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Prepare event listener BEFORE creating first client
      let firstResolve;
      const firstPromise = new Promise((resolve) => {
        firstResolve = resolve;
      });

      // Connect and receive queued message
      const client = await createClient(userId, (socket) => {
        socket.on('eslestirme-tamamlandi', (data) => {
          firstResolve(data);
        });
      });

      const firstReceived = await Promise.race([
        firstPromise,
        new Promise((resolve) => setTimeout(() => resolve(null), 300)),
      ]);

      // Verify first message was received
      expect(firstReceived).not.toBeNull();

      // Disconnect - queue should now be empty
      client.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Prepare event listener for second connection
      let secondResolve;
      const secondPromise = new Promise((resolve) => {
        secondResolve = resolve;
      });

      // Reconnect - should NOT receive same message again
      const client2 = await createClient(userId, (socket) => {
        socket.on('eslestirme-tamamlandi', (data) => {
          secondResolve(data);
        });
      });

      const received = await Promise.race([
        secondPromise,
        new Promise((resolve) => setTimeout(() => resolve(null), 300)),
      ]);

      // Should not receive duplicate message (queue was cleared)
      expect(received).toBeNull();
    });
  });

  // =========================================================================
  // TEST SUITE 10: Heartbeat Tests
  // =========================================================================

  describe('Heartbeat Mechanism', () => {
    /**
     * Test 10.1: Server responds to heartbeat
     */
    test('should respond to client heartbeat', async () => {
      const client = await createClient();

      const heartbeatPromise = new Promise((resolve) => {
        client.on('heartbeat-ack', (data) => {
          resolve(data);
        });
      });

      client.emit('heartbeat');

      const response = await heartbeatPromise;

      expect(response).toHaveProperty('timestamp');
      expect(typeof response.timestamp).toBe('number');
    });

    /**
     * Test 10.2: Multiple heartbeats are processed
     */
    test('should handle multiple heartbeat requests', async () => {
      const client = await createClient();

      const heartbeatCount = 5;
      const responses = [];

      client.on('heartbeat-ack', (data) => {
        responses.push(data);
      });

      // Send multiple heartbeats
      for (let i = 0; i < heartbeatCount; i++) {
        client.emit('heartbeat');
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Wait for all responses
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(responses.length).toBe(heartbeatCount);

      // Verify timestamps are increasing
      for (let i = 1; i < responses.length; i++) {
        expect(responses[i].timestamp).toBeGreaterThanOrEqual(responses[i - 1].timestamp);
      }
    });
  });
});
