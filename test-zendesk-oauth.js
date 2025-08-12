#!/usr/bin/env bun

import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class ZendeskOAuthTester {
  constructor() {
    this.loadCredentials();
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Load credentials from env.ids
  loadCredentials() {
    try {
      const envContent = fs.readFileSync('env.ids', 'utf8');
      
      // Parse the env.ids file manually to extract values
      const secretMatch = envContent.match(/ZENDESK_SECRET=([^\n]+)/);
      const apiTokenMatch = envContent.match(/ZENDESK_API_TOKEN=([^\n]+)/);
      const clientIdMatch = envContent.match(/ZENDESK_CLIENT_ID=([^\n]+)/);
      const subdomainMatch = envContent.match(/ZENDESK_SUBDOMAIN\s*=\s*([^\n]+)/);
      
      if (secretMatch && apiTokenMatch && clientIdMatch && subdomainMatch) {
        this.clientSecret = secretMatch[1].trim();
        this.apiToken = apiTokenMatch[1].trim();
        this.clientId = clientIdMatch[1].trim();
        this.subdomain = subdomainMatch[1].trim();
        
        // Debug: Show what we found
        console.log(chalk.gray('Debug - Found credentials:'));
        console.log(chalk.gray(`   SECRET: ${this.clientSecret.substring(0, 8)}...`));
        console.log(chalk.gray(`   API_TOKEN: ${this.apiToken.substring(0, 8)}...`));
        console.log(chalk.gray(`   CLIENT_ID: ${this.clientId}`));
        console.log(chalk.gray(`   SUBDOMAIN: ${this.subdomain}`));
        
        console.log(chalk.green('✅ Zendesk credentials loaded successfully'));
        console.log(chalk.gray(`   Subdomain: ${this.subdomain}`));
        console.log(chalk.gray(`   Client ID: ${this.clientId}`));
        console.log(chalk.gray(`   Client Secret: ${this.clientSecret.substring(0, 8)}...`));
        console.log(chalk.gray(`   API Token: ${this.apiToken.substring(0, 8)}...`));
      } else {
        console.log(chalk.red('❌ Missing credentials. Found:'));
        console.log(chalk.gray(`   SECRET: ${secretMatch ? '✅' : '❌'}`));
        console.log(chalk.gray(`   API_TOKEN: ${apiTokenMatch ? '✅' : '❌'}`));
        console.log(chalk.gray(`   CLIENT_ID: ${clientIdMatch ? '✅' : '❌'}`));
        console.log(chalk.gray(`   ZENDESK_SUBDOMAIN: ${subdomainMatch ? '✅' : '❌'}`));
        throw new Error('Missing required credentials in env.ids');
      }
    } catch (error) {
      console.error(chalk.red('❌ Error loading Zendesk credentials:'), error.message);
      process.exit(1);
    }
  }

  // Generate OAuth authorization URL
  generateAuthUrl() {
    const redirectUri = 'http://localhost:3000/callback';
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri
    });

    const authUrl = `${this.subdomain}/oauth/authorizations/new?${params.toString()}`;
    
    console.log(chalk.blue('\n🔐 Zendesk OAuth Authorization URL:'));
    console.log(chalk.gray('====================================='));
    console.log(chalk.cyan(authUrl));
    console.log(chalk.gray('\n📋 Simple Parameters:'));
    console.log(chalk.gray(`   Response Type: code`));
    console.log(chalk.gray(`   Client ID: ${this.clientId}`));
    console.log(chalk.gray(`   Redirect URI: ${redirectUri}`));
    
    return authUrl;
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
        this.accessToken = response.data.access_token;
        this.refreshToken = response.data.refresh_token;
        
        console.log(chalk.green('✅ Token exchange successful!'));
        console.log(chalk.gray(`   Access Token: ${this.accessToken.substring(0, 20)}...`));
        if (this.refreshToken) {
          console.log(chalk.gray(`   Refresh Token: ${this.refreshToken.substring(0, 20)}...`));
        }
        console.log(chalk.gray(`   Token Type: ${response.data.token_type}`));
        console.log(chalk.gray(`   Expires In: ${response.data.expires_in} seconds`));
        
        return true;
      } else {
        console.log(chalk.red('❌ Token exchange failed - no access token received'));
        return false;
      }
    } catch (error) {
      console.error(chalk.red('❌ Token exchange error:'));
      if (error.response) {
        console.error(chalk.red(`   Status: ${error.response.status}`));
        console.error(chalk.red(`   Error: ${JSON.stringify(error.response.data, null, 2)}`));
      } else {
        console.error(chalk.red(`   Error: ${error.message}`));
      }
      return false;
    }
  }

  // Test the access token by making a test API call
  async testAccessToken() {
    if (!this.accessToken) {
      console.log(chalk.red('❌ No access token available for testing'));
      return false;
    }

    try {
      console.log(chalk.yellow('\n🧪 Testing access token with Zendesk API...'));
      
      // Test with a simple endpoint - get current user info
      const testUrl = `${this.subdomain}/api/v2/users/me.json`;
      
      const response = await axios.get(testUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
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

  // Test additional Zendesk API endpoints
  async testAdditionalEndpoints() {
    if (!this.accessToken) {
      console.log(chalk.red('❌ No access token available for endpoint testing'));
      return;
    }

    console.log(chalk.yellow('\n🧪 Testing additional Zendesk API endpoints...'));
    
    const endpoints = [
      { name: 'Tickets', url: '/api/v2/tickets.json', method: 'GET' },
      { name: 'Users', url: '/api/v2/users.json', method: 'GET' },
      { name: 'Organizations', url: '/api/v2/organizations.json', method: 'GET' },
      { name: 'Groups', url: '/api/v2/groups.json', method: 'GET' },
      { name: 'Ticket Fields', url: '/api/v2/ticket_fields.json', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(chalk.gray(`   Testing ${endpoint.name}...`));
        
        const response = await axios.get(`${this.subdomain}${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 200) {
          console.log(chalk.green(`   ✅ ${endpoint.name} - Success (${response.status})`));
          if (response.data.count !== undefined) {
            console.log(chalk.gray(`      Count: ${response.data.count}`));
          }
        } else {
          console.log(chalk.red(`   ❌ ${endpoint.name} - Failed (${response.status})`));
        }
      } catch (error) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          console.log(chalk.red(`   ❌ ${endpoint.name} - No Access (${status})`));
        } else if (status === 404) {
          console.log(chalk.red(`   ❌ ${endpoint.name} - Not Found (404)`));
        } else {
          console.log(chalk.red(`   ❌ ${endpoint.name} - Error (${status || 'Network'})`));
        }
      }
    }
  }

  // Save tokens to file
  saveTokens() {
    if (!this.accessToken) {
      console.log(chalk.yellow('⚠️  No tokens to save'));
      return;
    }

    const tokenData = {
      timestamp: new Date().toISOString(),
      subdomain: this.subdomain,
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      tokenType: 'Bearer'
    };

    try {
      fs.writeFileSync('zendesk-oauth-tokens.json', JSON.stringify(tokenData, null, 2));
      console.log(chalk.green('💾 Tokens saved to: zendesk-oauth-tokens.json'));
    } catch (error) {
      console.error(chalk.red('❌ Error saving tokens:'), error.message);
    }
  }

  // Open browser with authorization URL
  async openBrowser(url) {
    try {
      const platform = process.platform;
      let command;
      
      if (platform === 'darwin') {
        command = `open "${url}"`;
      } else if (platform === 'win32') {
        command = `start "${url}"`;
      } else {
        command = `xdg-open "${url}"`;
      }
      
      await execAsync(command);
      console.log(chalk.green('🌐 Opened authorization URL in browser'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not open browser automatically'));
      console.log(chalk.yellow('   Please copy and paste the URL manually'));
    }
  }

  // Start the OAuth flow
  async startOAuthFlow() {
    console.log(chalk.bold.blue('🚀 Starting Zendesk OAuth Flow'));
    console.log(chalk.gray('=====================================\n'));

    // Generate and display authorization URL
    const authUrl = this.generateAuthUrl();
    
    // Ask user if they want to open browser
    console.log(chalk.yellow('\n❓ Do you want to open the authorization URL in your browser? (y/n)'));
    
    // For now, we'll just display the URL
    console.log(chalk.cyan('\n📋 Manual Steps:'));
    console.log(chalk.gray('1. Copy the authorization URL above'));
    console.log(chalk.gray('2. Paste it in your browser'));
    console.log(chalk.gray('3. Authorize the application'));
    console.log(chalk.gray('4. Copy the authorization code from the redirect URL'));
    console.log(chalk.gray('5. Run the token exchange manually'));
    
    console.log(chalk.yellow('\n💡 To test the complete flow, you can:'));
    console.log(chalk.gray('   - Use the authorization URL above'));
    console.log(chalk.gray('   - Or run: bun run test-zendesk-oauth:manual'));
    
    return authUrl;
  }

  // Manual token exchange (for when user has the authorization code)
  async manualTokenExchange() {
    console.log(chalk.bold.blue('\n🔄 Manual Token Exchange'));
    console.log(chalk.gray('=====================================\n'));
    
    console.log(chalk.yellow('📝 Enter the authorization code from the redirect URL:'));
    console.log(chalk.gray('   (The code parameter from the callback URL)'));
    
    // In a real scenario, you'd use readline or similar
    // For now, we'll show the format
    console.log(chalk.cyan('\n💡 Example authorization code format:'));
    console.log(chalk.gray('   abc123def456ghi789...'));
    
    console.log(chalk.yellow('\n📋 To complete the exchange manually:'));
    console.log(chalk.gray('1. Get the authorization code from the redirect URL'));
    console.log(chalk.gray('2. Use the exchangeCodeForTokens method'));
    console.log(chalk.gray('3. Test the access token'));
    console.log(chalk.gray('4. Save the tokens'));
  }

  // Run the complete test
  async runTest() {
    await this.startOAuthFlow();
    
    console.log(chalk.bold.green('\n🎉 Zendesk OAuth Test Complete!'));
    console.log(chalk.gray('====================================='));
    console.log(chalk.yellow('📋 Next steps:'));
    console.log(chalk.gray('   1. Complete the OAuth authorization in your browser'));
    console.log(chalk.gray('   2. Get the authorization code from the redirect URL'));
    console.log(chalk.gray('   3. Use the token exchange to get access tokens'));
    console.log(chalk.gray('   4. Test the API endpoints with your access token'));
  }
}

// Run the test
const tester = new ZendeskOAuthTester();
tester.runTest().catch(console.error);
