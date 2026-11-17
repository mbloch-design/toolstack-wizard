import type { LookupAddress } from "node:dns";
import { request } from "node:https";
import { BlockList, isIP } from "node:net";
import { Readable } from "node:stream";

const reserved = new BlockList();
const nonPublicV4 = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 3],
] as const;
for (const [network, prefix] of nonPublicV4) reserved.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of [["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20]] as const) {
  reserved.addSubnet(network, prefix, "ipv6");
}
const ipv6Global = new BlockList();
ipv6Global.addSubnet("2000::", 3, "ipv6");

export function isPublicBadgeAddress(address: string) {
  if (isIP(address) === 4) return !reserved.check(address, "ipv4");
  return isIP(address) === 6 && ipv6Global.check(address, "ipv6") && !reserved.check(address, "ipv6");
}

export const pinnedBadgeTransport = {
  isPublicAddress: isPublicBadgeAddress,
  // Use the validated IP on the actual TLS connection. The original hostname is
  // still used for TLS certificate verification and the Host header.
  fetch(url: URL, address: LookupAddress, signal: AbortSignal) {
    return new Promise<Response>((resolve, reject) => {
      const outgoing = request(url, {
        agent: false, family: address.family, signal,
        lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
        headers: { "Accept-Encoding": "identity", "User-Agent": "ToolTrimBadgeVerifier/1.2 (+https://tooltrim.com)" },
      }, (incoming) => {
        const incomingStatus = incoming.statusCode ?? 502;
        const status = incomingStatus >= 200 && incomingStatus <= 599 ? incomingStatus : 502;
        const headers = new Headers();
        for (const [key, value] of Object.entries(incoming.headers)) {
          if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
        }
        if (headers.has("content-encoding") && headers.get("content-encoding") !== "identity") {
          incoming.destroy();
          reject(new Error("page_unreachable"));
          return;
        }
        const acceptsBody = status >= 200 && ![204, 205, 304].includes(status);
        const body = acceptsBody ? Readable.toWeb(incoming) as ReadableStream<Uint8Array> : null;
        if (!acceptsBody) incoming.destroy();
        resolve(new Response(body, { status, headers }));
      });
      outgoing.on("error", reject);
      outgoing.end();
    });
  },
};
