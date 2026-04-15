import "dotenv/config";
import { createExpressApp } from "../server/_core/index";

/**
 * Vercel Serverless Function Handler
 * This is the entry point for Vercel's API gateway.
 */
let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    console.log("[Vercel] Initializing new app instance...");
    cachedApp = await createExpressApp();
  }
  
  // Vercel handles the request delegation to Express
  return cachedApp(req, res);
}
