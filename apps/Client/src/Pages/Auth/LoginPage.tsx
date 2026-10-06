import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { authService } from "../../API/services/authService";
import { useAuth } from "../../Context/AuthContext";
import { Field, Notice, PasswordInput, TextInput } from "../../Components";
import Button from "../../Components/Button";
import { apiErrorMessage, apiFieldErrors } from "../../utils/apiError";
import { showToast } from "../../utils/toastHelper";
import AuthShell from "./AuthShell";

// One sign-in form for shoppers and admins. /admin/login shows it with admin
// wording and only lets admin accounts through.
export default function LoginPage({ admin = false }: { admin?: boolean }) {
  const { signIn, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && (!admin || isAdmin)) {
    return <Navigate to={from ?? (isAdmin && admin ? "/admin" : "/")} replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setErrors({});
    setFormError("");
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      // Not signed in here: the login is simply not used.
      if (admin && response.user.role !== "admin") {
        setFormError("This account isn't an admin. Use the shop's login instead.");
        return;
      }
      signIn(response);
      showToast(`Welcome back, ${response.user.firstName}!`);
      navigate(from ?? (response.user.role === "admin" ? "/admin" : "/"), { replace: true });
    } catch (err) {
      setErrors(apiFieldErrors(err));
      setFormError(apiErrorMessage(err, "Sign-in didn't work. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={admin ? "Admin Login" : "Login"}
      subtitle={
        admin ? (
          "Welcome, sign in to your admin account."
        ) : (
          <>
            Don't have an account yet?{" "}
            <Link to="/register" state={location.state} className="font-semibold text-brand hover:underline">
              Sign up now
            </Link>
          </>
        )
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {formError && <Notice tone="danger">{formError}</Notice>}
        <Field label="Email" htmlFor="email" error={errors.email}>
          <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" autoComplete="email" required hasError={Boolean(errors.email)} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required hasError={Boolean(errors.password)} />
        </Field>
        <Link to="/forgot-password" className="inline-block text-sm font-medium text-brand hover:underline">
          Forgot your password?
        </Link>
        <Button type="submit" block size="lg" loading={loading} className="h-[54px]">
          Login
        </Button>
        {admin && (
          <p className="text-center text-sm text-muted">
            Shopping instead?{" "}
            <Link to="/login" className="font-semibold text-brand hover:underline">
              Customer login
            </Link>
          </p>
        )}
      </form>
    </AuthShell>
  );
}
