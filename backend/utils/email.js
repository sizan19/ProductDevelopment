// ============================================================
// email.js — Send emails via Gmail using Nodemailer
// ============================================================

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send the OTP email to the user
async function sendOTPEmail(toEmail, username, otp) {
  const mailOptions = {
    from:    `"Auth System" <${process.env.EMAIL_USER}>`,
    to:      toEmail,
    subject: 'Your OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto;
                  border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
        <h2 style="color: #16a34a; margin-top: 0;">One-Time Password</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>Your login OTP code is:</p>
        <div style="font-size: 2rem; font-weight: bold; letter-spacing: 8px;
                    color: #16a34a; text-align: center; padding: 16px 0;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 0.9rem;">
          This code expires in <strong>5 minutes</strong>.<br/>
          If you did not request this, please ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Send the Change Password Link email
async function sendChangePasswordLink(toEmail, username, link) {
  const mailOptions = {
    from:    `"Auth System" <${process.env.EMAIL_USER}>`,
    to:      toEmail,
    subject: 'Password Change Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto;
                  border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
        <h2 style="color: #1d4ed8; margin-top: 0;">Change Your Password</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>You requested to change your password. Click the secure link below to set a new password:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${link}" style="background-color: #1d4ed8; color: white; padding: 12px 24px;
                                   text-decoration: none; border-radius: 6px; font-weight: bold;">
            Set New Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 0.9rem;">
          This link expires in <strong>15 minutes</strong>.<br/>
          If you did not request this, please ignore this email and your password will remain unchanged.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Send a new device login alert email
async function sendNewDeviceAlert(toEmail, username, deviceInfo, ipAddress, loginTime) {
  const timeStr = new Date(loginTime).toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  const mailOptions = {
    from:    `"Auth System" <${process.env.EMAIL_USER}>`,
    to:      toEmail,
    subject: 'New Device Login Detected',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 440px; margin: auto;
                  border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
        <h2 style="color: #ea580c; margin-top: 0;">New Device Login</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>We detected a new login to your account from a device we haven't seen before:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.9rem;">
          <tr>
            <td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; width: 100px;">Device</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${deviceInfo}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600;">IP Address</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-family: monospace;">${ipAddress}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600;">Time</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${timeStr}</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 0.9rem;">
          If this was you, no action is needed.<br/>
          If you don't recognize this login, please <strong>change your password immediately</strong>
          and log out of all devices from your dashboard.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOTPEmail, sendChangePasswordLink, sendNewDeviceAlert };
