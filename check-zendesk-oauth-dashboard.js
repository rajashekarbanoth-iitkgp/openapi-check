#!/usr/bin/env bun

import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs';

class ZendeskDashboardOAuthChecker {
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

  // Check the actual dashboard HTML for OAuth clients
  async checkDashboardForOAuthClients() {
    console.log(chalk.yellow('\n🧪 Checking Zendesk dashboard for OAuth clients...'));
    
    const dashboardUrls = [
      '/admin/apps-integrations/oauth-clients',
      '/admin/apps-integrations',
      '/admin/apps',
      '/admin/integrations',
      '/admin/oauth_clients',
      '/admin/oauth-clients'
    ];

    for (const url of dashboardUrls) {
      try {
        console.log(chalk.blue(`\n   Checking: ${url}`));
        
        const response = await axios.get(`${this.subdomain}${url}`, {
          auth: { username: `${this.clientId}/token`, password: this.apiToken },
          headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }
        });

        if (response.status === 200) {
          console.log(chalk.green(`   ✅ Success! Status: ${response.status}`));
          
          // Look for OAuth client information in the HTML
          const html = response.data;
          
          // Check for common OAuth client patterns
          const oauthPatterns = [
            /OAuth.*Client/gi,
            /client.*id/gi,
            /client_id/gi,
            /redirect.*uri/gi,
            /redirect_uri/gi,
            /scope/gi,
            /scopes/gi
          ];

          let foundOAuthInfo = false;
          for (const pattern of oauthPatterns) {
            if (pattern.test(html)) {
              console.log(chalk.yellow(`   🔍 Found OAuth pattern: ${pattern.source}`));
              foundOAuthInfo = true;
            }
          }

          if (foundOAuthInfo) {
            console.log(chalk.green(`   📋 This page contains OAuth client information`));
            
            // Try to extract client IDs from the HTML
            const clientIdPatterns = [
              /client[_-]?id["\s]*[:=]\s*["']?([a-zA-Z0-9_-]+)["']?/gi,
              /identifier["\s]*[:=]\s*["']?([a-zA-Z0-9_-]+)["']?/gi,
              /id["\s]*[:=]\s*["']?([a-zA-Z0-9_-]+)["']?/gi
            ];

            for (const pattern of clientIdPatterns) {
              const matches = html.matchAll(pattern);
              for (const match of matches) {
                if (match[1] && match[1] !== 'undefined' && match[1].length > 3) {
                  console.log(chalk.blue(`   🎯 Found potential Client ID: ${match[1]}`));
                }
              }
            }
          } else {
            console.log(chalk.gray(`   ⚠️  No OAuth patterns found in this page`));
          }

          // Check if this is the main OAuth clients page
          if (url.includes('oauth-clients') || url.includes('oauth_clients')) {
            console.log(chalk.blue(`   📍 This appears to be the main OAuth clients page`));
            
            // Look for specific content that indicates OAuth clients exist
            if (html.includes('Create OAuth Client') || html.includes('New OAuth Client')) {
              console.log(chalk.green(`   ✅ Page has OAuth client creation options`));
            }
            
            if (html.includes('No OAuth clients') || html.includes('empty') || html.includes('no clients')) {
              console.log(chalk.yellow(`   ⚠️  Page indicates no OAuth clients exist`));
            }
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
  }

  // Check if there are any OAuth tokens or authorizations
  async checkOAuthTokens() {
    console.log(chalk.yellow('\n🧪 Checking for existing OAuth tokens...'));
    
    const tokenUrls = [
      '/api/v2/oauth_tokens.json',
      '/oauth/tokens.json',
      '/api/v2/authorizations.json',
      '/oauth/authorizations.json'
    ];

    for (const url of tokenUrls) {
      try {
        console.log(chalk.blue(`\n   Checking: ${url}`));
        
        const response = await axios.get(`${this.subdomain}${url}`, {
          auth: { username: `${this.clientId}/token`, password: this.apiToken },
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 200) {
          console.log(chalk.green(`   ✅ Success! Status: ${response.status}`));
          
          if (response.data.oauth_tokens && response.data.oauth_tokens.length > 0) {
            console.log(chalk.green(`   📋 Found ${response.data.oauth_tokens.length} OAuth token(s)`));
            response.data.oauth_tokens.forEach((token, index) => {
              console.log(chalk.blue(`      ${index + 1}. Token ID: ${token.id}`));
              console.log(chalk.gray(`         Client ID: ${token.client_id || 'Unknown'}`));
              console.log(chalk.gray(`         User ID: ${token.user_id || 'Unknown'}`));
            });
          } else if (response.data.authorizations && response.data.authorizations.length > 0) {
            console.log(chalk.green(`   📋 Found ${response.data.authorizations.length} OAuth authorization(s)`));
            response.data.authorizations.forEach((auth, index) => {
              console.log(chalk.blue(`      ${index + 1}. Auth ID: ${auth.id}`));
              console.log(chalk.gray(`         Client ID: ${auth.client_id || 'Unknown'}`));
            });
          } else {
            console.log(chalk.yellow(`   ⚠️  No OAuth tokens or authorizations found`));
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(chalk.yellow(`   ⚠️  Endpoint not found: ${url}`));
        } else if (error.response) {
          console.log(chalk.red(`   ❌ Failed: ${error.response.status} - ${error.response.statusText}`));
        } else {
          console.log(chalk.red(`   ❌ Failed: ${error.message}`));
        }
      }
    }
  }

  // Run all checks
  async runDashboardCheck() {
    console.log(chalk.bold.blue('🔍 Zendesk Dashboard OAuth Client Check'));
    console.log(chalk.gray('============================================\n'));

    await this.checkDashboardForOAuthClients();
    await this.checkOAuthTokens();

    console.log(chalk.bold.green('\n📊 Dashboard Check Results:'));
    console.log(chalk.gray('================================\n'));
    
    console.log(chalk.blue('💡 If you see OAuth clients in the dashboard but my code can\'t find them:'));
    console.log(chalk.blue('   1. The OAuth clients might be in a different Zendesk instance'));
    console.log(chalk.blue('   2. The OAuth clients might be configured differently'));
    console.log(chalk.blue('   3. The OAuth clients might be in a different section'));
    
    console.log(chalk.yellow('\n📋 Next steps:'));
    console.log(chalk.yellow('   1. Go to your Zendesk dashboard manually'));
    console.log(chalk.yellow('   2. Navigate to Apps & Integrations → OAuth Clients'));
    console.log(chalk.yellow('   3. Check what Client IDs are actually listed there'));
    console.log(chalk.yellow('   4. Update your env.ids with the correct Client ID'));
  }
}

// Run the dashboard check
const checker = new ZendeskDashboardOAuthChecker();
checker.runDashboardCheck().catch(console.error);
