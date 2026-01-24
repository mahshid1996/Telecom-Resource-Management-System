const nodemailer = require('nodemailer');
const { sendEmail } = require('../../services/emailService');

jest.mock('nodemailer');

describe('Unit Test: emailService', () => {
  let mockSendMail;
  let mockTransporter;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockSendMail = jest.fn();
    mockTransporter = { sendMail: mockSendMail };
    nodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });



  it('should handle error when sending email fails', async () => {
    const mockError = new Error('SMTP connection failed');
    mockSendMail.mockRejectedValue(mockError);

    await expect(sendEmail('mahshid@example.com', 'Fail Test', 'Fail Subject')).rejects.toThrow('SMTP connection failed');
  });
});
