import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { MailCheck } from "lucide-react";
import { authService } from "../../API/services/authService";
import { useAuth } from "../../Context/AuthContext";
import { Field, Notice, PasswordInput, TextInput } from "../../Components";
import Button from "../../Components/Button";
import { apiErrorMessage, apiFieldErrors } from "../../utils/apiError";
import { showToast } from "../../utils/toastHelper";
import logo from "../../assets/logo.png";

// The design's reset screens: a card with a thick violet top border.
function ResetCard({ title, text, children }: { title: string; text: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-md border border-brand-soft border-t-8 border-t-brand p-6 text-center sm:p-10">
        <Link to="/" className="inline-block" aria-label="GadgetHub home">
          <img src={logo} alt="GadgetHub" className="mx-auto h-9 w-auto" />
        </Link>
        <h1 className="mt-8 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-muted">{text}</p>
        <div className="mt-6 text-left">{children}</div>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      if (sent) showToast("We've sent another link");
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err, "We couldn't send the link. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <ResetCard title="Check Your Email" text={<>If {email} has an account, a link to reset your password is on its way. It works for 30 minutes.</>}>
        <div className="mb-6 flex justify-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-brand">
            <MailCheck className="h-10 w-10" />
          </span>
        </div>
        <div className="space-y-3">
          <Button block size="lg" loading={loading} onClick={() => send()}>
            Resend email
          </Button>
          <Button block size="lg" variant="ghost" to="/login">
            Back to login
          </Button>
        </div>
      </ResetCard>
    );
  }

  return (
    <ResetCard title="Forgot Password?" text="Enter the email linked to your account. We'll send you a link to reset your password.">
      <form onSubmit={send} className="space-y-4" noValidate>
        {error && <Notice tone="danger">{error}</Notice>}
        <Field label="Email" htmlFor="email">
          <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" autoComplete="email" required />
        </Field>
        <Button type="submit" block size="lg" loading={loading}>
          Send Reset Link
        </Button>
        <Button block size="lg" variant="ghost" to="/login" className="text-danger">
          Cancel
        </Button>
      </form>
    </ResetCard>
  );
}

export function ResetPasswordPage() {
  const { token = "" } = useParams();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password !== confirm) return setErrors({ confirm: "The passwords don't match." });
    setErrors({});
    setLoading(true);
    try {
      signIn(await authService.resetPassword(token, password));
      showToast("Your new password is set. You're signed in.");
      navigate("/", { replace: true });
    } catch (err) {
      setErrors(apiFieldErrors(err));
      setError(apiErrorMessage(err, "We couldn't reset your password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResetCard title="Reset Your Password" text="You're just one step away from accessing your account.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <Notice tone="danger">
            {error}{" "}
            {/expired|isn't valid/.test(error) && (
              <Link to="/forgot-password" className="font-semibold text-brand hover:underline">
                Get a new link
              </Link>
            )}
          </Notice>
        )}
        <Field label="New Password" htmlFor="password" error={errors.password} hint="Minimum of 8 characters.">
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your new password" autoComplete="new-password" hasError={Boolean(errors.password)} />
        </Field>
        <Field label="Confirm Password" htmlFor="confirm" error={errors.confirm} hint="Must match the field above.">
          <PasswordInput id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" hasError={Boolean(errors.confirm)} />
        </Field>
        <Button type="submit" block size="lg" loading={loading}>
          Update Password
        </Button>
      </form>
    </ResetCard>
  );
}
