import { Client, Databases, Account } from "appwrite";

// ── Appwrite Configuration ───────────────────────────────────
const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (endpoint && projectId) {
  client.setEndpoint(endpoint).setProject(projectId);
} else if (typeof window !== "undefined") {
  console.warn(
    "[Appwrite] Missing NEXT_PUBLIC_APPWRITE_ENDPOINT or NEXT_PUBLIC_APPWRITE_PROJECT_ID. " +
      "Copy .env.example to .env.local and fill in your credentials."
  );
}

// ── Service Instances ────────────────────────────────────────
export const databases = new Databases(client);
export const account = new Account(client);

// ── Collection Constants ─────────────────────────────────────
export const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "bid_db";
export const ITEMS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ITEMS_ID || "items";
export const BIDS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BIDS_ID || "bids";

// ── Re-export client for Realtime subscriptions ──────────────
export { client };
