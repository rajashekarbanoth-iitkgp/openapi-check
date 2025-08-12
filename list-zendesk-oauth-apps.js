#!/usr/bin/env bun

import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs';

class ZendeskOAuthLister {
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

  // Try different ways to list OAuth apps
  async listOAuthApps() {
    console.log(chalk.yellow('\n🧪 Trying to list OAuth apps...'));
    
    const methods = [
      {
        name: 'Admin API with token',
        url: `${this.subdomain}/api/v2/oauth_clients.json`,
        auth: { username: `${this.clientId}/token`, password: this.apiToken }
      },
      {
        name: 'Admin API with secret',
        url: `${this.subdomain}/api/v2/oauth_clients.json`,
        auth: { username: this.clientId, password: this.clientSecret }
      },
      {
        name: 'Legacy OAuth endpoint',
        url: `${this.subdomain}/oauth/applications.json`,
        auth: { username: `${this.clientId}/token`, password: this.apiToken }
      }
    ];

    for (const method of methods) {
      try {
        console.log(chalk.blue(`\n   Trying: ${method.name}`));
        
        const response = await axios.get(method.url, {
          auth: method.auth,
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 200) {
          console.log(chalk.green(`   ✅ Success! Status: ${response.status}`));
          
          if (response.data.oauth_clients) {
            console.log(chalk.green(`   📋 Found ${response.data.oauth_clients.length} OAuth client(s):`));
            response.data.oauth_clients.forEach((client, index) => {
              console.log(chalk.blue(`      ${index + 1}. ${client.name} (ID: ${client.identifier})`));
            });
            return response.data.oauth_clients;
          } else if (response.data.applications) {
            console.log(chalk.green(`   📋 Found ${response.data.applications.length} OAuth app(s):`));
            response.data.applications.forEach((app, index) => {
              console.log(chalk.blue(`      ${index + 1}. ${app.name} (ID: ${app.id})`));
            });
            return response.data.applications;
          } else {
            console.log(chalk.yellow(`   ⚠️  Response data: ${JSON.stringify(response.data, null, 2)}`));
          }
        }
      } catch (error) {
        if (error.response) {
          console.log(chalk.red(`   ❌ Failed: ${error.response.status} - ${error.response.statusText}`));
        } else {
          console.log(chalk.red(`   ❌ Failed: ${error.message}`));
        }
      }
    }

    console.log(chalk.yellow('\n💡 No OAuth apps found with any method.'));
    return [];
  }

  // Check if we can create OAuth apps
  async checkOAuthCreation() {
    console.log(chalk.yellow('\n🧪 Checking OAuth app creation permissions...'));
    
    try {
      // Try to access the OAuth creation page
      const createUrl = `${this.subdomain}/admin/apps-integrations/oauth-clients`;
      
      const response = await axios.get(createUrl, {
        auth: { username: `${this.clientId}/token`, password: this.apiToken }
      });

      if (response.status === 200) {
        console.log(chalk.green('✅ Can access OAuth creation page'));
        return true;
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log(chalk.red('❌ No permission to create OAuth apps'));
        console.log(chalk.yellow('💡 You need admin access to create OAuth apps'));
      } else {
        console.log(chalk.red(`❌ Error: ${error.message}`));
      }
      return false;
    }
  }

  // Run the check
  async runCheck() {
    console.log(chalk.bold.blue('🔍 Zendesk OAuth Apps Discovery'));
    console.log(chalk.gray('==================================\n'));

    const apps = await this.listOAuthApps();
    await this.checkOAuthCreation();

    console.log(chalk.bold.green('\n📊 Summary:'));
    console.log(chalk.gray('============\n'));
    
    if (apps.length > 0) {
      console.log(chalk.green('✅ Found existing OAuth apps!'));
      console.log(chalk.yellow('📋 You can use one of these instead of creating a new one.'));
      console.log(chalk.blue('💡 Update your env.ids with the correct Client ID.'));
    } else {
      console.log(chalk.red('❌ No OAuth apps found.'));
      console.log(chalk.yellow('📋 You need to create an OAuth app in Zendesk first.'));
      console.log(chalk.blue('💡 Go to Admin Center → Apps and Integrations → OAuth Clients'));
    }
  }
}

// Run the check
const lister = new ZendeskOAuthLister();
lister.runCheck().catch(console.error);
