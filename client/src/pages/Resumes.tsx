import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, PlusIcon, Trash2Icon, EditIcon, StarIcon } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

export default function Resumes() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: resumes = [], isLoading } = trpc.resume.list.useQuery();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const deleteMutation = trpc.resume.delete.useMutation({
    onMutate: async ({ id }) => {
      setDeletingId(id);
      await utils.resume.list.cancel();
      const prev = utils.resume.list.getData();
      utils.resume.list.setData(undefined, (old) => old?.filter((r) => r.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      utils.resume.list.setData(undefined, ctx?.prev);
      toast.error("삭제에 실패했습니다.");
    },
    onSettled: () => { utils.resume.list.invalidate(); setDeletingId(null); },
    onSuccess: () => toast.success("이력서가 삭제되었습니다."),
  });

  const setDefaultMutation = trpc.resume.update.useMutation({
    onSuccess: () => { utils.resume.list.invalidate(); toast.success("기본 이력서로 설정되었습니다."); },
    onError: () => toast.error("설정에 실패했습니다."),
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">이력서 관리</h1>
          <p className="text-muted-foreground mt-1">다양한 버전의 이력서를 작성하고 관리하세요.</p>
        </div>
        <Button onClick={() => navigate("/resumes/new")} className="gap-2">
          <PlusIcon className="w-4 h-4" />
          새 이력서
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      ) : resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <BriefcaseIcon className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">아직 이력서가 없습니다</h3>
          <p className="text-muted-foreground text-sm mb-6">첫 번째 이력서를 작성해 보세요.</p>
          <Button onClick={() => navigate("/resumes/new")} className="gap-2">
            <PlusIcon className="w-4 h-4" />
            이력서 작성하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumes.map((resume) => (
            <div key={resume.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {resume.isDefault && (
                    <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                      <StarIcon className="w-3 h-3" />
                      기본
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!resume.isDefault && (
                    <button
                      onClick={() => setDefaultMutation.mutate({ id: resume.id, isDefault: true })}
                      className="p-1.5 rounded-lg hover:bg-yellow-50 text-muted-foreground hover:text-yellow-500 transition-colors"
                      title="기본 이력서로 설정"
                    >
                      <StarIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/resumes/${resume.id}`)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate({ id: resume.id })}
                    disabled={deletingId === resume.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3
                className="text-base font-semibold text-foreground mb-2 cursor-pointer hover:text-primary transition-colors"
                onClick={() => navigate(`/resumes/${resume.id}`)}
              >
                {resume.title}
              </h3>
              {resume.content && (
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{resume.content}</p>
              )}
              <p className="text-xs text-muted-foreground/60 mt-3">
                {new Date(resume.updatedAt).toLocaleDateString("ko-KR")} 수정
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
