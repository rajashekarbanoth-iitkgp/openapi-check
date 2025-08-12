#!/usr/bin/env bun

import express from 'express';
import axios from 'axios';
import fs from 'fs';
import chalk from 'chalk';

class ZendeskOAuthCallbackServer {
  constructor() {
    this.port = 3000;
    this.server = null;
    this.loadCredentials();
  }

  // Load credentials from env.ids
  loadCredentials() {
    try {
      const envContent = fs.readFileSync('env.ids', 'utf8');
      
      const secretMatch = envContent.match(/ZENDESK_SECRET=([^\n]+)/);
      const clientIdMatch = envContent.match(/ZENDESK_CLIENT_ID=([^\n]+)/);
      const subdomainMatch = envContent.match(/ZENDESK_SUBDOMAIN\s*=\s*([^\n]+)/);
      
      if (secretMatch && clientIdMatch && subdomainMatch) {
        this.clientSecret = secretMatch[1].trim();
        this.clientId = clientIdMatch[1].trim();
        this.subdomain = subdomainMatch[1].trim();
        
        // Debug: Show what we found
        console.log(chalk.gray('Debug - Found credentials:'));
        console.log(chalk.gray(`   SECRET: ${this.clientSecret.substring(0, 8)}...`));
        console.log(chalk.gray(`   CLIENT_ID: ${this.clientId}`));
        console.log(chalk.gray(`   SUBDOMAIN: ${this.subdomain}`));
        
        console.log(chalk.green('✅ Zendesk credentials loaded successfully'));
        console.log(chalk.gray(`   Subdomain: ${this.subdomain}`));
        console.log(chalk.gray(`   Client ID: ${this.clientId}`));
        console.log(chalk.gray(`   Client Secret: ${this.clientSecret.substring(0, 8)}...`));
      } else {
        throw new Error('Missing required credentials in env.ids');
      }
    } catch (error) {
      console.error(chalk.red('❌ Error loading Zendesk credentials:'), error.message);
      process.exit(1);
    }
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(authorizationCode) {
    try {
      console.log(chalk.yellow('\n🔄 Exchanging authorization code for tokens...'));
      
      const tokenUrl = `${this.subdomain}/oauth/tokens`;
      const requestBody = {
        grant_type: 'authorization_code',
        code: authorizationCode,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: 'http://localhost:3000/callback'
      };

      const response = await axios.post(tokenUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.access_token) {
        console.log(chalk.green('✅ Token exchange successful!'));
        console.log(chalk.gray(`   Access Token: ${response.data.access_token.substring(0, 20)}...`));
        if (response.data.refresh_token) {
          console.log(chalk.gray(`   Refresh Token: ${response.data.refresh_token.substring(0, 20)}...`));
        }
        console.log(chalk.gray(`   Token Type: ${response.data.token_type}`));
        console.log(chalk.gray(`   Expires In: ${response.data.expires_in} seconds`));
        
        return response.data;
      } else {
        console.log(chalk.red('❌ Token exchange failed - no access token received'));
        return null;
      }
    } catch (error) {
      console.error(chalk.red('❌ Token exchange error:'));
      if (error.response) {
        console.error(chalk.red(`   Status: ${error.response.status}`));
        console.error(chalk.red(`   Error: ${JSON.stringify(error.response.data, null, 2)}`));
      } else {
        console.error(chalk.red(`   Error: ${error.message}`));
      }
      return null;
    }
  }

  // Test the access token
  async testAccessToken(accessToken) {
    try {
      console.log(chalk.yellow('\n🧪 Testing access token with Zendesk API...'));
      
      const testUrl = `${this.subdomain}/api/v2/users/me.json`;
      
      const response = await axios.get(testUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        console.log(chalk.green('✅ Access token test successful!'));
        console.log(chalk.gray('   API Response:'));
        console.log(chalk.gray(`   - User ID: ${response.data.user.id}`));
        console.log(chalk.gray(`   - Name: ${response.data.user.name}`));
        console.log(chalk.gray(`   - Email: ${response.data.user.email}`));
        console.log(chalk.gray(`   - Role: ${response.data.user.role}`));
        return true;
      } else {
        console.log(chalk.red(`❌ Access token test failed - Status: ${response.status}`));
        return false;
      }
    } catch (error) {
      console.error(chalk.red('❌ Access token test error:'));
      if (error.response) {
        console.error(chalk.red(`   Status: ${error.response.status}`));
        console.error(chalk.red(`   Error: ${JSON.stringify(error.response.data, null, 2)}`));
      } else {
        console.error(chalk.red(`   Error: ${error.message}`));
      }
      return false;
    }
  }

  // Save tokens to file
  saveTokens(tokenData) {
    const saveData = {
      timestamp: new Date().toISOString(),
      subdomain: this.subdomain,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in
    };

    try {
      fs.writeFileSync('zendesk-oauth-tokens.json', JSON.stringify(saveData, null, 2));
      console.log(chalk.green('💾 Tokens saved to: zendesk-oauth-tokens.json'));
    } catch (error) {
      console.error(chalk.red('❌ Error saving tokens:'), error.message);
    }
  }

  // Start the callback server
  startServer() {
    const app = express();

    app.get('/callback', async (req, res) => {
      const { code, state, error } = req.query;

      console.log(chalk.blue('\n🔐 Zendesk OAuth Callback Received'));
      console.log(chalk.gray('====================================='));

      if (error) {
        console.log(chalk.red(`❌ OAuth Error: ${error}`));
        res.send(`
          <html>
            <head><title>Zendesk OAuth Error</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #d32f2f;">❌ OAuth Authorization Failed</h2>
                <p><strong>Error:</strong> ${error}</p>
                <p>Please try again or check your Zendesk OAuth app configuration.</p>
                <button onclick="window.close()" style="background: #d32f2f; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Close Window</button>
              </div>
            </body>
          </html>
        `);
        return;
      }

      if (!code) {
        console.log(chalk.red('❌ No authorization code received'));
        res.send(`
          <html>
            <head><title>Zendesk OAuth Error</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #d32f2f;">❌ No Authorization Code</h2>
                <p>No authorization code was received from Zendesk.</p>
                <p>Please try the OAuth flow again.</p>
                <button onclick="window.close()" style="background: #d32f2f; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Close Window</button>
              </div>
            </body>
          </html>
        `);
        return;
      }

      console.log(chalk.green(`✅ Authorization code received: ${code.substring(0, 20)}...`));
      if (state) {
        console.log(chalk.gray(`   State: ${state}`));
      }

      // Exchange code for tokens
      const tokenData = await this.exchangeCodeForTokens(code);
      
      if (tokenData) {
        // Test the access token
        const testResult = await this.testAccessToken(tokenData.access_token);
        
        if (testResult) {
          // Save tokens
          this.saveTokens(tokenData);
          
          // Send success response
          res.send(`
            <html>
              <head><title>Zendesk OAuth Success</title></head>
              <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <h2 style="color: #4caf50;">✅ OAuth Authorization Successful!</h2>
                  <p><strong>Status:</strong> Access token obtained and tested successfully</p>
                  <p><strong>User:</strong> ${tokenData.user_name || 'Unknown'}</p>
                  <p><strong>Token Type:</strong> ${tokenData.token_type}</p>
                  <p><strong>Expires In:</strong> ${tokenData.expires_in} seconds</p>
                  <p style="color: #666; font-size: 14px;">Tokens have been saved to zendesk-oauth-tokens.json</p>
                  <button onclick="window.close()" style="background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Close Window</button>
                </div>
              </body>
            </html>
          `);
        } else {
          res.send(`
            <html>
              <head><title>Zendesk OAuth Warning</title></head>
              <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <h2 style="color: #ff9800;">⚠️ OAuth Partially Successful</h2>
                  <p>Access token was obtained but API test failed.</p>
                  <p>Tokens have been saved, but you may need to check your Zendesk permissions.</p>
                  <button onclick="window.close()" style="background: #ff9800; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Close Window</button>
                </div>
              </body>
            </html>
          `);
        }
      } else {
        res.send(`
          <html>
            <head><title>Zendesk OAuth Error</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #d32f2f;">❌ Token Exchange Failed</h2>
                <p>Failed to exchange authorization code for access token.</p>
                <p>Please check your Zendesk OAuth app configuration and try again.</p>
                <button onclick="window.close()" style="background: #d32f2f; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Close Window</button>
              </div>
            </body>
          </html>
        `);
      }
    });

    app.get('/', (req, res) => {
      res.send(`
        <html>
          <head><title>Zendesk OAuth Callback Server</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2>🔐 Zendesk OAuth Callback Server</h2>
              <p>This server is running and ready to handle OAuth callbacks from Zendesk.</p>
              <p><strong>Status:</strong> ✅ Running on port ${this.port}</p>
              <p><strong>Callback URL:</strong> http://localhost:${this.port}/callback</p>
              <p style="color: #666; font-size: 14px;">Keep this server running while testing OAuth flow</p>
            </div>
          </body>
        </html>
      `);
    });

    this.server = app.listen(this.port, () => {
      console.log(chalk.green(`🚀 Zendesk OAuth callback server started on port ${this.port}`));
      console.log(chalk.gray(`   Callback URL: http://localhost:${this.port}/callback`));
      console.log(chalk.gray(`   Server URL: http://localhost:${this.port}`));
      console.log(chalk.yellow('\n💡 Keep this server running while testing OAuth flow'));
    });
  }

  // Stop the server
  stopServer() {
    if (this.server) {
      this.server.close(() => {
        console.log(chalk.gray('🛑 Zendesk OAuth callback server stopped'));
      });
    }
  }
}

// Start the server
const server = new ZendeskOAuthCallbackServer();
server.startServer();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Shutting down Zendesk OAuth callback server...'));
  server.stopServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n🛑 Shutting down Zendesk OAuth callback server...'));
  server.stopServer();
  process.exit(0);
});
