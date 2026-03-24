"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function LoginButton() {
  return (
    <Button
      size="lg"
      className="font-heading tracking-wide gap-2"
      onClick={() => signIn("battlenet", { callbackUrl: "/dashboard" })}
    >
      <LogIn className="h-4 w-4" />
      Sign in with Battle.net
    </Button>
  );
}
