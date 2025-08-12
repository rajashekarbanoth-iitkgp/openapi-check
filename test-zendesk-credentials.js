#!/usr/bin/env bun

import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs';

class ZendeskCredentialTester {
  constructor() {
    this.loadCredentials();
  }

  loadCredentials() {
    try {
      const envContent = fs.readFileSync('env.ids', 'utf8');
      
      const secretMatch = envContent.match(/ZENDESK_SECRET=([^\n]+)/);
      const apiTokenMatch = envContent.match(/ZENDESK_API_TOKEN=([^\n]+)/);
      const clientIdMatch = envContent.match(/ZENDESK_CLIENT_ID=([^\n]+)/);
      const subdomainMatch = envContent.match(/ZENDESK_SUBDOMAIN\s*=\s*([^\n]+)/);
      
      if (secretMatch && apiTokenMatch && clientIdMatch && subdomainMatch) {
        this.clientSecret = secretMatch[1].trim();
        this.apiToken = apiTokenMatch[1].trim();
        this.clientId = clientIdMatch[1].trim();
        this.subdomain = subdomainMatch[1].trim();
        
        console.log(chalk.green('✅ Zendesk credentials loaded successfully'));
        console.log(chalk.gray(`   Subdomain: ${this.subdomain}`));
        console.log(chalk.gray(`   Client ID: ${this.clientId}`));
        console.log(chalk.gray(`   Client Secret: ${this.clientSecret.substring(0, 8)}...`));
        console.log(chalk.gray(`   API Token: ${this.apiToken.substring(0, 8)}...`));
      } else {
        throw new Error('Missing required credentials in env.ids');
      }
    } catch (error) {
      console.error(chalk.red('❌ Error loading Zendesk credentials:'), error.message);
      process.exit(1);
    }
  }

  // Test basic API access with API token first
  async testBasicAPIAccess() {
    console.log(chalk.yellow('\n🧪 Testing basic Zendesk API access...'));
    
    try {
      // Test with a simple endpoint
      const testUrl = `${this.subdomain}/api/v2/users/me.json`;
      
      const response = await axios.get(testUrl, {
        auth: {
          username: `${this.clientId}/token`,
          password: this.apiToken
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        console.log(chalk.green('✅ Basic API access successful!'));
        console.log(chalk.gray('   User Info:'));
        console.log(chalk.gray(`   - ID: ${response.data.user.id}`));
        console.log(chalk.gray(`   - Name: ${response.data.user.name}`));
        console.log(chalk.gray(`   - Email: ${response.data.user.email}`));
        return true;
      } else {
        console.log(chalk.red(`❌ Basic API access failed - Status: ${response.status}`));
        return false;
      }
    } catch (error) {
      console.error(chalk.red('❌ Basic API access error:'));
      if (error.response) {
        console.error(chalk.red(`   Status: ${error.response.status}`));
        console.error(chalk.red(`   Error: ${JSON.stringify(error.response.data, null, 2)}`));
      } else {
        console.error(chalk.red(`   Error: ${error.message}`));
      }
      return false;
    }
  }

  // Test OAuth app configuration
  async testOAuthAppConfig() {
    console.log(chalk.yellow('\n🧪 Testing OAuth app configuration...'));
    
    try {
      // Try to access OAuth endpoints to see if the app is properly configured
      const oauthTestUrl = `${this.subdomain}/oauth/authorizations/new`;
      
      const response = await axios.get(oauthTestUrl, {
        params: {
          response_type: 'code',
          client_id: this.clientId,
          redirect_uri: 'http://localhost:3000/callback'
        }
      });

      if (response.status === 200) {
        console.log(chalk.green('✅ OAuth app configuration test successful!'));
        return true;
      } else {
        console.log(chalk.red(`❌ OAuth app configuration test failed - Status: ${response.status}`));
        return false;
      }
    } catch (error) {
      console.error(chalk.red('❌ OAuth app configuration test error:'));
      if (error.response) {
        console.error(chalk.red(`   Status: ${error.response.status}`));
        console.error(chalk.red(`   Error: ${JSON.stringify(error.response.data, null, 2)}`));
        
        if (error.response.status === 400) {
          console.log(chalk.yellow('💡 This might be expected - OAuth endpoint might require POST or different parameters'));
        }
      } else {
        console.error(chalk.red(`   Error: ${error.message}`));
      }
      return false;
    }
  }

  // Run all tests
  async runTests() {
    console.log(chalk.bold.blue('🔍 Testing Zendesk Credentials & Configuration'));
    console.log(chalk.gray('================================================\n'));

    const basicAPITest = await this.testBasicAPIAccess();
    const oauthTest = await this.testOAuthAppConfig();

    console.log(chalk.bold.green('\n📊 Test Results Summary:'));
    console.log(chalk.gray('==========================\n'));
    console.log(chalk.gray(`   Basic API Access: ${basicAPITest ? '✅ PASSED' : '❌ FAILED'}`));
    console.log(chalk.gray(`   OAuth App Config: ${oauthTest ? '✅ PASSED' : '❌ FAILED'}`));

    if (basicAPITest && oauthTest) {
      console.log(chalk.green('\n🎉 All tests passed! Your Zendesk credentials are working.'));
      console.log(chalk.yellow('📋 Next: Try the OAuth flow with the working credentials.'));
    } else if (basicAPITest) {
      console.log(chalk.yellow('\n⚠️  Basic API works but OAuth app might need configuration.'));
      console.log(chalk.yellow('📋 Check your Zendesk OAuth app settings.'));
    } else {
      console.log(chalk.red('\n❌ Basic API access failed. Check your credentials and Zendesk setup.'));
    }
  }
}

// Run the tests
const tester = new ZendeskCredentialTester();
tester.runTests().catch(console.error);
