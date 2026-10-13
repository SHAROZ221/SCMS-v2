const nodemailer = require('nodemailer');
const { Notification } = require('../models');

// Configure mail transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER || 'mock_user',
    pass: process.env.SMTP_PASS || 'mock_pass',
  },
});

/**
 * Sends and logs an email/SMS notification
 */
async function sendNotification({ ticketId = null, customerId = null, recipient, subject, message, type = 'EMAIL' }) {
  let record = null;
  try {
    record = await Notification.create({
      ticket_id: ticketId,
      customer_id: customerId,
      type,
      recipient,
      subject,
      message,
      status: 'PENDING',
      sent_at: null,
    });

    if (type === 'EMAIL' && recipient) {
      if (process.env.NODE_ENV !== 'test' && process.env.SMTP_USER && process.env.SMTP_USER !== 'test_user') {
        await transporter.sendMail({
          from: process.env.FROM_EMAIL || 'noreply@scms.com',
          to: recipient,
          subject,
          text: message,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #212529;">
            <h2 style="color: #1428A0;">Samsung Care - Service Center Management</h2>
            <p>${message.replace(/\n/g, '<br/>')}</p>
            <hr style="border: 1px solid #E9ECEF; margin: 20px 0;" />
            <small style="color: #6C757D;">This is an automated notification from SCMS.</small>
          </div>`,
        });
      }
    }

    record.status = 'SENT';
    record.sent_at = new Date();
    await record.save();
    return record;
  } catch (err) {
    console.warn(`[NotificationService] Delivery note: ${err.message}`);
    if (record) {
      record.status = 'FAILED';
      await record.save().catch(() => {});
    }
    return record;
  }
}

module.exports = {
  sendNotification,
};
