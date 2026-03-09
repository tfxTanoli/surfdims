import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message, recipient } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const targetEmail = recipient || 'info@surfdims.com';

  // Check if SMTP credentials are provided
  if (!process.env.CONTACT_EMAIL_USER || !process.env.CONTACT_EMAIL_PASS) {
    console.warn('SMTP credentials missing. Email not sent, but request received.');
    // We return 200 to the client to not show an error, but log it on server
    // In a real app, you'd want to handle this better
    return res.status(200).json({ success: true, message: 'Message received (Simulation mode: SMTP missing)' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Or your preferred service
      auth: {
        user: process.env.CONTACT_EMAIL_USER,
        pass: process.env.CONTACT_EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.CONTACT_EMAIL_USER,
      to: targetEmail,
      subject: `[Contact Form] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      replyTo: email,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
