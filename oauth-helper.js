#!/usr/bin/env node

import express from 'express';
import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback';
const PORT = 3000;

// Required scopes for all Google APIs we want to test
const SCOPES = [
  'https://www.googleapis.com/auth/contacts',           // Google Contacts
  'https://www.googleapis.com/auth/drive',              // Google Drive
  'https://www.googleapis.com/auth/calendar',           // Google Calendar
  'https://www.googleapis.com/auth/gmail.modify',       // Gmail
  'https://www.googleapis.com/auth/userinfo.profile',   // User profile
  'https://www.googleapis.com/auth/userinfo.email',     // User email
  'https://www.googleapis.com/auth/adsense',            // AdSense Management API (full access)
  'https://www.googleapis.com/auth/adsense.readonly',   // AdSense Management API (read-only)
  'https://www.googleapis.com/auth/spreadsheets',       // Google Sheets (full access)
  'https://www.googleapis.com/auth/spreadsheets.readonly', // Google Sheets (read-only)
  'https://www.googleapis.com/auth/documents',          // Google Docs (full access)
  'https://www.googleapis.com/auth/documents.readonly', // Google Docs (read-only)
  'https://www.googleapis.com/auth/youtube',            // YouTube Data API (full access)
  'https://www.googleapis.com/auth/youtube.readonly',   // YouTube Data API (read-only)
  'https://www.googleapis.com/auth/youtube.force-ssl',  // YouTube Data API (force SSL)
  'https://www.googleapis.com/auth/yt-analytics.readonly',        // YouTube Analytics (read-only)
  'https://www.googleapis.com/auth/yt-analytics-monetary.readonly' // YouTube Analytics Monetary (read-only)
].join(' ');

class GoogleOAuthHelper {
  constructor() {
    this.app = express();
    this.server = null;
    this.tokens = null;
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow
    };
    console.log(colors[type](`[${type.toUpperCase()}] ${message}`));
  }

  generateAuthUrl() {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      response_type: 'code',
      access_type: 'offline',  // To get refresh token
      prompt: 'consent'        // Force consent screen to get refresh token
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForTokens(authCode) {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: authCode,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      });

      return response.data;
    } catch (error) {
      throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      return response.data;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  async saveTokensToEnv(tokens) {
    const envPath = path.join(__dirname, '.env');
    let envContent = '';

    // Read existing .env file
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add token values
    const updateEnvValue = (key, value) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    };

    updateEnvValue('GOOGLE_ACCESS_TOKEN', tokens.access_token);
    if (tokens.refresh_token) {
      updateEnvValue('GOOGLE_REFRESH_TOKEN', tokens.refresh_token);
    }
    updateEnvValue('TEST_MODE', 'live');

    // Write back to .env file
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    
    this.log('✅ Tokens saved to .env file successfully!', 'success');
  }

  async testTokenScopes(accessToken) {
    try {
      // Test each API endpoint to verify scopes
      const tests = [
        {
          name: 'Google Contacts',
          url: 'https://people.googleapis.com/v1/people/me/connections?pageSize=1&personFields=names',
          icon: '👥'
        },
        {
          name: 'Google Drive',
          url: 'https://www.googleapis.com/drive/v3/about?fields=user',
          icon: '🚀'
        },
        {
          name: 'Google Calendar',
          url: 'https://www.googleapis.com/calendar/v3/calendars/primary',
          icon: '📅'
        },
        {
          name: 'Gmail',
          url: 'https://gmail.googleapis.com/gmail/v1/users/me/profile',
          icon: '📧'
        }
      ];

      this.log('🔍 Testing token scopes...', 'info');
      let successCount = 0;

      for (const test of tests) {
        try {
          await axios.get(test.url, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            timeout: 5000
          });
          this.log(`${test.icon} ${test.name}: ✅ Working`, 'success');
          successCount++;
        } catch (error) {
          const status = error.response?.status;
          if (status === 403) {
            this.log(`${test.icon} ${test.name}: ❌ Insufficient scopes`, 'error');
          } else {
            this.log(`${test.icon} ${test.name}: ⚠️  ${status || 'Error'}`, 'warning');
          }
        }
      }

      return successCount;
    } catch (error) {
      this.log(`Token scope test failed: ${error.message}`, 'error');
      return 0;
    }
  }

  setupExpressRoutes() {
    // Route to start OAuth flow
    this.app.get('/', (req, res) => {
      const authUrl = this.generateAuthUrl();
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google OAuth Helper</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px; }
            .scopes { background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .scope { display: block; margin: 5px 0; }
          </style>
        </head>
        <body>
          <h1>🔐 Google APIs OAuth Helper</h1>
          <p>This will authenticate your app with Google and get access tokens for:</p>
          
          <div class="scopes">
            <div class="scope">👥 <strong>Google Contacts</strong> - Read and manage contacts</div>
            <div class="scope">🚀 <strong>Google Drive</strong> - Read and manage Drive files</div>
            <div class="scope">📅 <strong>Google Calendar</strong> - Read and manage calendars</div>
            <div class="scope">📧 <strong>Gmail</strong> - Read and manage Gmail</div>
            <div class="scope">👤 <strong>User Profile</strong> - Basic profile information</div>
          </div>
          
          <p><strong>Click the button below to start the OAuth flow:</strong></p>
          <a href="${authUrl}" class="button">🚀 Authenticate with Google</a>
          
          <p><small>After authentication, you'll be redirected back here with your tokens.</small></p>
        </body>
        </html>
      `);
    });

    // OAuth callback route
    this.app.get('/auth/callback', async (req, res) => {
      const { code, error } = req.query;

      if (error) {
        this.log(`OAuth error: ${error}`, 'error');
        return res.send(`
          <h1>❌ Authentication Failed</h1>
          <p>Error: ${error}</p>
          <p><a href="/">Try again</a></p>
        `);
      }

      if (!code) {
        this.log('No authorization code received', 'error');
        return res.send(`
          <h1>❌ No Authorization Code</h1>
          <p><a href="/">Try again</a></p>
        `);
      }

      try {
        this.log('📝 Exchanging authorization code for tokens...', 'info');
        const tokens = await this.exchangeCodeForTokens(code);
        
        this.log('💾 Saving tokens to .env file...', 'info');
        await this.saveTokensToEnv(tokens);
        
        this.log('🧪 Testing token scopes...', 'info');
        const successCount = await this.testTokenScopes(tokens.access_token);
        
        this.tokens = tokens;

        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authentication Success</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .success { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; padding: 15px; margin: 20px 0; }
              .info { background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; padding: 15px; margin: 20px 0; }
              .tokens { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin: 20px 0; font-family: monospace; font-size: 12px; word-break: break-all; }
            </style>
          </head>
          <body>
            <h1>🎉 Authentication Successful!</h1>
            
            <div class="success">
              <strong>✅ Access token obtained and saved to .env file</strong><br>
              📊 API Scope Tests: ${successCount}/4 passed
            </div>
            
            <div class="info">
              <strong>🔧 Next Steps:</strong><br>
              1. Close this browser window<br>
              2. Go back to your terminal<br>
              3. Run: <code>bun run test:contacts-advanced</code><br>
              4. Or run: <code>bun run test:drive-advanced</code>
            </div>
            
            <div class="tokens">
              <strong>Token Info:</strong><br>
              Access Token: ${tokens.access_token.substring(0, 20)}...<br>
              ${tokens.refresh_token ? `Refresh Token: ${tokens.refresh_token.substring(0, 20)}...<br>` : ''}
              Expires In: ${tokens.expires_in} seconds<br>
              Scope: ${tokens.scope || 'Multiple scopes granted'}
            </div>
            
            <p><small>You can now close this window and return to your terminal to run the API tests.</small></p>
          </body>
          </html>
        `);

        // Auto-shutdown server after successful auth
        setTimeout(() => {
          this.log('🛑 Shutting down OAuth server...', 'info');
          this.shutdown();
        }, 2000);

      } catch (error) {
        this.log(`Token exchange failed: ${error.message}`, 'error');
        res.send(`
          <h1>❌ Token Exchange Failed</h1>
          <p>Error: ${error.message}</p>
          <p><a href="/">Try again</a></p>
        `);
      }
    });
  }

  async start() {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      this.log('❌ Missing Google OAuth credentials in .env file', 'error');
      this.log('Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set', 'warning');
      process.exit(1);
    }

    this.setupExpressRoutes();

    return new Promise((resolve) => {
      this.server = this.app.listen(PORT, () => {
        this.log(`🚀 OAuth server started on http://localhost:${PORT}`, 'success');
        this.log('', 'info');
        this.log('🌐 Open your browser and go to:', 'info');
        this.log(`   http://localhost:${PORT}`, 'success');
        this.log('', 'info');
        this.log('📋 This will authenticate you with Google and get tokens for:', 'info');
        this.log('   • Google Contacts API', 'info');
        this.log('   • Google Drive API', 'info');
        this.log('   • Google Calendar API', 'info');
        this.log('   • Gmail API', 'info');
        this.log('', 'info');
        this.log('⏹️  Press Ctrl+C to stop the server', 'warning');
        resolve();
      });
    });
  }

  shutdown() {
    if (this.server) {
      this.server.close(() => {
        this.log('✅ OAuth server stopped', 'success');
        process.exit(0);
      });
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n');
  process.exit(0);
});

// Main execution
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith('/oauth-helper.js') ||
                     process.argv[1].endsWith('oauth-helper.js');

if (isMainModule) {
  const oauthHelper = new GoogleOAuthHelper();
  oauthHelper.start().catch(error => {
    console.error(chalk.red('Failed to start OAuth server:'), error);
    process.exit(1);
  });
}

export default GoogleOAuthHelper; 