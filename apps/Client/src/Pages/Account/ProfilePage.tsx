import { useState, type FormEvent, type ReactNode } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import type { Address } from "../../types";
import { authService, type AddressInput } from "../../API/services/authService";
import { useAuth } from "../../Context/AuthContext";
import { Field, TextInput } from "../../Components";
import AddressFields from "../../Components/AddressFields";
import Modal from "../../Components/Modal";
import Button from "../../Components/Button";
import { apiErrorMessage, apiFieldErrors } from "../../utils/apiError";
import { showToast } from "../../utils/toastHelper";
import { initials } from "../../utils/format";

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-md border border-[#e6eff5] p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ProfileCard() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: user!.firstName, lastName: user!.lastName, phoneNumber: user!.phoneNumber });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      setUser(await authService.updateProfile(form));
      setEditing(false);
      showToast("Profile updated");
    } catch (err) {
      setErrors(apiFieldErrors(err));
      showToast(apiErrorMessage(err, "Your profile wasn't saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Profile Information"
      action={
        !editing && (
          <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1 rounded-full bg-danger-soft px-3 py-1 text-xs font-semibold text-danger">
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )
      }
    >
      <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">{initials(user!.firstName, user!.lastName)}</span>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="First name" htmlFor="p-first" error={errors.firstName}>
          <TextInput id="p-first" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} disabled={!editing} hasError={Boolean(errors.firstName)} />
        </Field>
        <Field label="Last name" htmlFor="p-last" error={errors.lastName}>
          <TextInput id="p-last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} disabled={!editing} hasError={Boolean(errors.lastName)} />
        </Field>
        <Field label="Email address" htmlFor="p-email" hint={editing ? "Contact us to change your email." : undefined}>
          <TextInput id="p-email" value={user!.email} disabled />
        </Field>
        <Field label="Phone number" htmlFor="p-phone" error={errors.phoneNumber}>
          <TextInput id="p-phone" type="tel" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} disabled={!editing} hasError={Boolean(errors.phoneNumber)} />
        </Field>
        {editing && (
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
            <Button
              variant="ghost"
              className="border border-line"
              onClick={() => {
                setEditing(false);
                setErrors({});
                setForm({ firstName: user!.firstName, lastName: user!.lastName, phoneNumber: user!.phoneNumber });
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}

const EMPTY_ADDRESS: AddressInput = { label: "Home", address: "", state: "", city: "", isDefault: false };

function AddressBook() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const addresses = user!.addresses;

  const open = (address: Address | "new") => {
    setErrors({});
    setForm(address === "new" ? { ...EMPTY_ADDRESS, label: addresses.length ? "Other" : "Home", isDefault: !addresses.length } : { ...address });
    setEditing(address);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      setUser(editing === "new" ? await authService.addAddress(form) : await authService.updateAddress((editing as Address).id, form));
      setEditing(null);
      showToast("Address saved");
    } catch (err) {
      setErrors(apiFieldErrors(err));
      showToast(apiErrorMessage(err, "The address wasn't saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const run = async (action: () => Promise<typeof user>, done: string) => {
    try {
      setUser((await action())!);
      showToast(done);
    } catch (err) {
      showToast(apiErrorMessage(err, "That didn't work."), "error");
    }
  };

  return (
    <Card
      title="Saved Addresses"
      action={
        <Button size="sm" variant="soft" onClick={() => open("new")}>
          <Plus className="h-4 w-4" /> Add address
        </Button>
      }
    >
      {addresses.length === 0 ? (
        <p className="rounded-md border border-[#e6eff5] p-4 text-muted">No address saved yet. Add one for a faster checkout.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-md border border-[#e6eff5] p-4">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold">
                    {address.label}
                    {address.isDefault && <span className="rounded-full bg-[#f7f1f1] px-2.5 py-0.5 text-xs font-medium">Default</span>}
                  </p>
                  <p className="text-sm text-muted">
                    {address.address}, {address.city}, {address.state}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => open(address)} className="flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-semibold hover:border-ink">
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => run(() => authService.updateAddress(address.id, { ...address, isDefault: true }), "Default address updated")}
                    className="rounded-full border border-line px-3 py-1 text-xs font-semibold hover:border-ink"
                  >
                    Make default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => run(() => authService.removeAddress(address.id), "Address deleted")}
                  className="flex items-center gap-1 rounded-full bg-danger-soft px-3 py-1 text-xs font-semibold text-danger"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add an address" : "Edit address"}
        footer={
          <>
            <Button variant="ghost" className="border border-line" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" onClick={save} loading={saving}>
              Save address
            </Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4" noValidate>
          <Field label="Label" htmlFor="a-label" error={errors.label} hint="For example Home, Work or Mum's place.">
            <TextInput id="a-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} maxLength={30} />
          </Field>
          <AddressFields idPrefix="a" value={form} onChange={(value) => setForm({ ...form, ...value })} errors={errors} />
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="h-4.5 w-4.5 accent-brand" />
            Use as my default address
          </label>
        </form>
      </Modal>
    </Card>
  );
}

export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">My Info</h1>
      <p className="text-subtle">Manage your personal information and addresses</p>
      <div className="mt-6 space-y-5">
        <ProfileCard />
        <AddressBook />
      </div>
    </div>
  );
}
