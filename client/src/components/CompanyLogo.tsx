import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Company {
  name: string;
  thumbnail?: string | null;
}

interface Props {
  company: Company;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CompanyLogo({ company, size = "md", className }: Props) {
  const sizeClasses = {
    sm: "w-10 h-10 rounded-lg text-xs",
    md: "w-16 h-16 rounded-2xl text-base",
    lg: "w-24 h-24 rounded-[2rem] text-2xl",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  // 배경색 결정을 위한 간단한 해시 함수 (이름 기반)
  const getBgColor = (name: string) => {
    const colors = [
      "bg-blue-100 text-blue-600",
      "bg-emerald-100 text-emerald-600",
      "bg-indigo-100 text-indigo-600",
      "bg-rose-100 text-rose-600",
      "bg-amber-100 text-amber-600",
      "bg-slate-100 text-slate-600",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (company.thumbnail) {
    return (
      <div className={cn("overflow-hidden flex items-center justify-center bg-white border border-slate-100 shadow-inner shrink-0", sizeClasses[size], className)}>
        <img 
          src={company.thumbnail} 
          alt={company.name} 
          className="w-full h-full object-contain p-2"
          onError={(e) => {
            (e.target as HTMLImageElement).src = ""; // 이미지 로드 실패 시 아이콘으로 대체되도록 처리
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center font-black shrink-0 shadow-sm", sizeClasses[size], getBgColor(company.name), className)}>
      <Building2 className={iconSizes[size]} />
    </div>
  );
}
