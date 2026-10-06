import { useState, type FormEvent } from "react";
import { authService } from "../../API/services/authService";
import { useAuth } from "../../Context/AuthContext";
import { Field, PasswordInput } from "../index";
import Button from "../Button";
import { apiErrorMessage, apiFieldErrors } from "../../utils/apiError";
import { showToast } from "../../utils/toastHelper";

// Change password. Signs out every other device; this one gets a new login.
export default function PasswordForm() {
  const { signIn } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (next !== confirm) return setErrors({ confirm: "The new passwords don't match." });
    setErrors({});
    setSaving(true);
    try {
      signIn(await authService.changePassword(current, next));
      setCurrent("");
      setNext("");
      setConfirm("");
      showToast("Password changed. Other devices have been signed out.");
    } catch (err) {
      setErrors(apiFieldErrors(err));
      showToast(apiErrorMessage(err, "Your password wasn't changed."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid max-w-xl gap-4" noValidate>
      <Field label="Current password" htmlFor="current-password" error={errors.currentPassword}>
        <PasswordInput id="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" hasError={Boolean(errors.currentPassword)} />
      </Field>
      <Field label="New password" htmlFor="new-password" error={errors.newPassword} hint="At least 8 characters.">
        <PasswordInput id="new-password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" hasError={Boolean(errors.newPassword)} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm-password" error={errors.confirm}>
        <PasswordInput id="confirm-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" hasError={Boolean(errors.confirm)} />
      </Field>
      <div>
        <Button type="submit" loading={saving} disabled={!current || !next}>
          Change password
        </Button>
      </div>
    </form>
  );
}
