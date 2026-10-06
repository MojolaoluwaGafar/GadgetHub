import { useAuth } from "../../Context/AuthContext";
import PasswordForm from "../../Components/Account/PasswordForm";
import { AdminHeading } from "../../Layout/AdminLayout";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  return (
    <div className="max-w-3xl">
      <AdminHeading title="Account Settings" text={`Signed in as ${user?.email}.`} />
      <section className="rounded-md border border-[#e7e4e4] p-5">
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="mb-4 text-sm text-muted">Use a long password you don't use anywhere else. Changing it signs out your other devices.</p>
        <PasswordForm />
      </section>
    </div>
  );
}
