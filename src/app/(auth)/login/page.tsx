import { Shield } from "lucide-react";
import { LoginButton } from "@/components/auth/login-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;

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
        {error && (
          <p className="text-sm text-destructive">
            Authentication error. Please try again.
          </p>
        )}
        <LoginButton callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
