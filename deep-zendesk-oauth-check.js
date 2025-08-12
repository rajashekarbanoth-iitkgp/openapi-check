#!/usr/bin/env bun

import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs';

class DeepZendeskOAuthChecker {
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

  // Try multiple authentication methods
  async tryDifferentAuthMethods() {
    console.log(chalk.yellow('\n🧪 Trying different authentication methods...'));
    
    const authMethods = [
      {
        name: 'Client ID + API Token',
        username: `${this.clientId}/token`,
        password: this.apiToken
      },
      {
        name: 'Client ID + Client Secret',
        username: this.clientId,
        password: this.clientSecret
      },
      {
        name: 'Email + API Token',
        username: 'cenizasai@gmail.com', // Try common email format
        password: this.apiToken
      },
      {
        name: 'Email + Client Secret',
        username: 'cenizasai@gmail.com',
        password: this.clientSecret
      }
    ];

    for (const method of authMethods) {
      try {
        console.log(chalk.blue(`\n   Trying: ${method.name}`));
        
        // Test with a simple endpoint
        const testUrl = `${this.subdomain}/api/v2/users/me.json`;
        const response = await axios.get(testUrl, {
          auth: method,
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 200) {
          console.log(chalk.green(`   ✅ Success! Status: ${response.status}`));
          console.log(chalk.gray(`   User: ${response.data.user.name || 'Unknown'}`));
          this.workingAuth = method;
          return method;
        }
      } catch (error) {
        if (error.response) {
          console.log(chalk.red(`   ❌ Failed: ${error.response.status} - ${error.response.statusText}`));
        } else {
          console.log(chalk.red(`   ❌ Failed: ${error.message}`));
        }
      }
    }

    console.log(chalk.red('\n   ❌ No authentication method worked'));
    return null;
  }

  // Check OAuth clients with working auth
  async checkOAuthClients() {
    if (!this.workingAuth) {
      console.log(chalk.red('\n❌ No working authentication method found'));
      return [];
    }

    console.log(chalk.yellow('\n🧪 Checking OAuth clients with working auth...'));
    
    const endpoints = [
      {
        name: 'Admin API OAuth Clients',
        url: `${this.subdomain}/api/v2/oauth_clients.json`
      },
      {
        name: 'Legacy OAuth Applications',
        url: `${this.subdomain}/oauth/applications.json`
      },
      {
        name: 'OAuth Clients (alternative)',
        url: `${this.subdomain}/api/v2/oauth_clients`
      },
      {
        name: 'Admin Center OAuth',
        url: `${this.subdomain}/admin/apps-integrations/oauth-clients`
      }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(chalk.blue(`\n   Checking: ${endpoint.name}`));
        
        const response = await axios.get(endpoint.url, {
          auth: this.workingAuth,
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 200) {
          console.log(chalk.green(`   ✅ Success! Status: ${response.status}`));
          
          if (response.data.oauth_clients && response.data.oauth_clients.length > 0) {
            console.log(chalk.green(`   📋 Found ${response.data.oauth_clients.length} OAuth client(s):`));
            response.data.oauth_clients.forEach((client, index) => {
              console.log(chalk.blue(`      ${index + 1}. ${client.name || 'Unnamed'} (ID: ${client.identifier || client.id})`));
              console.log(chalk.gray(`         Redirect URI: ${client.redirect_uri || 'None'}`));
              console.log(chalk.gray(`         Scopes: ${client.scopes || 'None'}`));
            });
            return response.data.oauth_clients;
          } else if (response.data.applications && response.data.applications.length > 0) {
            console.log(chalk.green(`   📋 Found ${response.data.applications.length} OAuth app(s):`));
            response.data.applications.forEach((app, index) => {
              console.log(chalk.blue(`      ${index + 1}. ${app.name || 'Unnamed'} (ID: ${app.id})`));
              console.log(chalk.gray(`         Redirect URI: ${app.redirect_uri || 'None'}`));
              console.log(chalk.gray(`         Scopes: ${app.scopes || 'None'}`));
            });
            return response.data.applications;
          } else {
            console.log(chalk.yellow(`   ⚠️  No OAuth clients found in response`));
            console.log(chalk.gray(`   Response keys: ${Object.keys(response.data).join(', ')}`));
          }
        }
      } catch (error) {
        if (error.response) {
          console.log(chalk.red(`   ❌ Failed: ${error.response.status} - ${error.response.statusText}`));
          if (error.response.status === 404) {
            console.log(chalk.gray(`   💡 Endpoint not found - this is normal for some Zendesk instances`));
          }
        } else {
          console.log(chalk.red(`   ❌ Failed: ${error.message}`));
        }
      }
    }

    return [];
  }

  // Check if the specific client ID exists
  async checkSpecificClientId() {
    if (!this.workingAuth) return false;

    console.log(chalk.yellow('\n🧪 Checking if specific Client ID exists...'));
    
    try {
      // Try to access the specific OAuth client
      const clientUrl = `${this.subdomain}/api/v2/oauth_clients/${this.clientId}.json`;
      
      const response = await axios.get(clientUrl, {
        auth: this.workingAuth,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 200) {
        console.log(chalk.green(`✅ OAuth client ${this.clientId} found!`));
        console.log(chalk.gray(`   Name: ${response.data.oauth_client.name || 'Unnamed'}`));
        console.log(chalk.gray(`   Redirect URI: ${response.data.oauth_client.redirect_uri || 'None'}`));
        console.log(chalk.gray(`   Scopes: ${response.data.oauth_client.scopes || 'None'}`));
        return true;
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(chalk.red(`❌ OAuth client ${this.clientId} not found`));
        console.log(chalk.yellow('💡 This Client ID does not exist in Zendesk'));
      } else {
        console.log(chalk.red(`❌ Error checking client: ${error.message}`));
      }
      return false;
    }
  }

  // Try to access OAuth creation page
  async checkOAuthCreationAccess() {
    console.log(chalk.yellow('\n🧪 Checking OAuth creation access...'));
    
    const pages = [
      '/admin/apps-integrations/oauth-clients',
      '/admin/oauth_clients',
      '/admin/apps/oauth-clients',
      '/admin/integrations/oauth-clients'
    ];

    for (const page of pages) {
      try {
        const url = `${this.subdomain}${page}`;
        const response = await axios.get(url, {
          auth: this.workingAuth,
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 200) {
          console.log(chalk.green(`✅ Can access: ${page}`));
          return true;
        }
      } catch (error) {
        if (error.response && error.response.status === 403) {
          console.log(chalk.red(`❌ No permission: ${page}`));
        } else if (error.response && error.response.status === 404) {
          console.log(chalk.yellow(`⚠️  Not found: ${page}`));
        } else {
          console.log(chalk.red(`❌ Error: ${page} - ${error.message}`));
        }
      }
    }

    return false;
  }

  // Run all checks
  async runDeepCheck() {
    console.log(chalk.bold.blue('🔍 Deep Zendesk OAuth Client Check'));
    console.log(chalk.gray('========================================\n'));

    const workingAuth = await this.tryDifferentAuthMethods();
    const oauthClients = await this.checkOAuthClients();
    const specificClientExists = await this.checkSpecificClientId();
    const canCreateOAuth = await this.checkOAuthCreationAccess();

    console.log(chalk.bold.green('\n📊 Deep Check Results:'));
    console.log(chalk.gray('========================\n'));
    
    if (workingAuth) {
      console.log(chalk.green(`✅ Working authentication: ${workingAuth.name}`));
    } else {
      console.log(chalk.red('❌ No working authentication method found'));
    }

    if (oauthClients.length > 0) {
      console.log(chalk.green(`✅ Found ${oauthClients.length} OAuth client(s)`));
      console.log(chalk.yellow('💡 You can use one of these existing clients'));
    } else {
      console.log(chalk.red('❌ No OAuth clients found'));
    }

    if (specificClientExists) {
      console.log(chalk.green(`✅ Your Client ID ${this.clientId} exists and is configured`));
      console.log(chalk.yellow('📋 The OAuth flow should work with this client'));
    } else {
      console.log(chalk.red(`❌ Your Client ID ${this.clientId} does not exist`));
      console.log(chalk.yellow('📋 You need to use an existing client ID or create a new one'));
    }

    if (canCreateOAuth) {
      console.log(chalk.green('✅ You have permission to create OAuth clients'));
    } else {
      console.log(chalk.red('❌ You do not have permission to create OAuth clients'));
    }

    console.log(chalk.bold.blue('\n💡 Recommendations:'));
    if (oauthClients.length > 0) {
      console.log(chalk.blue('1. Use one of the existing OAuth clients above'));
      console.log(chalk.blue('2. Update your env.ids with the correct Client ID'));
    } else {
      console.log(chalk.blue('1. Create a new OAuth client in Zendesk Admin Center'));
      console.log(chalk.blue('2. Set Redirect URI to: http://localhost:3000/callback'));
    }
  }
}

// Run the deep check
const checker = new DeepZendeskOAuthChecker();
checker.runDeepCheck().catch(console.error);
