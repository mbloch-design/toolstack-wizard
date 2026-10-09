import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Real Node headers/status/end semantics; only Vercel's convenience methods
// and parsed request fields are supplied by this local fixture.
export function httpFixture(body?: unknown, method = "POST", origin?: string) {
  const req: VercelRequest = Object.assign(new IncomingMessage(new Socket()), {
    body, query: {}, cookies: {},
  });
  req.method = method;
  if (origin) req.headers.origin = origin;
  let jsonBody: unknown;
  const res = Object.assign(new ServerResponse(req), {
    status(code: number) { res.statusCode = code; return res; },
    json(value: unknown) { jsonBody = value; res.end(JSON.stringify(value)); return res; },
    send(value: string) { res.end(value); return res; },
    redirect(statusOrUrl: number | string, url?: string) {
      res.statusCode = typeof statusOrUrl === "number" ? statusOrUrl : 302;
      res.setHeader("Location", typeof statusOrUrl === "string" ? statusOrUrl : url!);
      res.end(); return res;
    },
  }) as VercelResponse;
  return { req, res, get body() { return jsonBody; } };
}
