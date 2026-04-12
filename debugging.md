# Debugging Guide

## 🛠️ Debugging Strategy
1. **Log Collection**: `__manus__/logs`를 통한 브라우저 로그 및 네트워크 요청 로그 분석.
2. **Environment Isolation**: `.env` 파일의 `NODE_ENV` 설정에 따른 Mock DB와 실 서버의 동작 구분.
3. **Reproducibility**: 버그 발생 시 반드시 재현 가능하도록 픽스처(Fixture) 데이터를 활용한 유닛 테스트 작성.

## 🚧 Common Issues & Fixes
### 1. Database Connection Failure
- **Symptom**: `[Database] Connection failed. Falling back to Mock Store.` 로그 발생.
- **Fix**: `DATABASE_URL` 환경 변수 확인 및 네트워크 연결 상태 점검.

### 2. UI Hydration / Render Error
- **Symptom**: `Badge is not defined`와 같은 컴포넌트 누락 오류.
- **Fix**: 상단 `import` 구문 확인 및 `Skeleton` 컴포넌트 누락 시 추가.

### 3. API Latency (Performance)
- **Symptom**: 대시보드 로딩 지연.
- **Fix**: N+1 쿼리 최적화 (`LEFT JOIN` 및 `COUNT` 사용) 및 `Promise.all` 지양.
