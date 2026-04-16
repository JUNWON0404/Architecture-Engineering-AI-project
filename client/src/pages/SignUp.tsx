import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

/**
 * 회원가입 페이지
 * - 이메일, 비밀번호, 이름으로 새 계정 생성
 * - 성공 시 대시보드로 리디렉션
 */
export function SignUp() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // TRPC를 이용한 회원가입 API 호출
  const signUpMutation = trpc.auth.signUp.useMutation();

  /**
   * 회원가입 버튼 클릭 핸들러
   * 1. 입력값 검증 (비밀번호 일치 확인)
   * 2. API 호출
   * 3. 성공 시 사용자 정보 업데이트 및 리디렉션
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 입력값 검증
      if (!email || !password || !passwordConfirm || !name) {
        throw new Error("모든 필드를 입력해주세요");
      }

      // 비밀번호 일치 확인
      if (password !== passwordConfirm) {
        throw new Error("비밀번호가 일치하지 않습니다");
      }

      // 비밀번호 최소 길이 확인
      if (password.length < 8) {
        throw new Error("비밀번호는 8자 이상이어야 합니다");
      }

      // API 호출
      const result = await signUpMutation.mutateAsync({
        email,
        password,
        name,
      });

      void result;
      setSuccess(true);
      setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "회원가입 실패. 다시 시도해주세요.";
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
          <CardDescription className="text-slate-500">새 계정을 생성하세요</CardDescription>
        </CardHeader>

        <CardContent>
          {success && (
            <Alert className="mb-4 border-green-300 bg-green-50 text-green-800">
              <AlertDescription>회원가입이 완료되었습니다. 대시보드로 이동합니다...</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 회원가입 폼 */}
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* 이름 입력 */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="bg-slate-50 border-slate-200 focus-visible:ring-slate-400 h-11"
              />
            </div>

            {/* 이메일 입력 */}
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

            {/* 비밀번호 입력 */}
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
              <p className="text-xs text-slate-500">최소 8자 이상</p>
            </div>

            {/* 비밀번호 확인 입력 */}
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm" className="text-slate-700">비밀번호 확인</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                disabled={isLoading}
                className="bg-slate-50 border-slate-200 focus-visible:ring-slate-400 h-11"
              />
            </div>

            {/* 회원가입 버튼 */}
            <Button
              type="submit"
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white mt-2"
              disabled={isLoading || !email || !password || !passwordConfirm || !name}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  가입 중...
                </>
              ) : (
                "회원가입"
              )}
            </Button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-8 text-center text-sm">
            <span className="text-slate-500">이미 계정이 있으신가요? </span>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-slate-900 font-semibold hover:underline"
            >
              로그인
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
