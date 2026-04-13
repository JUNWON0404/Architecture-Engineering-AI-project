import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileTextIcon,
  PlusIcon,
  Trash2Icon,
  EditIcon,
  BuildingIcon,
  BriefcaseIcon,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import type { CoverLetter } from "@shared/types";

const statusLabel: Record<string, string> = {
  draft: "작성 중",
  completed: "완료",
  submitted: "제출됨",
};
const statusColor: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-700 border-yellow-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function CoverLetters() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: coverLetters = [], isLoading } = trpc.coverLetter.list.useQuery();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const deleteMutation = trpc.coverLetter.delete.useMutation({
    onMutate: async ({ id }) => {
      setDeletingId(id);
      await utils.coverLetter.list.cancel();
      const prev = utils.coverLetter.list.getData();
      utils.coverLetter.list.setData(undefined, (old: CoverLetter[] | undefined) => old?.filter((c: CoverLetter) => c.id !== id));
      return { prev };
    },
    onError: (_err, _vars, context) => {
      utils.coverLetter.list.setData(undefined, context?.prev);
      toast.error("삭제에 실패했습니다.");
    },
    onSettled: () => {
      utils.coverLetter.list.invalidate();
      setDeletingId(null);
    },
    onSuccess: () => toast.success("자기소개서가 삭제되었습니다."),
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">자기소개서</h1>
          <p className="text-muted-foreground mt-1">나만의 자기소개서를 작성하고 관리하세요.</p>
        </div>
        <Button onClick={() => navigate("/cover-letters/new")} className="gap-2">
          <PlusIcon className="w-4 h-4" />
          새로 작성
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i: number) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : coverLetters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <FileTextIcon className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">아직 자기소개서가 없습니다</h3>
          <p className="text-muted-foreground text-sm mb-6">첫 번째 자기소개서를 작성해 보세요.</p>
          <Button onClick={() => navigate("/cover-letters/new")} className="gap-2">
            <PlusIcon className="w-4 h-4" />
            자기소개서 작성하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coverLetters.map((cl: CoverLetter) => (
            <div
              key={cl.id}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor[cl.status] || statusColor.draft}`}>
                  {statusLabel[cl.status] || statusLabel.draft}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => navigate(`/cover-letters/${cl.id}`)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate({ id: cl.id })}
                    disabled={deletingId === cl.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                {cl.title}
              </h3>
              <div className="flex flex-col gap-2 mt-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <BuildingIcon className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">{cl.company || "미지정"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BriefcaseIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">{cl.position || "미지정"}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  {new Date(cl.updatedAt).toLocaleDateString("ko-KR")} 수정
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="font-bold text-xs"
                  onClick={() => navigate(`/cover-letters/${cl.id}`)}
                >
                  편집하기
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
