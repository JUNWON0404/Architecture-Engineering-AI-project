import "dotenv/config";
import { createExpressApp } from "../server/_core/index";

/**
 * Vercel Serverless Function Handler
 * Enhanced with error trapping to prevent "Unexpected token A"
 */
let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      console.log("[Vercel] Initializing new app instance...");
      cachedApp = await createExpressApp();
    }
    
    // Express handles the request
    return cachedApp(req, res);
  } catch (err: any) {
    console.error("[Vercel Handler Error]:", err);
    
    // Return JSON instead of letting Vercel return an HTML error page
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
}
