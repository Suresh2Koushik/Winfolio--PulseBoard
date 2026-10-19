import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronsUpDown, LogOut, Settings, UserCog } from "lucide-react";

/** Account menu at the bottom of the sidebar. */
export function UserMenu() {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const name = userProfile?.fullName || user?.email || "You";
  const initials = (userProfile?.fullName || user?.email || "U")
    .split(/[\s@]/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full min-w-0 items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-muted"
      >
        <Avatar className="h-9 w-9">
          <AvatarImage src={userProfile?.avatarUrl || undefined} alt="" />
          <AvatarFallback className="bg-pastel-blue font-bold text-pastel-blue-ink">{initials}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{name}</span>
          {userProfile?.team && <span className="block truncate text-xs text-muted-foreground">{userProfile.team}</span>}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Account menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60 p-1.5" align="start" side="top">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-bold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/onboard")} className="cursor-pointer gap-2 py-2">
          <UserCog className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Edit profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer gap-2 py-2">
          <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer gap-2 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
