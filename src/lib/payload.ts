import { getPayload, type Payload } from "payload";
import config from "@payload-config";

// Thin wrapper around Payload's `getPayload` for server-side reads.
// Reused by every (frontend) page that pulls CMS content.
//
// `getPayload` is internally memoised — calling it repeatedly returns
// the same instance — so this just keeps the import surface tiny and
// avoids sprinkling `await getPayload({ config })` across files.
export async function getPayloadInstance(): Promise<Payload> {
  return getPayload({ config });
}
