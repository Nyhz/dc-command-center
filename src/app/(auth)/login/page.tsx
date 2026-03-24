import { Shield } from "lucide-react";
import { LoginButton } from "@/components/auth/login-button";

export default function LoginPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <Shield className="h-16 w-16 text-primary" />
        <h1 className="font-heading text-4xl font-bold tracking-wide text-primary">
          Command Center
        </h1>
        <p className="max-w-sm text-muted-foreground">
          Sign in with your Battle.net account to access your guild&apos;s
          command center.
        </p>
        <LoginButton />
      </div>
    </div>
  );
}
