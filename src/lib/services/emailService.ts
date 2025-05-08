import { EmailSettings } from '@/lib/SettingsContext';

// Interface for sending test email
interface SendTestEmailParams {
  settings: EmailSettings;
  recipientEmail: string;
  authToken?: string; // OAuth token from Google authorization
}

/**
 * Sends a test email using the Gmail API
 * This requires the user to authorize the application with their Google account
 */
export const sendTestEmail = async ({ settings, recipientEmail, authToken }: SendTestEmailParams): Promise<boolean> => {
  // Validate required settings
  if (!settings.enabled || !settings.username) {
    throw new Error('Email settings are not properly configured');
  }
  
  // Check if we have an auth token
  if (!authToken) {
    throw new Error('Unauthorized: No authentication token provided');
  }

  try {
    console.log('Sending real email with Gmail API...');
    
    // Create an email template
    const emailTemplate = createTestEmailTemplate(recipientEmail, settings);
    
    // Convert template to RFC 5322 format
    const emailContent = createRFC5322Email({
      from: `${settings.fromName} <${settings.fromEmail}>`,
      to: recipientEmail,
      subject: emailTemplate.subject,
      body: emailTemplate.body
    });
    
    // Base64 encode the email for Gmail API
    const base64EncodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Call Gmail API to send the email
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: base64EncodedEmail
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gmail API error:', errorText);
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
    
    console.log('Email sent successfully through Gmail API');
    return true;
  } catch (error) {
    console.error('Error sending email with Gmail API:', error);
    throw error;
  }
};

// Utility to create RFC 5322 formatted email
function createRFC5322Email({ from, to, subject, body }: { from: string, to: string, subject: string, body: string }): string {
  const mime = 'MIME-Version: 1.0\r\n';
  const contentType = 'Content-Type: text/html; charset=utf-8\r\n';
  const fromHeader = `From: ${from}\r\n`;
  const toHeader = `To: ${to}\r\n`;
  const subjectHeader = `Subject: ${subject}\r\n\r\n`;
  
  return mime + contentType + fromHeader + toHeader + subjectHeader + body;
}

// Structure of a typical email
export interface EmailTemplate {
  subject: string;
  body: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
}

// Structure for email attachments
export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

/**
 * Format of a test email template
 */
export const createTestEmailTemplate = (recipientEmail: string, settings: EmailSettings): EmailTemplate => {
  return {
    subject: 'ClinicFlow - Test Email',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4A6FA5; margin-bottom: 10px;">ClinicFlow</h1>
          <p style="color: #666;">Your Clinic Management Solution</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #333;">Email Configuration Test</h2>
          <p>This is a test email from ClinicFlow to confirm your email settings are working correctly.</p>
          <p><strong>This is a real email sent through Gmail API.</strong></p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333;">Your Email Configuration:</h3>
          <ul style="color: #555; list-style-type: none; padding-left: 0;">
            <li style="padding: 3px 0;">Service: ${settings.service}</li>
            <li style="padding: 3px 0;">From: ${settings.fromName} &lt;${settings.fromEmail}&gt;</li>
            <li style="padding: 3px 0;">Account: ${settings.username}</li>
          </ul>
        </div>
        
        <div style="background-color: #e6f7ff; padding: 15px; border-radius: 5px; border-left: 4px solid #4A6FA5;">
          <p style="margin: 0; color: #333;">If you received this email, your email configuration is working correctly!</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #999; font-size: 12px;">
          <p>This is an automated message from ClinicFlow. Please do not reply to this email.</p>
        </div>
      </div>
    `,
    to: [recipientEmail]
  };
};

// Utility function to safely encode emails for Base64
function safeBase64Encode(text: string): string {
  return btoa(unescape(encodeURIComponent(text)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Function to send email using Gmail API
 */
export const sendEmailWithGmailApi = async (
  emailTemplate: EmailTemplate,
  authToken: string
): Promise<boolean> => {
  if (!emailTemplate.to || emailTemplate.to.length === 0) {
    throw new Error('No recipients specified');
  }
  
  try {
    // Format the email in RFC 5322 format
    const emailContent = createRFC5322Email({
      from: emailTemplate.to[0], // For Gmail API, this should be the user's email
      to: emailTemplate.to.join(', '),
      subject: emailTemplate.subject,
      body: emailTemplate.body
    });
    
    // Base64 encode the email
    const base64EncodedEmail = safeBase64Encode(emailContent);
    
    // Send the email through Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: base64EncodedEmail
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gmail API error:', errorText);
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
    
    console.log('Email sent successfully through Gmail API');
    return true;
  } catch (error) {
    console.error('Error sending email with Gmail API:', error);
    throw error;
  }
};

// Gmail API implementation
export interface GoogleAuthCredentials {
  clientId: string;
  apiKey: string;
  scopes: string[];
}

// Access token received from OAuth flow
export interface GoogleAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
} 