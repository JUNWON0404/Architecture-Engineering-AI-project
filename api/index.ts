import { createExpressApp } from "../server/_core/index";

let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await createExpressApp();
  }
  return cachedApp(req, res);
}
