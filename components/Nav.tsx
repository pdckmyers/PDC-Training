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
      <nav className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-4">
        <Link
          href="/modules"
          className="whitespace-nowrap font-serif text-lg font-semibold text-brand-dark"
        >
          PDC Training
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href="/modules"
              className="whitespace-nowrap text-sm text-stone-600 hover:text-stone-900"
            >
              Modules
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/admin/modules"
                  className="whitespace-nowrap text-sm text-stone-600 hover:text-stone-900"
                >
                  Manage modules
                </Link>
                <Link
                  href="/admin/locations"
                  className="whitespace-nowrap text-sm text-stone-600 hover:text-stone-900"
                >
                  Locations
                </Link>
                <Link
                  href="/admin/team"
                  className="whitespace-nowrap text-sm text-stone-600 hover:text-stone-900"
                >
                  Team
                </Link>
              </>
            )}
            {(isAdmin || isManager) && (
              <Link
                href="/admin/progress"
                className="whitespace-nowrap text-sm text-stone-600 hover:text-stone-900"
              >
                Progress
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="whitespace-nowrap text-sm text-stone-500">
              {profile?.full_name || user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </nav>
    </header>
  );
}
