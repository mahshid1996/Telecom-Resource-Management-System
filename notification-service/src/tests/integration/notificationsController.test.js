const request = require('supertest');
const app = require('../../app');
const notificationQueue = require('../../queues/notificationQueue');

jest.mock('../../queues/notificationQueue', () => ({
  add: jest.fn().mockResolvedValue({ id: 'mock-job-id' })
}));

describe('Integration Test: Notifications Controller', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create notification successfully', async () => {
    const notificationData = {
      emailLists: ['test@example.com'],
      body: 'Test notification body',
      subject: 'Test Subject'
    };

    const response = await request(app)
      .post('/v1/notifications')
      .send(notificationData)
      .expect(200);

    expect(response.body.message).toBe('Notification queued!');
    expect(response.body.notification.emailLists).toContain('test@example.com');
    expect(response.body.notification.subject).toBe('Test Subject');

    expect(notificationQueue.add).toHaveBeenCalled();
  });

  it('should return 400 for invalid email', async () => {
    const response = await request(app)
      .post('/v1/notifications')
      .send({
        emailLists: ['invalid-email'],
        body: 'Test body'
      })
      .expect(400);

    expect(response.body.error).toContain('email');
  });

  it('should return 400 for missing body', async () => {
    const response = await request(app)
      .post('/v1/notifications')
      .send({
        emailLists: ['test@example.com']
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });
});
