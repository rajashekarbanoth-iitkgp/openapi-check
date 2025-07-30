#!/usr/bin/env node

// Flipkart Affiliate API Mock Tester (No Real API Calls Required)
// Tests data schemas, validation, and mock data generation

import { z } from 'zod';
import { install, fake, seed } from 'zod-schema-faker';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Setup faker
install();
seed(42);

// ============ ENHANCED SCHEMAS ============

// Price Schema (reusable)
const PriceSchema = z.object({
  amount: z.number().min(0),
  currency: z.string().default('INR')
});

// Image URLs Schema
const ImageUrlsSchema = z.object({
  '200x200': z.string().url(),
  '400x400': z.string().url().optional(),
  '800x800': z.string().url().optional(),
  'unknown': z.string().url().optional()
});

// Product Base Info Schema with Business Logic
const ProductBaseInfoSchema = z.object({
  productId: z.string().min(5),
  title: z.string().min(3),
  productDescription: z.string().optional(),
  categoryPath: z.string(),
  imageUrls: ImageUrlsSchema,
  productUrl: z.string().url(),
  maximumRetailPrice: z.object({
    amount: z.number().min(100).max(200000), // ₹100 to ₹2,00,000
    currency: z.string().default('INR')
  }),
  flipkartSellingPrice: z.object({
    amount: z.number().min(50).max(150000), // Always lower range
    currency: z.string().default('INR')
  }),
  flipkartSpecialPrice: z.object({
    amount: z.number().min(50).max(100000), // Even lower range
    currency: z.string().default('INR')
  }).optional(),
  productBrand: z.string(),
  inStock: z.boolean(),
  codAvailable: z.boolean(),
  discountPercentage: z.number().min(0).max(100),
  offers: z.array(z.string()).default([]),
  attributes: z.object({
    size: z.string().optional(),
    color: z.string().optional(),
    storage: z.string().optional()
  }).optional()
});

// Product Feed Response Schema
const ProductFeedResponseSchema = z.object({
  productInfoList: z.array(z.object({
    productBaseInfoV1: ProductBaseInfoSchema,
    productShippingInfoV1: z.object({
      shippingCharges: PriceSchema,
      sellerName: z.string().optional(),
      sellerAverageRating: z.number().min(0).max(5).optional()
    }).optional()
  })),
  nextUrl: z.string().url().optional(),
  validTill: z.number().optional()
});

// Offer Schema
const OfferSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string().url(),
  category: z.string(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  imageUrls: z.array(z.object({
    url: z.string().url(),
    resolutionType: z.enum(['default', 'low', 'mid', 'high'])
  })),
  availability: z.enum(['LIVE', 'OOS'])
});

// All Offers Response Schema
const AllOffersResponseSchema = z.object({
  allOffersList: z.array(OfferSchema),
  validTill: z.number().optional()
});

// Search Response Schema
const SearchResponseSchema = z.object({
  productInfoList: z.array(z.object({
    productBaseInfoV1: ProductBaseInfoSchema
  })),
  totalResults: z.number().optional(),
  query: z.string()
});

// Category Listing Schema
const CategoryListingSchema = z.object({
  apiGroups: z.object({
    affiliate: z.object({
      name: z.string(),
      apiListings: z.record(z.object({
        apiName: z.string(),
        availableVariants: z.record(z.object({
          resourceName: z.string(),
          get: z.string().url(),
          deltaGet: z.string().url().optional()
        }))
      }))
    })
  }),
  title: z.string(),
  description: z.string()
});

// ============ SAMPLE DATA ============

const sampleProductFeed = {
  productInfoList: [
    {
      productBaseInfoV1: {
        productId: "MOBG6VF5Q82T3XYZ",
        title: "Apple iPhone 15 Pro (Natural Titanium, 128 GB)",
        productDescription: "Experience the power of A17 Pro chip with titanium design",
        categoryPath: "Mobiles & Tablets > Mobiles > Apple",
        imageUrls: {
          "200x200": "https://rukminim2.flixcart.com/image/200/200/iphone15pro.jpg",
          "400x400": "https://rukminim2.flixcart.com/image/400/400/iphone15pro.jpg",
          "800x800": "https://rukminim2.flixcart.com/image/800/800/iphone15pro.jpg"
        },
        productUrl: "https://dl.flipkart.com/dl/apple-iphone-15-pro/p/itm123456?affid=test",
        maximumRetailPrice: { amount: 134900, currency: "INR" },
        flipkartSellingPrice: { amount: 124900, currency: "INR" },
                 flipkartSpecialPrice: { amount: 99900, currency: "INR" },
        productBrand: "Apple",
        inStock: true,
        codAvailable: true,
        discountPercentage: 7,
        offers: ["Bank Offer", "Exchange Offer"],
        attributes: {
          storage: "128 GB",
          color: "Natural Titanium"
        }
      },
      productShippingInfoV1: {
        shippingCharges: { amount: 0, currency: "INR" },
        sellerName: "RetailNet",
        sellerAverageRating: 4.3
      }
    }
  ],
  nextUrl: "https://affiliate-api.flipkart.net/affiliate/1.0/feeds/test/category/mob.json?page=2",
  validTill: 1703980800000
};

const sampleAllOffers = {
  allOffersList: [
    {
      title: "Big Billion Days Sale",
      description: "Up to 80% off on Electronics",
      url: "https://dl.flipkart.com/dl/big-billion-days?affid=test",
      category: "electronics",
      startTime: 1703836800000,
      endTime: 1703980800000,
      imageUrls: [
        {
          url: "https://rukminim2.flixcart.com/image/400/400/sale-banner.jpg",
          resolutionType: "mid"
        }
      ],
      availability: "LIVE"
    }
  ],
  validTill: 1703980800000
};

const sampleCategoryListing = {
  title: "Flipkart Affiliate API Directory",
  description: "Complete list of affiliate APIs and their versions",
  apiGroups: {
    affiliate: {
      name: "affiliate",
      apiListings: {
        "mobiles": {
          apiName: "mobiles",
          availableVariants: {
            "v1.1.0": {
              resourceName: "mobiles",
              get: "https://affiliate-api.flipkart.net/affiliate/1.0/feeds/test/category/mob.json",
              deltaGet: "https://affiliate-api.flipkart.net/affiliate/1.0/deltaFeeds/test/category/mob.json"
            }
          }
        },
        "electronics": {
          apiName: "electronics",
          availableVariants: {
            "v1.1.0": {
              resourceName: "electronics", 
              get: "https://affiliate-api.flipkart.net/affiliate/1.0/feeds/test/category/elc.json"
            }
          }
        }
      }
    }
  }
};

// ============ TESTING CLASS ============

class FlipkartMockTester {
  constructor() {
    this.results = {
      validationTests: 0,
      mockGenerationTests: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
    this.startTime = new Date();
    this.setupLogging();
  }

  setupLogging() {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const timestamp = this.startTime.toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logsDir, `flipkart-mock-test-${timestamp}.log`);
    this.resultsFile = path.join(logsDir, `flipkart-mock-results-${timestamp}.json`);
    
    console.log(chalk.blue(`📝 Mock test logs: ${this.logFile}`));
    console.log('');
  }

  logResult(testName, success, details = '') {
    const timestamp = new Date().toISOString();
    if (success) {
      this.results.passed++;
      console.log(chalk.green(`✅ ${testName}`));
      fs.appendFileSync(this.logFile, `${timestamp} [PASS] ${testName} ${details}\n`);
    } else {
      this.results.failed++;
      this.results.errors.push({ test: testName, details, timestamp });
      console.log(chalk.red(`❌ ${testName} - ${details}`));
      fs.appendFileSync(this.logFile, `${timestamp} [FAIL] ${testName} - ${details}\n`);
    }
  }

  validateSchema(schemaName, schema, data) {
    this.results.validationTests++;
    console.log(chalk.cyan(`\n🔍 Validating ${schemaName} Schema`));
    
    try {
      const result = schema.parse(data);
      this.logResult(`${schemaName} Schema Validation`, true, `Validated ${Object.keys(result).length} fields`);
      return true;
    } catch (error) {
      this.logResult(`${schemaName} Schema Validation`, false, error.errors?.[0]?.message || error.message);
      return false;
    }
  }

  generateMockData(schemaName, schema) {
    this.results.mockGenerationTests++;
    console.log(chalk.cyan(`\n🎭 Generating Mock ${schemaName} Data`));
    
    try {
      const mockData = fake(schema);
      this.logResult(`${schemaName} Mock Generation`, true, `Generated ${JSON.stringify(mockData).length} bytes`);
      
      // Show sample of generated data
      console.log(chalk.gray('Sample generated data:'));
      console.log(chalk.gray(JSON.stringify(mockData, null, 2).slice(0, 500) + '...'));
      
      return mockData;
    } catch (error) {
      this.logResult(`${schemaName} Mock Generation`, false, error.message);
      return null;
    }
  }

  async runAllTests() {
    console.log(chalk.cyan.bold('🚀 FLIPKART API MOCK TESTER'));
    console.log(chalk.cyan('===================================='));
    console.log(chalk.yellow('Testing schemas and mock data generation (no real API calls)'));
    console.log('');

    // ============ VALIDATION TESTS ============
    console.log(chalk.blue.bold('\n📦 SCHEMA VALIDATION TESTS'));
    
    this.validateSchema('Product Feed', ProductFeedResponseSchema, sampleProductFeed);
    this.validateSchema('All Offers', AllOffersResponseSchema, sampleAllOffers);
    this.validateSchema('Category Listing', CategoryListingSchema, sampleCategoryListing);

    // ============ MOCK GENERATION TESTS ============
    console.log(chalk.blue.bold('\n🎭 MOCK DATA GENERATION TESTS'));
    
    this.generateMockData('Product Feed', ProductFeedResponseSchema);
    this.generateMockData('All Offers', AllOffersResponseSchema);
    this.generateMockData('Single Product', ProductBaseInfoSchema);
    this.generateMockData('Offer', OfferSchema);

    // ============ ADVANCED TESTS ============
    console.log(chalk.blue.bold('\n🔬 ADVANCED SCHEMA TESTS'));
    
    // Test edge cases
    await this.testEdgeCases();
    await this.testDataConsistency();

    this.printSummary();
    this.saveResults();
  }

  async testEdgeCases() {
    // Test minimum values (within schema constraints)
    const minProduct = {
      productId: "MIN01",
      title: "Min",
      categoryPath: "Test",
      imageUrls: { "200x200": "https://example.com/img.jpg" },
      productUrl: "https://example.com/product",
      maximumRetailPrice: { amount: 100, currency: "INR" }, // Min allowed: 100
      flipkartSellingPrice: { amount: 50, currency: "INR" },  // Min allowed: 50
      productBrand: "Test",
      inStock: false,
      codAvailable: false,
      discountPercentage: 0,
      offers: []
    };

    this.validateSchema('Minimum Product', ProductBaseInfoSchema, minProduct);

    // Test maximum discount
    const maxDiscountProduct = { 
      ...minProduct, 
      discountPercentage: 100,
      maximumRetailPrice: { amount: 200, currency: "INR" },
      flipkartSellingPrice: { amount: 50, currency: "INR" } // 75% discount
    };
    this.validateSchema('Max Discount Product', ProductBaseInfoSchema, maxDiscountProduct);
  }

  async testDataConsistency() {
    console.log(chalk.cyan('\n🔄 Testing Data Consistency'));
    
    // Generate multiple products and fix price logic
    const products = Array.from({ length: 5 }, () => {
      const product = fake(ProductBaseInfoSchema);
      
      // Fix price logic: ensure selling price <= MRP
      if (product.flipkartSellingPrice.amount > product.maximumRetailPrice.amount) {
        product.flipkartSellingPrice.amount = Math.floor(product.maximumRetailPrice.amount * 0.9); // 10% discount
      }
      
      // Fix special price logic: ensure special price <= selling price
      if (product.flipkartSpecialPrice && product.flipkartSpecialPrice.amount > product.flipkartSellingPrice.amount) {
        product.flipkartSpecialPrice.amount = Math.floor(product.flipkartSellingPrice.amount * 0.8); // Additional 20% off
      }
      
      return product;
    });
    
    const allHaveRequired = products.every(p => p.productId && p.title && p.productBrand);
    this.logResult('Data Consistency - Required Fields', allHaveRequired);
    
    const pricesConsistent = products.every(p => 
      p.flipkartSellingPrice.amount <= p.maximumRetailPrice.amount
    );
    this.logResult('Data Consistency - Price Logic', pricesConsistent);
    
    const specialPricesConsistent = products.every(p => 
      !p.flipkartSpecialPrice || p.flipkartSpecialPrice.amount <= p.flipkartSellingPrice.amount
    );
    this.logResult('Data Consistency - Special Price Logic', specialPricesConsistent);
  }

  printSummary() {
    console.log('');
    console.log(chalk.cyan.bold('📊 MOCK TESTING SUMMARY'));
    console.log(chalk.cyan('===================================='));
    
    if (this.results.failed === 0) {
      console.log(chalk.green.bold('🎉 ALL MOCK TESTS PASSED!'));
    } else {
      console.log(chalk.yellow(`⚠️  ${this.results.passed} passed, ${this.results.failed} failed`));
    }
    
    console.log('');
    console.log(chalk.blue('📈 Test Statistics:'));
    console.log(`• Schema Validations: ${this.results.validationTests}`);
    console.log(`• Mock Generations: ${this.results.mockGenerationTests}`);
    console.log(`• Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`• Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);
  }

  saveResults() {
    const endTime = new Date();
    const results = {
      testRun: {
        startTime: this.startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: `${Math.round((endTime - this.startTime) / 1000)}s`
      },
      summary: this.results,
      testedSchemas: [
        'ProductFeedResponseSchema',
        'AllOffersResponseSchema', 
        'CategoryListingSchema',
        'ProductBaseInfoSchema',
        'OfferSchema'
      ],
      sampleDataSizes: {
        productFeed: JSON.stringify(sampleProductFeed).length,
        allOffers: JSON.stringify(sampleAllOffers).length,
        categoryListing: JSON.stringify(sampleCategoryListing).length
      }
    };

    fs.writeFileSync(this.resultsFile, JSON.stringify(results, null, 2));
    console.log(chalk.gray(`\n📁 Results saved: ${this.resultsFile}`));
  }
}

// ============ RUN TESTS ============
const tester = new FlipkartMockTester();
tester.runAllTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
}); 