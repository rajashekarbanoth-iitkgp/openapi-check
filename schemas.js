import { z } from 'zod';

// ============ GOOGLE DRIVE SCHEMAS ============
export const DriveFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string().optional(),
  parents: z.array(z.string()).optional(),
  size: z.string().optional(),
  createdTime: z.string().optional(),
  modifiedTime: z.string().optional(),
  webViewLink: z.string().optional(),
  webContentLink: z.string().optional(),
  owners: z.array(z.object({
    displayName: z.string(),
    emailAddress: z.string().email(),
    photoLink: z.string().optional()
  })).optional()
});

export const DriveFileListSchema = z.object({
  kind: z.literal('drive#fileList'),
  files: z.array(DriveFileSchema),
  nextPageToken: z.string().optional(),
  incompleteSearch: z.boolean().optional()
});

export const DriveCreateFileSchema = z.object({
  name: z.string(),
  parents: z.array(z.string()).optional(),
  mimeType: z.string().optional()
});

// ============ GOOGLE CALENDAR SCHEMAS ============
export const CalendarEventSchema = z.object({
  id: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  start: z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional()
  }),
  end: z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional()
  }),
  attendees: z.array(z.object({
    email: z.string().email(),
    displayName: z.string().optional(),
    responseStatus: z.enum(['needsAction', 'declined', 'tentative', 'accepted']).optional()
  })).optional(),
  location: z.string().optional(),
  status: z.enum(['tentative', 'confirmed', 'cancelled']).optional()
});

export const CalendarEventListSchema = z.object({
  kind: z.literal('calendar#events'),
  items: z.array(CalendarEventSchema),
  nextPageToken: z.string().optional(),
  summary: z.string(),
  timeZone: z.string()
});

export const CalendarCreateEventSchema = z.object({
  summary: z.string(),
  description: z.string().optional(),
  start: z.object({
    dateTime: z.string(),
    timeZone: z.string().optional()
  }),
  end: z.object({
    dateTime: z.string(),
    timeZone: z.string().optional()
  }),
  attendees: z.array(z.object({
    email: z.string().email()
  })).optional()
});

// ============ GMAIL SCHEMAS ============
export const GmailMessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  labelIds: z.array(z.string()).optional(),
  snippet: z.string(),
  historyId: z.string(),
  internalDate: z.string(),
  payload: z.object({
    partId: z.string().optional(),
    mimeType: z.string(),
    filename: z.string().optional(),
    headers: z.array(z.object({
      name: z.string(),
      value: z.string()
    })),
    body: z.object({
      attachmentId: z.string().optional(),
      size: z.number(),
      data: z.string().optional()
    }).optional()
  }).optional(),
  sizeEstimate: z.number().optional()
});

export const GmailMessageListSchema = z.object({
  messages: z.array(z.object({
    id: z.string(),
    threadId: z.string()
  })),
  nextPageToken: z.string().optional(),
  resultSizeEstimate: z.number()
});

export const GmailSendMessageSchema = z.object({
  raw: z.string() // Base64 encoded email
});

// ============ GOOGLE CONTACTS (PEOPLE API) SCHEMAS ============
export const ContactPersonSchema = z.object({
  resourceName: z.string(),
  etag: z.string(),
  names: z.array(z.object({
    displayName: z.string(),
    familyName: z.string().optional(),
    givenName: z.string().optional(),
    middleName: z.string().optional()
  })).optional(),
  emailAddresses: z.array(z.object({
    value: z.string().email(),
    type: z.string().optional(),
    formattedType: z.string().optional()
  })).optional(),
  phoneNumbers: z.array(z.object({
    value: z.string(),
    type: z.string().optional(),
    formattedType: z.string().optional()
  })).optional(),
  addresses: z.array(z.object({
    formattedValue: z.string(),
    type: z.string().optional(),
    streetAddress: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional()
  })).optional(),
  organizations: z.array(z.object({
    name: z.string(),
    title: z.string().optional(),
    department: z.string().optional()
  })).optional()
});

export const ContactListSchema = z.object({
  connections: z.array(ContactPersonSchema),
  nextPageToken: z.string().optional(),
  totalPeople: z.number(),
  totalItems: z.number()
});

export const ContactCreateSchema = z.object({
  names: z.array(z.object({
    givenName: z.string(),
    familyName: z.string().optional()
  })),
  emailAddresses: z.array(z.object({
    value: z.string().email()
  })).optional(),
  phoneNumbers: z.array(z.object({
    value: z.string()
  })).optional()
});

// ============ ERROR SCHEMAS ============
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.number(),
    message: z.string(),
    status: z.string().optional(),
    details: z.array(z.any()).optional()
  })
});

// ============ AUTH SCHEMAS ============
export const AuthTokenSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string()
}); 