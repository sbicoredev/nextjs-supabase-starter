"use client";

import { LogOut, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Skeleton } from "~/components/ui/skeleton";
import { signOut } from "~/features/auth/actions/auth.actions";
import { useUser } from "~/features/auth/hooks/use-user";
import { getInitials } from "~/lib/utils";

export function UserMenu() {
  const { data: user, isLoading } = useUser();
  const [isPending, startTransition] = useTransition();

  if (isLoading) {
    return <Skeleton className="size-8 rounded-full" />;
  }

  if (!user) {
    return (
      <Button nativeButton={false} render={<Link href="/login" />} size="sm">
        Sign in
      </Button>
    );
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";

  function handleSignout() {
    startTransition(async () => {
      const result = await signOut();
      if (result.error !== undefined) {
        toast.error(result.error);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            className="relative size-8 rounded-full"
            size="icon"
            variant="ghost"
          />
        }
      >
        <Avatar className="size-8">
          <AvatarImage
            alt={displayName}
            src={user.user_metadata?.avatar_url as string | undefined}
          />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <p className="truncate font-medium text-sm">{displayName}</p>
              <p className="truncate text-muted-foreground text-xs">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            <UserIcon />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem
            nativeButton={false}
            render={<Link href="/settings" />}
          >
            <Settings />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={isPending}
            onClick={handleSignout}
            variant="destructive"
          >
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
