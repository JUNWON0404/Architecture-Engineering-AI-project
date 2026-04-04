import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";

/**
 * 로그인 페이지
 * - OAuth (구글) 로그인 기본 방식
 * - 이메일/비밀번호 로그인 보조 방식 (개발용)
 */
export function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const signInMutation = trpc.auth.signIn.useMutation();
  const utils = trpc.useUtils();

  /**
   * OAuth 로그인
   * Google 또는 연동된 OAuth 제공자로 자동 이동
   */
  const handleOAuthLogin = () => {
    const loginUrl = getLoginUrl();
    if (!loginUrl) {
      setError("OAuth 설정이 없습니다. 관리자에게 문의하세요.");
      return;
    }
    // OAuth 서버로 리디렉션
    window.location.href = loginUrl;
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

      const result = await signInMutation.mutateAsync({ email, password });
      utils.auth.me.setData(undefined, result.user);
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "로그인 실패. 다시 시도해주세요.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>구글로 로그인 또는 이메일로 접속하세요</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* OAuth 로그인 버튼 (메인) */}
          <div className="space-y-4">
            <Button
              onClick={handleOAuthLogin}
              variant="default"
              className="w-full h-12 text-base"
              type="button"
            >
              🔗 Google로 로그인
            </Button>

            {/* 이메일 로그인 토글 (보조) */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            {/* 이메일 로그인 폼 */}
            {!showEmailForm ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowEmailForm(true)}
              >
                이메일로 로그인
              </Button>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
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
                  className="w-full"
                  onClick={() => {
                    setShowEmailForm(false);
                    setEmail("");
                    setPassword("");
                    setError("");
                  }}
                >
                  돌아가기
                </Button>
              </form>
            )}
          </div>

          {/* 회원가입 링크 */}
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">계정이 없으신가요? </span>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              회원가입
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
