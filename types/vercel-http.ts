import type { IncomingMessage, ServerResponse } from "node:http";

// Type-only contract for Vercel's Node /api handlers. The platform supplies
// parsed request fields and response helpers; this file adds no runtime adapter.
// Keep body/helper payloads compatible with @vercel/node 5.10.2. Validation
// belongs to each handler, including bodies that are absent or are not objects.
export type VercelRequest = IncomingMessage & {
  query: Record<string, string | string[]>;
  cookies: Record<string, string>;
  body: any;
};

export type VercelResponse = ServerResponse & {
  send: (body: any) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  status: (statusCode: number) => VercelResponse;
  redirect: (statusOrUrl: string | number, url?: string) => VercelResponse;
};
