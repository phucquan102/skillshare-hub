const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify transporter configuration
    this.verifyTransporter();
  }

  async verifyTransporter() {
    try {
      await this.transporter.verify();
      console.log('✅ Email transporter is ready');
    } catch (error) {
      console.error('❌ Email transporter failed:', error);
    }
  }

  async sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Verify Your Email - Skillshare Hub',
      html: this.getVerificationTemplate(user.fullName, verificationUrl),
    };

    return await this.sendEmail(mailOptions);
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Reset Your Password - EduPress',
      html: this.getPasswordResetTemplate(user.fullName, resetUrl),
    };

    return await this.sendEmail(mailOptions);
  }

  async sendPasswordResetConfirmationEmail(user) {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Password Reset Confirmation - EduPress',
      html: this.getPasswordResetConfirmationTemplate(user.fullName),
    };

    return await this.sendEmail(mailOptions);
  }

  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Welcome to EduPress!',
      html: this.getWelcomeTemplate(user.fullName),
    };

    return await this.sendEmail(mailOptions);
  }

  async sendEmail(mailOptions) {
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent:', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        messageId: info.messageId
      });
      return { 
        success: true, 
        messageId: info.messageId,
        response: info.response 
      };
    } catch (error) {
      console.error('❌ Email sending failed:', {
        to: mailOptions.to,
        error: error.message
      });
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  getVerificationTemplate(name, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: linear-gradient(135deg, #7C3AED, #4F46E5); padding: 30px; text-align: center; color: white; }
          .content { padding: 30px; background: #f8fafc; line-height: 1.6; }
          .button { background: #7C3AED; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .code { background: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to EduPress!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for registering with EduPress. To complete your registration, please verify your email address:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button" style="color: white;">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <div class="code">${verificationUrl}</div>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 EduPress. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetTemplate(name, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: linear-gradient(135deg, #DC2626, #EF4444); padding: 30px; text-align: center; color: white; }
          .content { padding: 30px; background: #f8fafc; line-height: 1.6; }
          .button { background: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .code { background: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>You requested to reset your password. Click the button below:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button" style="color: white;">Reset Password</a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <div class="code">${resetUrl}</div>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 EduPress. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetConfirmationTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center; color: white; }
          .content { padding: 30px; background: #f8fafc; line-height: 1.6; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Successful</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your password has been successfully reset.</p>
            <p>If you did not perform this action, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 EduPress. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getWelcomeTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center; color: white; }
          .content { padding: 30px; background: #f8fafc; line-height: 1.6; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to EduPress!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your account has been successfully verified and you're now part of our learning community!</p>
            <p>Here's what you can do next:</p>
            <ul>
              <li>Explore our course catalog</li>
              <li>Complete your profile</li>
              <li>Join learning communities</li>
              <li>Start your first course</li>
            </ul>
            <p>We're excited to have you on board!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 EduPress. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();