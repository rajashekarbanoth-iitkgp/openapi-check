#!/usr/bin/env node

import { install, fake, seed } from 'zod-schema-faker';
import { z } from 'zod';
import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Install zod-schema-faker
install();
seed(42);

const AFFILIATE_ID = process.env.FLIPKART_AFFILIATE_ID;
const AFFILIATE_TOKEN = process.env.FLIPKART_AFFILIATE_TOKEN;
const BASE_URL = 'https://affiliate-api.flipkart.net/affiliate';

class AdvancedFlipkartAPITester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.trackingId = AFFILIATE_ID; // Using same as affiliate ID for simplicity
    this.testedProducts = [];
    this.discoveredCategories = [];
    this.discoveredOffers = [];
    this.startTime = new Date();
    
    // Setup logging
    this.setupLogging();
  }

  setupLogging() {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create timestamped log files
    const timestamp = this.startTime.toISOString().replace(/[:.]/g, '-');
    this.logFiles = {
      main: path.join(logsDir, `flipkart-test-${timestamp}.log`),
      api: path.join(logsDir, `flipkart-api-calls-${timestamp}.log`),
      results: path.join(logsDir, `flipkart-results-${timestamp}.json`)
    };

    // Initialize log files
    this.writeToFile(this.logFiles.main, `🚀 Flipkart Affiliate API Test Started: ${this.startTime.toISOString()}\n`);
    this.writeToFile(this.logFiles.api, `API Calls Log - Started: ${this.startTime.toISOString()}\n`);
    
    console.log(chalk.blue(`📝 Logging to files:`));
    console.log(chalk.gray(`   Main log: ${this.logFiles.main}`));
    console.log(chalk.gray(`   API calls: ${this.logFiles.api}`));
    console.log(chalk.gray(`   Results: ${this.logFiles.results}`));
    console.log('');
  }

  writeToFile(filepath, content) {
    try {
      fs.appendFileSync(filepath, content);
    } catch (error) {
      console.error(chalk.red(`Failed to write to log file: ${error.message}`));
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      test: chalk.cyan
    };
    
    // Console output with colors
    const coloredOutput = `${chalk.gray(timestamp)} ${colors[type](`[${type.toUpperCase()}]`)} ${message}`;
    console.log(coloredOutput);
    
    // File output without colors
    const fileOutput = `${timestamp} [${type.toUpperCase()}] ${message}\n`;
    this.writeToFile(this.logFiles.main, fileOutput);
  }

  logAPICall(method, url, requestData, response, duration) {
    const timestamp = new Date().toISOString();
    const apiLogEntry = {
      timestamp,
      method,
      url,
      requestData,
      response: {
        status: response.status,
        success: response.success,
        message: response.message,
        dataSize: response.data ? JSON.stringify(response.data).length : 0
      },
      duration
    };

    // Write detailed API log
    const apiLogLine = `${timestamp} ${method} ${url} - Status: ${response.status} - Duration: ${duration}ms\n`;
    this.writeToFile(this.logFiles.api, apiLogLine);
    
    // Store detailed JSON for analysis
    this.writeToFile(this.logFiles.api, `${JSON.stringify(apiLogEntry, null, 2)}\n---\n`);
  }

  logTestResult(test, success, error = null) {
    if (success) {
      this.results.passed++;
      this.log(`✅ ${test}`, 'success');
    } else {
      this.results.failed++;
      this.results.errors.push({ test, error: error?.message || 'Unknown error', timestamp: new Date().toISOString() });
      this.log(`❌ ${test} - ${error?.message || 'Failed'}`, 'error');
    }
  }

  async makeRequest(url, options = {}) {
    const startTime = Date.now();
    const method = options.method || 'GET';
    
    const defaultOptions = {
      headers: {
        'Fk-Affiliate-Id': AFFILIATE_ID,
        'Fk-Affiliate-Token': AFFILIATE_TOKEN,
        'Accept': 'application/json',
        'User-Agent': 'Flipkart-API-Tester/1.0',
        ...options.headers
      },
      timeout: 15000,
      ...options
    };

    try {
      this.log(`🔄 ${method} ${url}`, 'test');
      const response = await axios(url, defaultOptions);
      const duration = Date.now() - startTime;
      
      const result = { success: true, data: response.data, status: response.status };
      
      // Log API call details
      this.logAPICall(method, url, options.data, result, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.error?.message || error.message,
        details: error.response?.data
      };
      
      // Log failed API call
      this.logAPICall(method, url, options.data, result, duration);
      
      return result;
    }
  }

  // ============ PRODUCT FEED OPERATIONS ============

  async testProductFeedListing() {
    this.log('📋 Testing Product Feed Listing...', 'info');
    
    const url = `${BASE_URL}/api/${this.trackingId}.json`;
    const result = await this.makeRequest(url);
    
    if (result.success && result.data.apiGroups?.affiliate?.apiListings) {
      const categories = Object.keys(result.data.apiGroups.affiliate.apiListings);
      this.discoveredCategories = categories;
      
      this.logTestResult(`Product Feed Listing (${categories.length} categories found)`, true);
      
      // Log category details
      this.log(`Categories available:`, 'info');
      categories.slice(0, 10).forEach(category => {
        this.log(`   - ${category}`, 'test');
      });
      
      if (categories.length > 10) {
        this.log(`   ... and ${categories.length - 10} more categories`, 'test');
      }
      
      return result.data;
    } else {
      this.logTestResult('Product Feed Listing', false, new Error(`${result.status}: ${result.message}`));
      return null;
    }
  }

  async testCategoryProductFeed() {
    if (this.discoveredCategories.length === 0) {
      this.logTestResult('Category Product Feed', false, new Error('No categories available'));
      return;
    }

    this.log('📦 Testing Category Product Feed...', 'info');
    
    // Test with first available category
    const category = this.discoveredCategories[0];
    
    // Note: In real implementation, you'd need to extract the actual feed URL from the listing response
    // For demo purposes, using the v1.0 endpoint structure
    const url = `${BASE_URL}/1.0/feeds/${this.trackingId}/category/${category}.json`;
    const result = await this.makeRequest(url);

    if (result.success && result.data.productInfoList) {
      const products = result.data.productInfoList;
      this.testedProducts = products.slice(0, 3); // Store first 3 for testing
      
      this.logTestResult(`Category Product Feed (${products.length} products found in ${category})`, true);
      
      // Log product details
      this.log(`Products in ${category}:`, 'info');
      products.slice(0, 5).forEach(product => {
        const productInfo = product.productBaseInfoV1 || product.productBaseInfo?.productAttributes;
        if (productInfo) {
          this.log(`   - ${productInfo.title} (₹${productInfo.flipkartSellingPrice?.amount || productInfo.sellingPrice?.amount})`, 'test');
        }
      });
      
      return result.data;
    } else {
      this.logTestResult('Category Product Feed', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  // ============ SEARCH OPERATIONS ============

  async testProductSearch() {
    this.log('🔍 Testing Product Search...', 'info');
    
    const searchQueries = [
      'mobile phone',
      'laptop',
      'headphones',
      'camera',
      'shoes'
    ];

    let totalResults = 0;
    let successfulSearches = 0;

    for (const query of searchQueries) {
      const url = `${BASE_URL}/1.0/search.json`;
      const result = await this.makeRequest(url, {
        params: {
          query: query,
          resultCount: 5
        }
      });
      
      if (result.success && result.data.productInfoList) {
        const count = result.data.productInfoList.length;
        totalResults += count;
        successfulSearches++;
        this.log(`   Query: "${query}" → ${count} results`, 'test');
        
        // Log first result details
        if (count > 0) {
          const firstProduct = result.data.productInfoList[0];
          const productInfo = firstProduct.productBaseInfoV1 || firstProduct.productBaseInfo?.productAttributes;
          if (productInfo) {
            this.log(`     Top result: ${productInfo.title} (₹${productInfo.flipkartSellingPrice?.amount || productInfo.sellingPrice?.amount})`, 'test');
          }
        }
      } else {
        this.log(`   Query: "${query}" → Failed (${result.status})`, 'test');
      }
    }

    if (successfulSearches > 0) {
      this.logTestResult(`Product Search (${successfulSearches}/${searchQueries.length} queries successful, ${totalResults} total results)`, true);
    } else {
      this.logTestResult('Product Search', false, new Error('All search queries failed'));
    }
  }

  async testProductByID() {
    this.log('🔎 Testing Product Search by ID...', 'info');
    
    // Use a common Flipkart product ID for testing (iPhone or popular product)
    const testProductIds = [
      'MOBG6VF5Q82T3XYZ', // Example product ID
      'MOBFKCTSVZAXGRDN'  // Another example
    ];

    let successfulQueries = 0;

    for (const productId of testProductIds) {
      const url = `${BASE_URL}/1.0/product.json`;
      const result = await this.makeRequest(url, {
        params: {
          id: productId
        }
      });
      
      if (result.success && result.data.productInfoList) {
        const products = result.data.productInfoList;
        successfulQueries++;
        
        this.log(`   Product ID: ${productId} → ${products.length} results`, 'test');
        
        if (products.length > 0) {
          const product = products[0];
          const productInfo = product.productBaseInfoV1 || product.productBaseInfo?.productAttributes;
          if (productInfo) {
            this.log(`     Product: ${productInfo.title}`, 'test');
            this.log(`     Price: ₹${productInfo.flipkartSellingPrice?.amount || productInfo.sellingPrice?.amount}`, 'test');
            this.log(`     Brand: ${productInfo.productBrand}`, 'test');
          }
        }
      } else {
        this.log(`   Product ID: ${productId} → Failed (${result.status})`, 'test');
      }
    }

    if (successfulQueries > 0) {
      this.logTestResult(`Product Search by ID (${successfulQueries}/${testProductIds.length} queries successful)`, true);
    } else {
      this.logTestResult('Product Search by ID', false, new Error('All product ID queries failed'));
    }
  }

  // ============ OFFERS OPERATIONS ============

  async testAllOffers() {
    this.log('🎁 Testing All Offers...', 'info');
    
    const url = `${BASE_URL}/offers/v1/all/json`;
    const result = await this.makeRequest(url);
    
    if (result.success && result.data.allOffersList) {
      const offers = result.data.allOffersList;
      this.discoveredOffers = offers.slice(0, 3); // Store first 3 for analysis
      
      this.logTestResult(`All Offers (${offers.length} offers found)`, true);
      
      // Log offer details
      this.log(`Active offers:`, 'info');
      offers.slice(0, 5).forEach((offer, index) => {
        this.log(`   ${index + 1}. ${offer.title} - ${offer.description}`, 'test');
        this.log(`      Category: ${offer.category} | Status: ${offer.availability}`, 'test');
        if (offer.startTime && offer.endTime) {
          const startDate = new Date(offer.startTime).toLocaleDateString();
          const endDate = new Date(offer.endTime).toLocaleDateString();
          this.log(`      Duration: ${startDate} to ${endDate}`, 'test');
        }
      });
      
      return result.data;
    } else {
      this.logTestResult('All Offers', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  async testDealsOfTheDay() {
    this.log('⚡ Testing Deals of the Day...', 'info');
    
    const url = `${BASE_URL}/offers/v1/dotd/json`;
    const result = await this.makeRequest(url);
    
    if (result.success && result.data.dotdList) {
      const deals = result.data.dotdList;
      
      this.logTestResult(`Deals of the Day (${deals.length} deals found)`, true);
      
      // Log deal details
      this.log(`Today's deals:`, 'info');
      deals.forEach((deal, index) => {
        this.log(`   ${index + 1}. ${deal.title} - ${deal.description}`, 'test');
        this.log(`      Status: ${deal.availability}`, 'test');
        if (deal.imageUrls && deal.imageUrls.length > 0) {
          this.log(`      Images: ${deal.imageUrls.length} available`, 'test');
        }
      });
      
      return result.data;
    } else {
      this.logTestResult('Deals of the Day', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  // ============ REPORTS OPERATIONS ============

  async testOrdersReport() {
    this.log('📊 Testing Orders Report...', 'info');
    
    const url = `${BASE_URL}/report/orders/detail/json`;
    const result = await this.makeRequest(url, {
      params: {
        startDate: '2024-01-01',
        endDate: new Date().toISOString().split('T')[0] // Today
      }
    });
    
    if (result.success) {
      // Orders report might be empty for new affiliates
      const orders = result.data.orderList || [];
      
      this.logTestResult(`Orders Report (${orders.length} orders found)`, true);
      
      if (orders.length > 0) {
        this.log(`Recent orders:`, 'info');
        orders.slice(0, 5).forEach((order, index) => {
          this.log(`   ${index + 1}. ${order.title} - ₹${order.price}`, 'test');
          this.log(`      Status: ${order.status} | Commission: ₹${order.tentativeCommission?.amount || 'N/A'}`, 'test');
        });
      } else {
        this.log(`No orders found (normal for new affiliate accounts)`, 'info');
      }
      
      return result.data;
    } else {
      this.logTestResult('Orders Report', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  async testAppInstallReport() {
    this.log('📱 Testing App Install Report...', 'info');
    
    const url = `${BASE_URL}/v1/appInstall/json`;
    const result = await this.makeRequest(url, {
      params: {
        startDate: '2024-01-01',
        endDate: new Date().toISOString().split('T')[0]
      }
    });
    
    if (result.success) {
      const installs = result.data.appInstallList || [];
      
      this.logTestResult(`App Install Report (${installs.length} installs found)`, true);
      
      if (installs.length > 0) {
        this.log(`App installs:`, 'info');
        installs.forEach((install, index) => {
          this.log(`   ${index + 1}. ${install.title} - ${install.installCount} installs`, 'test');
          this.log(`      Platform: ${install.os} | Commission: ₹${install.totalCommission}`, 'test');
        });
      } else {
        this.log(`No app installs found`, 'info');
      }
      
      return result.data;
    } else {
      this.logTestResult('App Install Report', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  // ============ DATA ANALYSIS ============

  async performDataAnalysis() {
    this.log('🔬 Performing Data Analysis...', 'info');
    
    let analysisCount = 0;

    // Analyze categories
    if (this.discoveredCategories.length > 0) {
      this.log(`📊 Category Analysis:`, 'info');
      this.log(`   Total categories: ${this.discoveredCategories.length}`, 'test');
      this.log(`   Sample categories: ${this.discoveredCategories.slice(0, 5).join(', ')}`, 'test');
      analysisCount++;
    }

    // Analyze offers
    if (this.discoveredOffers.length > 0) {
      this.log(`💰 Offers Analysis:`, 'info');
      const liveOffers = this.discoveredOffers.filter(offer => offer.availability === 'LIVE');
      this.log(`   Live offers: ${liveOffers.length}/${this.discoveredOffers.length}`, 'test');
      
      const categories = [...new Set(this.discoveredOffers.map(offer => offer.category))];
      this.log(`   Offer categories: ${categories.join(', ')}`, 'test');
      analysisCount++;
    }

    // Analyze products
    if (this.testedProducts.length > 0) {
      this.log(`🛍️ Product Analysis:`, 'info');
      this.log(`   Sample products analyzed: ${this.testedProducts.length}`, 'test');
      
      const brands = this.testedProducts.map(product => {
        const productInfo = product.productBaseInfoV1 || product.productBaseInfo?.productAttributes;
        return productInfo?.productBrand;
      }).filter(Boolean);
      
      if (brands.length > 0) {
        const uniqueBrands = [...new Set(brands)];
        this.log(`   Brands found: ${uniqueBrands.slice(0, 3).join(', ')}`, 'test');
      }
      analysisCount++;
    }

    if (analysisCount > 0) {
      this.logTestResult(`Data Analysis (${analysisCount} analysis performed)`, true);
    } else {
      this.logTestResult('Data Analysis', false, new Error('No data available for analysis'));
    }
  }

  // ============ SAVE RESULTS ============

  saveResults() {
    const endTime = new Date();
    const duration = endTime - this.startTime;
    
    const finalResults = {
      testRun: {
        startTime: this.startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: `${Math.round(duration / 1000)}s`,
        durationMs: duration
      },
      summary: {
        totalTests: this.results.passed + this.results.failed,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: `${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`
      },
      errors: this.results.errors,
      discoveredData: {
        categories: this.discoveredCategories.length,
        offers: this.discoveredOffers.length,
        products: this.testedProducts.length,
        sampleCategories: this.discoveredCategories.slice(0, 5),
        sampleOffers: this.discoveredOffers.map(offer => ({
          title: offer.title,
          category: offer.category,
          availability: offer.availability
        }))
      },
      environment: {
        affiliateIdAvailable: !!AFFILIATE_ID,
        affiliateTokenAvailable: !!AFFILIATE_TOKEN,
        nodeVersion: process.version,
        timestamp: endTime.toISOString()
      }
    };

    // Save results as JSON
    this.writeToFile(this.logFiles.results, JSON.stringify(finalResults, null, 2));
    
    // Add summary to main log
    this.writeToFile(this.logFiles.main, `\n🏁 Test completed: ${endTime.toISOString()}\n`);
    this.writeToFile(this.logFiles.main, `Duration: ${Math.round(duration / 1000)}s\n`);
    this.writeToFile(this.logFiles.main, `Results: ${this.results.passed} passed, ${this.results.failed} failed\n`);
  }

  // ============ MAIN TEST RUNNER ============

  async runAdvancedTests() {
    console.log(chalk.cyan.bold('🚀 ADVANCED FLIPKART AFFILIATE API TESTER'));
    console.log(chalk.cyan('============================================='));
    console.log(chalk.yellow(`🔑 Affiliate ID: ${AFFILIATE_ID ? 'Available' : 'Missing'}`));
    console.log(chalk.yellow(`🔑 Affiliate Token: ${AFFILIATE_TOKEN ? 'Available' : 'Missing'}`));
    console.log('');

    if (!AFFILIATE_ID || !AFFILIATE_TOKEN) {
      console.log(chalk.red('❌ Missing Flipkart affiliate credentials'));
      console.log(chalk.yellow('Add to .env file:'));
      console.log(chalk.gray('FLIPKART_AFFILIATE_ID=your_affiliate_id'));
      console.log(chalk.gray('FLIPKART_AFFILIATE_TOKEN=your_affiliate_token'));
      process.exit(1);
    }

    try {
      // Product Feed Operations
      await this.testProductFeedListing();
      await this.testCategoryProductFeed();

      // Search Operations
      await this.testProductSearch();
      await this.testProductByID();

      // Offers Operations
      await this.testAllOffers();
      await this.testDealsOfTheDay();

      // Reports Operations
      await this.testOrdersReport();
      await this.testAppInstallReport();

      // Data Analysis
      await this.performDataAnalysis();

    } catch (error) {
      this.log(`Fatal error: ${error.message}`, 'error');
    }

    this.saveResults();
    this.printSummary();
  }

  printSummary() {
    console.log('');
    console.log(chalk.cyan.bold('📊 ADVANCED FLIPKART TESTS SUMMARY'));
    console.log(chalk.cyan('============================================='));
    
    if (this.results.failed === 0) {
      console.log(chalk.green.bold('🎉 ALL ADVANCED TESTS PASSED!'));
      console.log(chalk.green(`✅ ${this.results.passed} operations successful`));
    } else {
      console.log(chalk.yellow(`⚠️  ${this.results.passed} passed, ${this.results.failed} failed`));
      
      if (this.results.errors.length > 0) {
        console.log('');
        console.log(chalk.red('❌ Failed operations:'));
        this.results.errors.forEach(error => {
          console.log(chalk.red(`  └─ ${error.test}: ${error.error}`));
        });
      }
    }

    console.log('');
    console.log(chalk.blue('🔧 Operations tested:'));
    console.log('• Product Feed: Category listing, Product feeds');
    console.log('• Search: Keyword search, Product ID lookup');
    console.log('• Offers: All offers, Deals of the day');
    console.log('• Reports: Orders, App installs');
    console.log('• Analysis: Data insights and statistics');
    
    console.log('');
    console.log(chalk.blue('📈 Data discovered:'));
    console.log(`• Categories: ${this.discoveredCategories.length}`);
    console.log(`• Offers: ${this.discoveredOffers.length}`);
    console.log(`• Products: ${this.testedProducts.length}`);
    
    console.log('');
    console.log(chalk.blue('📝 Log files saved:'));
    console.log(chalk.gray(`   Main log: ${this.logFiles.main}`));
    console.log(chalk.gray(`   API calls: ${this.logFiles.api}`));
    console.log(chalk.gray(`   Results: ${this.logFiles.results}`));
  }
}

// Run the advanced tests
const tester = new AdvancedFlipkartAPITester();
tester.runAdvancedTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});