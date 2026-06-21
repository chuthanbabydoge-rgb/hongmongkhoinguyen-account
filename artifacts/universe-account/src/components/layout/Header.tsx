import { useAuth } from "@/hooks/useAuth";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#050c1a]/80 backdrop-blur-xl">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-white/40 text-sm mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {user && <RoleBadge role={user.role} size="sm" />}
        <Link href="/notifications">
          <button
            data-testid="button-notifications"
            className="relative w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className={cn(
                "absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-violet-600 border border-[#050c1a]",
                "flex items-center justify-center text-white text-[9px] font-bold px-0.5",
                "shadow-[0_0_8px_rgba(124,58,237,0.7)]"
              )}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </Link>
      </div>
    </header>
  );
}
