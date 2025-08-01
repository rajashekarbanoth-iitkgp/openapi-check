import 'dotenv/config';

export const API_CONFIG = {
  // Google API Base URLs
  DRIVE: {
    baseUrl: 'https://www.googleapis.com/drive/v3',
    endpoints: {
      files: '/files',
      fileById: (id) => `/files/${id}`,
      upload: '/upload/drive/v3/files'
    }
  },
  
  CALENDAR: {
    baseUrl: 'https://www.googleapis.com/calendar/v3',
    endpoints: {
      calendars: '/calendars',
      events: (calendarId = 'primary') => `/calendars/${calendarId}/events`,
      eventById: (calendarId = 'primary', eventId) => `/calendars/${calendarId}/events/${eventId}`
    }
  },
  
  GMAIL: {
    baseUrl: 'https://gmail.googleapis.com',
    endpoints: {
      messages: (userId = 'me') => `/gmail/v1/users/${userId}/messages`,
      messageById: (userId = 'me', messageId) => `/gmail/v1/users/${userId}/messages/${messageId}`,
      send: (userId = 'me') => `/gmail/v1/users/${userId}/messages/send`,
      labels: (userId = 'me') => `/gmail/v1/users/${userId}/labels`
    }
  },
  
  CONTACTS: {
    baseUrl: 'https://people.googleapis.com',
    endpoints: {
      people: '/v1/people/me/connections',
      person: '/v1/people',
      createContact: '/v1/people:createContact',
      search: '/v1/people:searchContacts'
    }
  },
  
  ADSENSE: {
    baseUrl: 'https://adsense.googleapis.com/v2',
    endpoints: {
      accounts: '/accounts',
      accountById: (accountId) => `/accounts/${accountId}`,
      adclients: '/adclients',
      adclientsByAccount: (accountId) => `/accounts/${accountId}/adclients`,
      adunits: (adClientId) => `/adclients/${adClientId}/adunits`,
      adunitById: (adClientId, adUnitId) => `/adclients/${adClientId}/adunits/${adUnitId}`,
      adcode: (adClientId, adUnitId) => `/adclients/${adClientId}/adunits/${adUnitId}/adcode`,
      customchannels: (adClientId) => `/adclients/${adClientId}/customchannels`,
      customchannelById: (adClientId, customChannelId) => `/adclients/${adClientId}/customchannels/${customChannelId}`,
      urlchannels: (adClientId) => `/adclients/${adClientId}/urlchannels`,
      alerts: '/alerts',
      alertsByAccount: (accountId) => `/accounts/${accountId}/alerts`,
      payments: '/payments',
      paymentsByAccount: (accountId) => `/accounts/${accountId}/payments`,
      reports: '/reports',
      reportsByAccount: (accountId) => `/accounts/${accountId}/reports`,
      savedReports: '/reports/saved',
      savedReportsByAccount: (accountId) => `/accounts/${accountId}/reports/saved`,
      metadata: {
        dimensions: '/metadata/dimensions',
        metrics: '/metadata/metrics'
      },
      savedAdStyles: '/savedadstyles',
      savedAdStylesByAccount: (accountId) => `/accounts/${accountId}/savedadstyles`
    }
  }
};

// OAuth 2.0 Scopes for each API
export const SCOPES = {
  DRIVE: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly'
  ],
  CALENDAR: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.google.com/calendar/feeds'
  ],
  GMAIL: [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://mail.google.com/'
  ],
  CONTACTS: [
    'https://www.googleapis.com/auth/contacts',
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.google.com/m8/feeds'
  ],
  ADSENSE: [
    'https://www.googleapis.com/auth/adsense',
    'https://www.googleapis.com/auth/adsense.readonly'
  ]
};

// Test configuration
export const TEST_CONFIG = {
  // Test data limits
  maxRetries: 3,
  timeout: 10000, // 10 seconds
  
  // Mock data generation settings
  mockDataCount: {
    files: 5,
    events: 3,
    messages: 10,
    contacts: 8
  },
  
  // Test scenarios
  testScenarios: {
    READ_ONLY: 'read_only',
    WRITE_OPERATIONS: 'write_operations',
    FULL_CRUD: 'full_crud'
  }
};

// Environment variables
export const ENV = {
  // Google OAuth credentials
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  
  // Test access token (if available)
  ACCESS_TOKEN: process.env.GOOGLE_ACCESS_TOKEN,
  REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  
  // Test settings
  TEST_MODE: process.env.TEST_MODE || 'mock', // 'mock' or 'live'
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Common headers for API requests
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'Google-APIs-Tester/1.0'
};

// Error codes and messages
export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
  
  messages: {
    401: 'Authentication failed - Check your access token',
    403: 'Permission denied - Check your OAuth scopes',
    404: 'Resource not found',
    429: 'Rate limit exceeded - Too many requests',
    500: 'Google API server error'
  }
};

export default {
  API_CONFIG,
  SCOPES,
  TEST_CONFIG,
  ENV,
  DEFAULT_HEADERS,
  ERROR_CODES
}; 