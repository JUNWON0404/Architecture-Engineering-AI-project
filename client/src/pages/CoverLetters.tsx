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
import { cn } from "@/lib/utils";
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
    <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen bg-slate-50/30 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-7 bg-indigo-600 rounded-full" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">자기소개서 보관함</h1>
          </div>
          <p className="text-slate-500 font-medium text-lg">나만의 마스터 자소서와 기업별 맞춤 서류를 한눈에 관리하세요.</p>
        </div>
        <Button onClick={() => navigate("/cover-letters")} className="gap-2 h-12 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-black shadow-lg">
          <PlusIcon className="w-5 h-5" />
          새 자소서 작성
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i: number) => (
            <div key={i} className="h-64 bg-white border border-slate-200 animate-pulse rounded-[2rem]" />
          ))}
        </div>
      ) : coverLetters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white border border-slate-200 rounded-[3rem] shadow-sm">
          <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center mb-6">
            <FileTextIcon className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">아직 작성된 자소서가 없습니다</h3>
          <p className="text-slate-500 font-medium mb-8">마스터 자소서를 먼저 완성하면<br/>기업별 맞춤 자소서를 빠르게 생성할 수 있습니다.</p>
          <Button onClick={() => navigate("/cover-letters")} className="gap-2 h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100">
            <PlusIcon className="w-5 h-5" />
            첫 자소서 시작하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coverLetters.map((cl: CoverLetter) => (
            <div
              key={cl.id}
              onClick={() => navigate(`/cover-letters?id=${cl.id}`)}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col justify-between min-h-[280px]"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className={cn("px-3 py-1 rounded-lg font-black text-[10px] border-none", statusColor[cl.status] || statusColor.draft)}>
                    {statusLabel[cl.status] || statusLabel.draft}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("정말 삭제하시겠습니까?")) deleteMutation.mutate({ id: cl.id });
                    }}
                    disabled={deletingId === cl.id}
                    className="p-2.5 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                  {cl.title}
                </h3>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-50">
                      <BuildingIcon className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm truncate">{cl.company || "기업 미지정"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-50">
                      <BriefcaseIcon className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-slate-500 text-xs font-medium truncate">{cl.position || "직무 미지정"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-50">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                  <EditIcon className="w-3 h-3" />
                  {new Date(cl.updatedAt).toLocaleDateString("ko-KR")}
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 transition-all shadow-sm">
                  <PlusIcon className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:rotate-45 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
