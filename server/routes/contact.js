const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// POST /api/contact - Send contact form email
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    if (!firstName || !email || !message) {
      return res.status(400).json({
        success: false,
        error: { message: 'First name, email and message are required' }
      });
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Email to admin
    await transporter.sendMail({
      from: `"NutriOptima Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // aimenm861@gmail.com
      replyTo: email,
      subject: `📬 Contact Form: ${subject || 'New Message'} — from ${firstName} ${lastName || ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #16a34a, #059669); padding: 24px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 22px;">🥗 NutriOptima — New Contact Message</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 10px; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px; width: 120px;">Name</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #111827;">${firstName} ${lastName || ''}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #111827;"><a href="mailto:${email}" style="color: #16a34a;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">Subject</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #111827;">${subject || 'No subject'}</td>
              </tr>
            </table>
            <div style="margin-top: 20px;">
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">Message:</p>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</div>
            </div>
            <div style="margin-top: 20px; padding: 12px; background: #ecfdf5; border-radius: 8px; border: 1px solid #bbf7d0;">
              <p style="color: #166534; font-size: 13px; margin: 0;">💡 Reply directly to this email to respond to ${firstName}.</p>
            </div>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">NutriOptima — AI-Powered Nutrition Platform</p>
        </div>
      `
    });

    // Auto-reply to sender
    await transporter.sendMail({
      from: `"NutriOptima" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ We received your message — NutriOptima`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #16a34a, #059669); padding: 24px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 8px;">🥗</div>
            <h1 style="color: white; margin: 0; font-size: 22px;">Thanks for reaching out!</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 10px; border: 1px solid #e5e7eb;">
            <p style="color: #374151; font-size: 16px;">Hi <strong>${firstName}</strong>,</p>
            <p style="color: #6b7280; line-height: 1.6;">We've received your message and will get back to you within 24 hours.</p>
            <div style="background: #f9fafb; border-left: 4px solid #16a34a; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0;">Your message:</p>
              <p style="color: #374151; margin: 0; font-style: italic;">"${message.substring(0, 200)}${message.length > 200 ? '...' : ''}"</p>
            </div>
            <p style="color: #6b7280;">Best regards,<br/><strong style="color: #16a34a;">NutriOptima Team</strong></p>
          </div>
        </div>
      `
    });

    res.json({ success: true, message: 'Message sent successfully!' });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to send message. Please try again.' }
    });
  }
});

module.exports = router;
