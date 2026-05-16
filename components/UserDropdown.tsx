"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import NavItems from "./NavItems";
import { signOut } from "@/lib/actions/auth.actions";

const UserDropdown = ({user,initialStocks}:{user:User,initialStocks:StockWithWatchlistStatus[]}) => {
  const router = useRouter();
  const handleSignout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex item-center gap-3 text-muted-foreground hover:text-emerald-500"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-emerald-500 text-emerald-950 text-sm font-bold">
              {user.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-base font-medium text-muted-foreground ">
              {user.name.split(" ")[0]}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="text-muted-foreground">
        <DropdownMenuLabel>
          <div className="flex relative items-center gap-3 py-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-emerald-500 text-emerald-950 text-sm font-bold">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-base font-medium text-muted-foreground ">
                {user.name}
              </span>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border"/>
        <DropdownMenuItem onClick={handleSignout} className="text-foreground text-md font-medium focus:bg-transparent focus:text-emerald-500 transition-colors cursor-pointer">
          <LogOut className="h-4 w-4 mr-2 hidden sm:block"/>
            Logout
        </DropdownMenuItem>
        <DropdownMenuSeparator className="hidden sm:block bg-border"/>
        <nav className="sm:hidden">
          <NavItems initialStocks={initialStocks}/>
        </nav>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
