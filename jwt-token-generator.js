#!/usr/bin/env node

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import chalk from 'chalk';

class OnePasswordJWTGenerator {
  constructor() {
    this.issuer = '1password-events-api-tester';
    this.audience = 'https://events.1password.com';
    this.subject = 'test-service-account';
  }

  // ============ LOGGING UTILITIES ============
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      test: chalk.cyan
    };
    console.log(`${chalk.gray(timestamp)} ${colors[type](`[${type.toUpperCase()}]`)} ${message}`);
  }

  // ============ JWT TOKEN GENERATION ============
  generateTestJWT(secret = null, expiresIn = '1h') {
    try {
      // Generate a random secret if none provided
      const jwtSecret = secret || crypto.randomBytes(32).toString('hex');
      
      const payload = {
        iss: this.issuer,
        aud: this.audience,
        sub: this.subject,
        iat: Math.floor(Date.now() / 1000),
        features: ['auditevents', 'itemusages', 'signinattempts'],
        account_uuid: 'test-account-' + crypto.randomBytes(8).toString('hex'),
        service_account_uuid: 'test-service-' + crypto.randomBytes(8).toString('hex')
      };

      const token = jwt.sign(payload, jwtSecret, {
        algorithm: 'HS256',
        expiresIn: expiresIn
      });

      this.log(`Generated JWT token with secret: ${jwtSecret}`, 'success');
      this.log(`Token payload: ${JSON.stringify(payload, null, 2)}`, 'test');
      
      return { token, secret: jwtSecret, payload };
    } catch (error) {
      this.log(`Failed to generate JWT token: ${error.message}`, 'error');
      return null;
    }
  }

  // ============ TOKEN VALIDATION ============
  validateToken(token, secret) {
    try {
      const decoded = jwt.verify(token, secret);
      this.log('✅ JWT token is valid', 'success');
      this.log(`Decoded payload: ${JSON.stringify(decoded, null, 2)}`, 'test');
      return { valid: true, payload: decoded };
    } catch (error) {
      this.log(`❌ JWT token validation failed: ${error.message}`, 'error');
      return { valid: false, error: error.message };
    }
  }

  // ============ ENVIRONMENT SETUP ============
  setupEnvironment(token) {
    try {
      // Set environment variable for current session
      process.env.ONEPASSWORD_JWT_TOKEN = token;
      
      this.log('✅ Environment variable ONEPASSWORD_JWT_TOKEN set', 'success');
      this.log(`Token: ${token.substring(0, 20)}...`, 'test');
      
      return true;
    } catch (error) {
      this.log(`❌ Failed to set environment variable: ${error.message}`, 'error');
      return false;
    }
  }

  // ============ TOKEN INFO ============
  getTokenInfo(token) {
    try {
      // Decode without verification to get header and payload
      const decoded = jwt.decode(token, { complete: true });
      
      if (!decoded) {
        this.log('❌ Invalid JWT token format', 'error');
        return null;
      }

      const { header, payload } = decoded;
      
      this.log('📋 JWT Token Information:', 'info');
      this.log(`Algorithm: ${header.alg}`, 'test');
      this.log(`Type: ${header.typ}`, 'test');
      this.log(`Issuer: ${payload.iss}`, 'test');
      this.log(`Audience: ${payload.aud}`, 'test');
      this.log(`Subject: ${payload.sub}`, 'test');
      this.log(`Issued At: ${new Date(payload.iat * 1000).toISOString()}`, 'test');
      this.log(`Expires At: ${payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A'}`, 'test');
      this.log(`Features: ${payload.features?.join(', ') || 'None'}`, 'test');
      
      return { header, payload };
    } catch (error) {
      this.log(`❌ Failed to decode token: ${error.message}`, 'error');
      return null;
    }
  }

  // ============ MAIN EXECUTION ============
  async generateAndSetup() {
    console.log(chalk.cyan.bold('🔑 1PASSWORD JWT TOKEN GENERATOR'));
    console.log(chalk.gray('='.repeat(50)));

    // Generate JWT token
    this.log('Generating JWT token for 1Password Events API...', 'info');
    const result = this.generateTestJWT();
    
    if (!result) {
      this.log('Failed to generate JWT token', 'error');
      return null;
    }

    const { token, secret, payload } = result;

    // Validate the generated token
    this.log('Validating generated token...', 'info');
    const validation = this.validateToken(token, secret);
    
    if (!validation.valid) {
      this.log('Generated token is invalid', 'error');
      return null;
    }

    // Get token information
    this.getTokenInfo(token);

    // Setup environment
    this.log('Setting up environment...', 'info');
    const envSetup = this.setupEnvironment(token);
    
    if (!envSetup) {
      this.log('Failed to setup environment', 'error');
      return null;
    }

    console.log(chalk.green.bold('\n✅ JWT Token Generated Successfully!'));
    console.log(chalk.gray('='.repeat(50)));
    console.log(chalk.blue('🔑 Token: ') + chalk.yellow(token.substring(0, 50)) + '...');
    console.log(chalk.blue('🔐 Secret: ') + chalk.yellow(secret.substring(0, 20)) + '...');
    console.log(chalk.blue('📅 Expires: ') + chalk.yellow(payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A'));
    console.log(chalk.blue('🎯 Features: ') + chalk.yellow(payload.features.join(', ')));
    
    console.log(chalk.cyan('\n🚀 Ready to test with live data!'));
    console.log(chalk.gray('Run: bun test:1password-events'));
    
    return { token, secret, payload };
  }
}

// ============ MAIN EXECUTION ============
async function main() {
  const generator = new OnePasswordJWTGenerator();
  const result = await generator.generateAndSetup();
  
  if (result) {
    // Export for use in other scripts
    global.ONEPASSWORD_JWT_TOKEN = result.token;
    global.ONEPASSWORD_JWT_SECRET = result.secret;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default OnePasswordJWTGenerator;