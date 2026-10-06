import { useState } from "react";
import { useNavigate } from "react-router";
import { Trash2 } from "lucide-react";
import { authService } from "../../API/services/authService";
import { useAuth } from "../../Context/AuthContext";
import { Field, PasswordInput } from "../../Components";
import PasswordForm from "../../Components/Account/PasswordForm";
import { ConfirmDialog } from "../../Components/Modal";
import { apiErrorMessage } from "../../utils/apiError";
import { showToast } from "../../utils/toastHelper";

export default function SettingsPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    setError("");
    try {
      await authService.deleteAccount(password);
      signOut();
      showToast("Your account has been deleted", "info");
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Your account wasn't deleted."));
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Account Settings</h1>
      <p className="text-subtle">Manage your security</p>
      <div className="mt-6 space-y-5">
        <section className="rounded-md border border-[#e6eff5] p-5">
          <h2 className="mb-4 text-lg font-semibold">Change password</h2>
          <PasswordForm />
        </section>
        <section className="rounded-md border border-[#e6eff5] p-5">
          <h2 className="text-lg font-semibold text-danger">Danger Zone</h2>
          <div className="mt-3 rounded-md bg-danger-soft px-4 py-3">
            <p>Once you delete your account, there is no going back. Your past orders stay on our books, but you won't be able to sign in.</p>
            <button
              type="button"
              onClick={() => {
                setPassword("");
                setError("");
                setConfirm(true);
              }}
              className="mt-3 h-11 rounded-md bg-danger px-5 font-semibold text-white hover:brightness-90"
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        loading={deleting}
        icon={<Trash2 />}
        title="Delete Account"
        text="Are you sure you want to delete your account?"
        confirmLabel="Delete Account"
      >
        <Field label="Enter your password to confirm" htmlFor="delete-password" error={error}>
          <PasswordInput id="delete-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" hasError={Boolean(error)} />
        </Field>
      </ConfirmDialog>
    </div>
  );
}
