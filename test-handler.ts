import handler from './api/generateDiscover.ts';

// Create a mock Vercel Request and Response
const req = {
  method: 'POST',
  headers: {
    authorization: 'Bearer fake-token'
  },
  body: {
    entries: [{ id: '1', transcript: 'test entry' }],
    userProfile: { name: 'David' }
  }
};

const res = {
  status: function(code: number) {
    this.statusCode = code;
    return this;
  },
  json: function(data: any) {
    console.log("Status:", this.statusCode);
    console.log("Response:", data);
  }
};

// We must bypass the firebase token check which is imported locally
import * as verifyToken from './api/lib/verifyToken.ts';
// Actually, vitest or ts-node would be easier. Let's just create a test file and run vitest.
