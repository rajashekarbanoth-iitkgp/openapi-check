# Google APIs Tester 🧪

Comprehensive testing tool for Google APIs (Drive, Calendar, Gmail, Contacts) using [zod-schema-faker](https://www.npmjs.com/package/zod-schema-faker) for realistic test data generation.

## Features ✨

- **Complete API Testing**: Tests Google Drive, Calendar, Gmail, and Contacts APIs
- **Schema Validation**: Uses Zod schemas to validate API responses
- **Mock Data Generation**: Generates realistic test data using zod-schema-faker
- **Detailed Error Reporting**: Shows exactly what went wrong and why
- **Color-coded Output**: Easy-to-read test results with beautiful terminal colors
- **Individual API Testing**: Test specific APIs independently
- **Environment Configuration**: Flexible setup for different testing scenarios

## Installation 🚀

```bash
# Clone or copy the files to your project directory

# Install dependencies using bun (as per user preference)
bun install

# Copy environment template
cp env.example .env

# Edit .env file with your Google API credentials
```

## Setup 🔧

### 1. Get Google API Credentials

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing
3. Enable the following APIs:
   - Google Drive API
   - Google Calendar API
   - Gmail API
   - Google People API (for Contacts)
4. Create OAuth 2.0 credentials
5. Add your credentials to `.env` file

### 2. Get Access Token (Optional)

For live testing, you need an access token:

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon and check "Use your own OAuth credentials"
3. Enter your Client ID and Client Secret
4. Select the scopes you need:
   ```
   https://www.googleapis.com/auth/drive
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/gmail.modify
   https://www.googleapis.com/auth/contacts
   ```
5. Authorize and get the access token
6. Add the token to your `.env` file

## Usage 📝

### Run All Tests
```bash
bun test
# or
bun run test-google-apis.js
```

### Test Specific APIs
```bash
# Test only Google Drive
bun run test:drive

# Test only Google Calendar
bun run test:calendar

# Test only Gmail
bun run test:gmail

# Test only Google Contacts
bun run test:contacts
```

### Using Command Line Arguments
```bash
# Test specific API
bun run test-google-apis.js --api=drive
bun run test-google-apis.js --api=calendar
bun run test-google-apis.js --api=gmail
bun run test-google-apis.js --api=contacts
```

## What It Tests 🔍

### Google Drive API
- ✅ List files with schema validation
- ✅ Create file with mock data
- 📊 Validates file structure and metadata

### Google Calendar API
- ✅ List events with schema validation
- ✅ Create event with mock data
- 📊 Validates event structure and date formats

### Gmail API
- ✅ List messages with schema validation
- ✅ Send email with mock data
- 📊 Validates message structure and headers

### Google Contacts API (People API)
- ✅ List contacts with schema validation
- ✅ Create contact with mock data
- 📊 Validates contact structure and fields

## Test Output Example 📊

```
🧪 GOOGLE APIS TESTER
=====================================
🔑 Auth Token: Available
🧪 Test Mode: mock
⏱️  Timeout: 10000ms

2024-01-01T12:00:00.000Z [INFO] 🚀 Testing Google Drive API...
2024-01-01T12:00:00.000Z [TEST] Generated mock file: {...}
2024-01-01T12:00:00.000Z [TEST] 🔄 Making request to: https://www.googleapis.com/drive/v3/files
2024-01-01T12:00:01.000Z [SUCCESS] ✅ DRIVE: List files + Schema validation

📊 TEST RESULTS SUMMARY
=====================================
DRIVE      ✅ PASS (2 passed, 0 failed)
CALENDAR   ✅ PASS (2 passed, 0 failed)
GMAIL      ❌ FAIL (1 passed, 1 failed)
  └─ Send email (mock data): 403: Insufficient Permission
CONTACTS   ✅ PASS (2 passed, 0 failed)

=====================================
Total Passed: 7
Total Failed: 1

⚠️  SOME TESTS FAILED

Common issues:
• Missing or invalid access token (401 errors)
• Insufficient OAuth scopes (403 errors)
• Rate limiting (429 errors)
• Network connectivity issues
```

## Error Codes & Solutions 🛠️

| Error Code | Meaning | Solution |
|------------|---------|----------|
| **401** | Authentication failed | Check your access token |
| **403** | Permission denied | Check your OAuth scopes |
| **404** | Resource not found | Check API endpoints |
| **429** | Rate limit exceeded | Wait and retry |
| **500** | Server error | Google API issue, try later |

## Configuration 📋

### Environment Variables

- `GOOGLE_CLIENT_ID`: Your OAuth 2.0 client ID
- `GOOGLE_CLIENT_SECRET`: Your OAuth 2.0 client secret
- `GOOGLE_ACCESS_TOKEN`: Access token for live testing
- `TEST_MODE`: 'mock' (schema testing) or 'live' (actual API calls)
- `LOG_LEVEL`: 'debug', 'info', 'warn', 'error'

### Test Modes

1. **Mock Mode** (`TEST_MODE=mock`):
   - Tests API endpoints with authentication
   - Validates response schemas
   - Generates realistic test data
   - Safer for testing without modifying data

2. **Live Mode** (`TEST_MODE=live`):
   - Makes actual API calls
   - Creates real data (use with caution!)
   - Full end-to-end testing

## Files Structure 📁

```
├── package.json          # Dependencies and scripts
├── schemas.js            # Zod schemas for all Google APIs
├── config.js             # API endpoints and configuration
├── test-google-apis.js   # Main test runner script
├── env.example           # Environment variables template
└── GOOGLE-APIS-TESTER.md # This documentation
```

## Dependencies 📦

- **zod**: Schema validation library
- **zod-schema-faker**: Generate mock data from Zod schemas  
- **@faker-js/faker**: Realistic fake data generation
- **axios**: HTTP client for API requests
- **chalk**: Beautiful terminal colors
- **dotenv**: Environment variables support

## Contributing 🤝

Feel free to improve this tester by:
- Adding more test scenarios
- Improving error handling
- Adding more Google APIs
- Enhancing mock data generation

## License 📄

MIT License - feel free to use and modify as needed!

---

**Intha script nalla detailed ah test pannum! Google APIs ellam properly work aaguthu nu check pannalam. Happy testing! 🎉** 