#!/usr/bin/env bun

import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs';

class ZendeskOAuthChecker {
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

  // Check if the OAuth app exists
  async checkOAuthApp() {
    console.log(chalk.yellow('\n🧪 Checking OAuth app configuration...'));
    
    try {
      // Try to access the OAuth app directly
      const appUrl = `${this.subdomain}/oauth/applications/${this.clientId}`;
      
      const response = await axios.get(appUrl, {
        auth: {
          username: `${this.clientId}/token`,
          password: this.apiToken
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        console.log(chalk.green('✅ OAuth app found!'));
        console.log(chalk.gray('   App Details:'));
        console.log(chalk.gray(`   - Name: ${response.data.application.name}`));
        console.log(chalk.gray(`   - Redirect URI: ${response.data.application.redirect_uri}`));
        console.log(chalk.gray(`   - Scopes: ${response.data.application.scopes || 'None'}`));
        return true;
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(chalk.red('❌ OAuth app not found!'));
        console.log(chalk.yellow('💡 The Client ID does not exist in Zendesk.'));
        return false;
      } else {
        console.error(chalk.red('❌ Error checking OAuth app:'), error.message);
        return false;
      }
    }
  }

  // List all OAuth apps
  async listOAuthApps() {
    console.log(chalk.yellow('\n🧪 Listing all OAuth apps...'));
    
    try {
      const appsUrl = `${this.subdomain}/oauth/applications.json`;
      
      const response = await axios.get(appsUrl, {
        auth: {
          username: `${this.clientId}/token`,
          password: this.apiToken
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 && response.data.applications) {
        console.log(chalk.green(`✅ Found ${response.data.applications.length} OAuth app(s):`));
        
        response.data.applications.forEach((app, index) => {
          console.log(chalk.blue(`\n   ${index + 1}. App Details:`));
          console.log(chalk.gray(`      - ID: ${app.id}`));
          console.log(chalk.gray(`      - Name: ${app.name}`));
          console.log(chalk.gray(`      - Redirect URI: ${app.redirect_uri}`));
          console.log(chalk.gray(`      - Scopes: ${app.scopes || 'None'}`));
        });
        
        return response.data.applications;
      } else {
        console.log(chalk.yellow('⚠️  No OAuth apps found or access denied.'));
        return [];
      }
    } catch (error) {
      console.error(chalk.red('❌ Error listing OAuth apps:'), error.message);
      return [];
    }
  }

  // Check OAuth endpoints
  async checkOAuthEndpoints() {
    console.log(chalk.yellow('\n🧪 Checking OAuth endpoints...'));
    
    const endpoints = [
      '/oauth/applications',
      '/oauth/authorizations/new',
      '/oauth/authorizations',
      '/oauth/tokens'
    ];

    for (const endpoint of endpoints) {
      try {
        const url = `${this.subdomain}${endpoint}`;
        const response = await axios.get(url, {
          auth: {
            username: `${this.clientId}/token`,
            password: this.apiToken
          }
        });
        
        console.log(chalk.green(`✅ ${endpoint}: ${response.status}`));
      } catch (error) {
        if (error.response) {
          console.log(chalk.red(`❌ ${endpoint}: ${error.response.status} - ${error.response.statusText}`));
        } else {
          console.log(chalk.red(`❌ ${endpoint}: ${error.message}`));
        }
      }
    }
  }

  // Run all checks
  async runChecks() {
    console.log(chalk.bold.blue('🔍 Zendesk OAuth App Configuration Check'));
    console.log(chalk.gray('============================================\n'));

    const appExists = await this.checkOAuthApp();
    const apps = await this.listOAuthApps();
    await this.checkOAuthEndpoints();

    console.log(chalk.bold.green('\n📊 Summary:'));
    console.log(chalk.gray('============\n'));
    
    if (appExists) {
      console.log(chalk.green('✅ Your OAuth app exists and is configured.'));
      console.log(chalk.yellow('📋 The OAuth flow should work.'));
    } else {
      console.log(chalk.red('❌ Your OAuth app does not exist in Zendesk.'));
      console.log(chalk.yellow('📋 You need to create an OAuth app first.'));
      
      if (apps.length > 0) {
        console.log(chalk.blue('\n💡 Available OAuth apps:'));
        apps.forEach(app => {
          console.log(chalk.blue(`   - ${app.name} (ID: ${app.id})`));
        });
        console.log(chalk.yellow('\n💡 Try using one of these existing app IDs instead.'));
      }
    }
  }
}

// Run the checks
const checker = new ZendeskOAuthChecker();
checker.runChecks().catch(console.error);
