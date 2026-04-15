import { createExpressApp } from "./_core/index";

let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      cachedApp = await createExpressApp();
    }
    return cachedApp(req, res);
  } catch (err: any) {
    console.error("[Vercel Runtime Error]:", err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message
    });
  }
}
