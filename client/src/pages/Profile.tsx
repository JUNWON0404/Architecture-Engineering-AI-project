import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeftIcon, SaveIcon, UserIcon } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function Profile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    name: "",
    bio: "",
    targetJob: "",
    targetCompany: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        bio: user.bio ?? "",
        targetJob: user.targetJob ?? "",
        targetCompany: user.targetCompany ?? "",
      });
    }
  }, [user]);

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("프로필이 수정되었습니다.");
      setIsEditing(false);
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  if (!user) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">사용자 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">프로필</h1>
          <p className="text-muted-foreground text-sm mt-0.5">개인 정보를 관리하세요.</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            수정하기
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
            <SaveIcon className="w-4 h-4" />
            {updateMutation.isPending ? "저장 중..." : "저장하기"}
          </Button>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 space-y-8">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">계정</p>
            <p className="text-lg font-semibold text-foreground">{user.email ?? "사용자"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              가입일: {new Date(user.createdAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">기본 정보</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              {isEditing ? (
                <Input
                  id="name"
                  placeholder="이름을 입력하세요"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              ) : (
                <div className="px-3 py-2 rounded-lg bg-muted text-foreground">
                  {form.name || "미설정"}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">소개</Label>
              {isEditing ? (
                <textarea
                  id="bio"
                  className="w-full h-24 px-3 py-2 text-sm bg-background border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="자신을 소개해 주세요"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              ) : (
                <div className="px-3 py-2 rounded-lg bg-muted text-foreground min-h-24 flex items-center">
                  {form.bio || "미설정"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">취업 목표</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="targetJob">희망 직무</Label>
              {isEditing ? (
                <Input
                  id="targetJob"
                  placeholder="예: 백엔드 개발자"
                  value={form.targetJob}
                  onChange={(e) => setForm({ ...form, targetJob: e.target.value })}
                />
              ) : (
                <div className="px-3 py-2 rounded-lg bg-muted text-foreground">
                  {form.targetJob || "미설정"}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetCompany">희망 기업</Label>
              {isEditing ? (
                <Input
                  id="targetCompany"
                  placeholder="예: 카카오, 네이버"
                  value={form.targetCompany}
                  onChange={(e) => setForm({ ...form, targetCompany: e.target.value })}
                />
              ) : (
                <div className="px-3 py-2 rounded-lg bg-muted text-foreground">
                  {form.targetCompany || "미설정"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">계정 정보</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">이메일</span>
              <span className="text-foreground">{user.email ?? "미설정"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">로그인 방식</span>
              <span className="text-foreground">{user.loginMethod ?? "Manus"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">마지막 로그인</span>
              <span className="text-foreground">
                {new Date(user.lastSignedIn).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
