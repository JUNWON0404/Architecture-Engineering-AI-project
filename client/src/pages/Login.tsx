import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

/**
 * 로그인 페이지
 * - OAuth (구글) 로그인 기본 방식
 * - 이메일/비밀번호 로그인 보조 방식 (개발용)
 */
export function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const urlError = new URLSearchParams(window.location.search).get("error");
  const getErrorMessage = (errCode: string | null) => {
    switch (errCode) {
      case "google_auth_failed":
        return "Google 로그인에 실패했습니다. 다시 시도해주세요.";
      case "google_auth_disabled":
        return "현재 구글 로그인 기능 점검 중입니다. 이메일 로그인을 이용해주세요.";
      default:
        return "";
    }
  };
  const [error, setError] = useState(getErrorMessage(urlError));
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const signInMutation = trpc.auth.signIn.useMutation();

  const handleGoogleLogin = () => {
    alert("현재 구글 로그인 기능 점검 중입니다. 일반 이메일 로그인을 이용해주세요.");
    // window.location.href = "/api/auth/google";
  };

  /**
   * 이메일/비밀번호 로그인 (개발용)
   */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error("이메일과 비밀번호를 입력해주세요");
      }

      await signInMutation.mutateAsync({ email, password, rememberMe });
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "로그인 실패. 다시 시도해주세요.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-900">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight">JobReady</CardTitle>
          <CardDescription className="text-slate-500">
            건축/엔지니어링 취업의 모든 것
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Google 로그인 버튼 (메인) */}
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full h-12 text-base flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm"
              type="button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="font-medium">Google 계정으로 시작하기</span>
            </Button>

            {/* 이메일 로그인 토글 (보조) */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-slate-400">또는 이메일로 로그인</span>
              </div>
            </div>

            {/* 이메일 로그인 폼 */}
            {!showEmailForm ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                onClick={() => setShowEmailForm(true)}
              >
                이메일로 로그인
              </Button>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="bg-slate-50 border-slate-200 focus-visible:ring-slate-400 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-slate-50 border-slate-200 focus-visible:ring-slate-400 h-11"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox 
                    id="rememberMe" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="rememberMe" className="text-sm text-slate-600 font-normal cursor-pointer">
                    로그인 상태 유지
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white"
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      로그인 중...
                    </>
                  ) : (
                    "로그인"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-slate-500"
                  onClick={() => {
                    setShowEmailForm(false);
                    setEmail("");
                    setPassword("");
                    setError("");
                  }}
                >
                  취소
                </Button>
              </form>
            )}
          </div>

          {/* 회원가입 링크 */}
          <div className="mt-8 text-center text-sm">
            <span className="text-slate-500">계정이 없으신가요? </span>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-slate-900 font-semibold hover:underline"
            >
              회원가입
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
