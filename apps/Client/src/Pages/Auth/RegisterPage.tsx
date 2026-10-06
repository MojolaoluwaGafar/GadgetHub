import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { authService } from "../../API/services/authService";
import { useAuth } from "../../Context/AuthContext";
import { Field, Notice, PasswordInput, TextInput } from "../../Components";
import Button from "../../Components/Button";
import { apiErrorMessage, apiFieldErrors } from "../../utils/apiError";
import { showToast } from "../../utils/toastHelper";
import AuthShell from "./AuthShell";

const EMPTY = { firstName: "", lastName: "", email: "", phoneNumber: "", password: "", confirmPassword: "" };

export default function RegisterPage() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={from ?? "/"} replace />;

  const set = (key: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [key]: event.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: "The passwords don't match." });
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword: _confirm, ...input } = form;
      const response = await authService.register(input);
      // Signed in straight away; the first version sent people to log in again.
      signIn(response);
      showToast(`Welcome to GadgetHub, ${response.user.firstName}!`);
      navigate(from ?? "/", { replace: true });
    } catch (err) {
      setErrors(apiFieldErrors(err));
      setFormError(apiErrorMessage(err, "Sign-up didn't work. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      wide
      title="Sign Up"
      subtitle={
        <>
          Already have an account?{" "}
          <Link to="/login" state={location.state} className="font-semibold text-brand hover:underline">
            Login now
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {formError && <Notice tone="danger">{formError}</Notice>}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First Name" htmlFor="firstName" error={errors.firstName}>
            <TextInput id="firstName" value={form.firstName} onChange={set("firstName")} placeholder="John" autoComplete="given-name" hasError={Boolean(errors.firstName)} />
          </Field>
          <Field label="Last Name" htmlFor="lastName" error={errors.lastName}>
            <TextInput id="lastName" value={form.lastName} onChange={set("lastName")} placeholder="Smith" autoComplete="family-name" hasError={Boolean(errors.lastName)} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <TextInput id="email" type="email" value={form.email} onChange={set("email")} placeholder="e.g. david@gmail.com" autoComplete="email" hasError={Boolean(errors.email)} />
          </Field>
          <Field label="Mobile Number" htmlFor="phoneNumber" error={errors.phoneNumber}>
            <TextInput id="phoneNumber" type="tel" value={form.phoneNumber} onChange={set("phoneNumber")} placeholder="+234 90..." autoComplete="tel" hasError={Boolean(errors.phoneNumber)} />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
            <PasswordInput id="password" value={form.password} onChange={set("password")} autoComplete="new-password" hasError={Boolean(errors.password)} />
          </Field>
          <Field label="Confirm Password" htmlFor="confirmPassword" error={errors.confirmPassword}>
            <PasswordInput id="confirmPassword" value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" hasError={Boolean(errors.confirmPassword)} />
          </Field>
        </div>
        <Button type="submit" block size="lg" loading={loading} className="h-[54px]">
          Sign up
        </Button>
      </form>
    </AuthShell>
  );
}
