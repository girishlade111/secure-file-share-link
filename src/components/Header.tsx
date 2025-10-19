"use client";

import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogOut, User, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const Header = () => {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error("Sign out failed");
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      router.push("/login");
      toast.success("Signed out successfully");
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Shield className="w-6 h-6 text-primary" />
          Secure File Share
        </Link>

        <div className="flex items-center gap-4">
          {isPending ? (
            <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{session.user.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};