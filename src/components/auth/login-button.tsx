import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function LoginButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("battlenet", { redirectTo: "/dashboard" });
      }}
    >
      <Button type="submit" size="lg" className="font-heading tracking-wide gap-2">
        <LogIn className="h-4 w-4" />
        Sign in with Battle.net
      </Button>
    </form>
  );
}
