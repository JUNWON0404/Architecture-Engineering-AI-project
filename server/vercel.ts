import { createExpressApp } from "./_core/index";

// Vercel은 Express 앱 인스턴스를 직접 export default 하면 
// 내부적으로 서버리스 핸들러로 변환하여 처리합니다.
const app = await createExpressApp();

export default app;
