import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AuthForm } from "@/components/AuthForm";
import { Dashboard } from "@/components/Dashboard";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FocusPulse — Personal Productivity Coach" },
      { name: "description", content: "Prioritize tasks by dynamic Impact Score. Focus smarter, ship faster." },
      { property: "og:title", content: "FocusPulse — Personal Productivity Coach" },
      { property: "og:description", content: "Prioritize tasks by dynamic Impact Score. Focus smarter, ship faster." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Dashboard
      userId={user.id}
      userEmail={user.email ?? ""}
      onSignOut={signOut}
    />
  );
}
