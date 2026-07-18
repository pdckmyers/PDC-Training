import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isManager = profile?.role === "manager";

  return (
    <header className="border-b border-stone-200 bg-white">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/modules" className="font-semibold text-brand-dark">
            PDC Training
          </Link>
          <Link href="/modules" className="text-sm text-stone-600 hover:text-stone-900">
            Modules
          </Link>
          {isAdmin && (
            <>
              <Link
                href="/admin/modules"
                className="text-sm text-stone-600 hover:text-stone-900"
              >
                Manage modules
              </Link>
              <Link
                href="/admin/locations"
                className="text-sm text-stone-600 hover:text-stone-900"
              >
                Locations
              </Link>
              <Link
                href="/admin/team"
                className="text-sm text-stone-600 hover:text-stone-900"
              >
                Team
              </Link>
            </>
          )}
          {(isAdmin || isManager) && (
            <Link
              href="/admin/progress"
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              Progress
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-stone-500">
            {profile?.full_name || user.email}
          </span>
          <SignOutButton />
        </div>
      </nav>
    </header>
  );
}
