import { useNigeria } from "../utils/nigeria";
import { Field, SelectInput, TextInput } from "./index";

export interface AddressValue {
  address: string;
  state: string;
  city: string;
}

// Street address, then state and city (LGA) dropdowns. Used at checkout and
// in the address book.
export default function AddressFields({
  value,
  onChange,
  errors = {},
  idPrefix,
}: {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  errors?: Partial<Record<keyof AddressValue, string>>;
  idPrefix: string;
}) {
  const { data, failed } = useNigeria();
  const states = data ? Object.keys(data) : value.state ? [value.state] : [];
  const cities = data?.[value.state] ?? (value.city ? [value.city] : []);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Delivery address" htmlFor={`${idPrefix}-address`} error={errors.address} className="sm:col-span-2">
        <TextInput
          id={`${idPrefix}-address`}
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="House number and street"
          autoComplete="street-address"
          hasError={Boolean(errors.address)}
        />
      </Field>
      <Field label="State" htmlFor={`${idPrefix}-state`} error={errors.state}>
        {failed ? (
          <TextInput id={`${idPrefix}-state`} value={value.state} onChange={(e) => onChange({ ...value, state: e.target.value })} hasError={Boolean(errors.state)} />
        ) : (
          <SelectInput
            id={`${idPrefix}-state`}
            value={value.state}
            onChange={(e) => onChange({ ...value, state: e.target.value, city: "" })}
            hasError={Boolean(errors.state)}
            disabled={!data}
          >
            <option value="">{data ? "Please select" : "Loading states…"}</option>
            {states.map((state) => (
              <option key={state}>{state}</option>
            ))}
          </SelectInput>
        )}
      </Field>
      <Field label="City / LGA" htmlFor={`${idPrefix}-city`} error={errors.city}>
        {failed ? (
          <TextInput id={`${idPrefix}-city`} value={value.city} onChange={(e) => onChange({ ...value, city: e.target.value })} hasError={Boolean(errors.city)} />
        ) : (
          <SelectInput
            id={`${idPrefix}-city`}
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            hasError={Boolean(errors.city)}
            disabled={!value.state || !data}
          >
            <option value="">Please select</option>
            {cities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </SelectInput>
        )}
      </Field>
    </div>
  );
}
