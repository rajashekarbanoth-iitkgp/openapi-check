#!/usr/bin/env bun

import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs';

// Load credentials
const envContent = fs.readFileSync('env.ids', 'utf8');
const clientId = envContent.match(/ZENDESK_CLIENT_ID=([^\n]+)/)[1].trim();
const clientSecret = envContent.match(/ZENDESK_SECRET=([^\n]+)/)[1].trim();
const subdomain = envContent.match(/ZENDESK_SUBDOMAIN\s*=\s*([^\n]+)/)[1].trim();

console.log(chalk.blue('🔍 Checking OAuth app redirect URI...'));
console.log(chalk.gray(`Client ID: ${clientId}`));
console.log(chalk.gray(`Subdomain: ${subdomain}`));

// Try to get OAuth app details
try {
  const response = await axios.get(`${subdomain}/api/v2/oauth_clients/${clientId}.json`, {
    auth: { username: clientId, password: clientSecret }
  });
  
  if (response.data.oauth_client) {
    const app = response.data.oauth_client;
    console.log(chalk.green('✅ OAuth app found!'));
    console.log(chalk.blue(`   Name: ${app.name || 'Unnamed'}`));
    console.log(chalk.blue(`   Redirect URI: ${app.redirect_uri || 'None'}`));
    console.log(chalk.blue(`   Scopes: ${app.scopes || 'None'}`));
    
    if (app.redirect_uri !== 'http://localhost:3000/callback') {
      console.log(chalk.red('❌ Redirect URI mismatch!'));
      console.log(chalk.yellow(`   Current: ${app.redirect_uri || 'None'}`));
      console.log(chalk.yellow(`   Needed: http://localhost:3000/callback`));
      console.log(chalk.blue('💡 Update the redirect URI in Zendesk dashboard'));
    } else {
      console.log(chalk.green('✅ Redirect URI is correct!'));
    }
  }
} catch (error) {
  console.log(chalk.red('❌ Could not get OAuth app details'));
  console.log(chalk.yellow('💡 You need to update the redirect URI manually'));
  console.log(chalk.blue('   Go to: Apps & Integrations → OAuth Clients'));
  console.log(chalk.blue('   Edit app 21663919229596'));
  console.log(chalk.blue('   Set Redirect URI to: http://localhost:3000/callback'));
}
