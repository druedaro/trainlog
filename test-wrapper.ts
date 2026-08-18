import handler from './api/generateDiscover.ts';

// We need to bypass the Auth check inside the handler.
// Actually, since it imports './lib/verifyToken.js', I can create a mock!
