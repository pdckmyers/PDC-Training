import { getAppSettings } from "@/lib/settings";
import WelcomeVideoSettings from "@/components/WelcomeVideoSettings";

export default async function AdminSettingsPage() {
  const settings = await getAppSettings();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-stone-900">Settings</h1>
      <p className="mb-8 text-stone-600">
        Site-wide options that apply to every employee.
      </p>
      <WelcomeVideoSettings initialUrl={settings?.welcome_video_url ?? null} />
    </div>
  );
}
