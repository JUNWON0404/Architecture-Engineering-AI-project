import { createExpressApp } from "./_core/index";

let cachedApp: any = null;

export default async function (req: any, res: any) {
  if (!cachedApp) {
    console.log("[Vercel] Initializing Express app...");
    cachedApp = await createExpressApp();
  }
  
  // Express 앱에 요청과 응답을 직접 전달하여 실행합니다.
  return cachedApp(req, res);
}
