# Setting Up Gmail API for ClinicFlow

This guide will walk you through the steps needed to configure the Gmail API for email sending in ClinicFlow.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Give it a name such as "ClinicFlow"

## Step 2: Enable the Gmail API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Gmail API" and select it
3. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace)
3. Fill in the required application information:
   - App name: ClinicFlow
   - User support email: your email
   - Developer contact information: your email
4. Click "Save and Continue"
5. On the Scopes page, click "Add or Remove Scopes"
6. Add the scope: `https://www.googleapis.com/auth/gmail.send`
7. Click "Save and Continue"
8. Add test users (your email address) if you're still in testing mode
9. Complete the registration process

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application" as the application type
4. Give it a name such as "ClinicFlow Web Client"
5. Add authorized JavaScript origins:
   - For development: `http://localhost:5173` (or your dev server URL)
   - For production: Your production domain
6. Add authorized redirect URIs:
   - For development: `http://localhost:5173` (or your dev server URL)
   - For production: Your production domain
7. Click "Create"
8. Note down the Client ID and Client Secret

## Step 5: Update the Application with Your Credentials

1. In your ClinicFlow application, navigate to `src/main.tsx`
2. Replace `YOUR_GOOGLE_CLIENT_ID` with the Client ID you obtained:

```tsx
const GOOGLE_CLIENT_ID = "your-actual-client-id.apps.googleusercontent.com";
```

## Step 6: Complete the Gmail API Implementation

Once you've set up the Google Cloud project and obtained the credentials, the final step is to implement the actual API calls to send emails.

This will involve:

1. Obtaining an access token from the OAuth flow
2. Using the token to make requests to the Gmail API
3. Formatting the email in the proper MIME format
4. Sending the email via the Gmail API's `users.messages.send` endpoint

## Important Security Considerations

- The Gmail API tokens are sensitive and should be handled securely
- The application should only request the minimum scopes needed (in this case, `gmail.send`)
- Consider implementing token refresh logic for long-lived sessions
- Be mindful of Gmail's rate limits and quotas

## Resources

- [Gmail API Documentation](https://developers.google.com/gmail/api/guides)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [React OAuth Google Library Documentation](https://github.com/MomenSherif/react-oauth/google)

---

With this setup, you'll be able to send emails directly from the browser using the Gmail API, without requiring a backend server. 