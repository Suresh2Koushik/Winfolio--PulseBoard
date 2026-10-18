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
import { Button } from "@/components/ui/button";
import { User, Shield, LogOut, CheckSquare, Target, LayoutDashboard, Settings } from "lucide-react";

export function UserMenu() {
  const { user, userProfile, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const getInitials = () => {
    if (userProfile?.fullName) {
      return userProfile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full group">
          <Avatar className="border-2 border-transparent group-hover:border-primary/50 transition-all">
            <AvatarImage src={userProfile?.avatarUrl || undefined} alt={userProfile?.fullName || "User"} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none">{userProfile?.fullName || "Pulse User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            {userProfile?.team && (
              <p className="text-[10px] uppercase tracking-widest font-bold text-primary mt-1">
                {userProfile.team}
              </p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div className="space-y-1">
          <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer gap-2 py-2">
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/check-ins")} className="cursor-pointer gap-2 py-2">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            My Check-Ins
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/goals")} className="cursor-pointer gap-2 py-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            My Goals
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        <div className="space-y-1">
          {(userRole === 'admin' || userRole === 'manager') && (
            <DropdownMenuItem onClick={() => navigate("/manager")} className="cursor-pointer gap-2 py-2">
              <Shield className="h-4 w-4 text-primary" />
              Manager Dashboard
            </DropdownMenuItem>
          )}
          {userRole === 'admin' && (
            <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer gap-2 py-2">
              <Settings className="h-4 w-4 text-accent" />
              Admin Access
            </DropdownMenuItem>
          )}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive gap-2 py-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
