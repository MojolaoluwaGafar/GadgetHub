import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { CircleCheck, ShoppingCart } from "lucide-react";
import type { DeliveryMethod, Order, PaymentMethod } from "../types";
import { useAuth } from "../Context/AuthContext";
import { useCart } from "../Context/CartContext";
import { authService } from "../API/services/authService";
import { orderService } from "../API/services/orderService";
import { productService } from "../API/services/productService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import { Breadcrumbs, EmptyState, Notice, PageLoader } from "../Components";
import AddressFields, { type AddressValue } from "../Components/AddressFields";
import Modal from "../Components/Modal";
import Button from "../Components/Button";
import { Footer, TopBar } from "../Layout/AppLayout";
import { apiErrorMessage, apiFieldErrors } from "../utils/apiError";
import { showToast } from "../utils/toastHelper";
import { cx, naira } from "../utils/format";
import logo from "../assets/logo.png";
import secureIcon from "../assets/icons/secure-payment.png";
import moneyBag from "../assets/icons/money-bag.png";
import atmCard from "../assets/icons/atm-card.png";

const inputClass = "my-2 block w-full rounded-md border border-line px-3 py-2 text-ink focus:border-brand focus:outline-none";

function Box({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-line p-4">
      <h2 className="pb-3 text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

// The design's bordered radio rows.
function Option({ checked, onChange, label, note, icon, disabled }: { checked: boolean; onChange: () => void; label: string; note?: string; icon?: string; disabled?: boolean }) {
  return (
    <label
      className={cx(
        "my-2 flex min-h-[54px] w-full cursor-pointer items-center justify-between gap-3 rounded-md border-[1.5px] p-3",
        checked ? "border-brand" : "border-line",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="flex items-center gap-3">
        <input type="radio" checked={checked} onChange={onChange} disabled={disabled} className="h-5 w-5 accent-brand" />
        <span>
          {label}
          {note && <span className="block text-sm text-[#6c6c6c]">{note}</span>}
        </span>
      </span>
      {icon && <img src={icon} alt="" className="h-6 w-auto" />}
    </label>
  );
}

function ErrorText({ message }: { message?: string }) {
  return message ? <p className="-mt-1 mb-2 text-xs font-medium text-danger">{message}</p> : null;
}

export default function CheckoutPage() {
  const { user, setUser } = useAuth();
  const { items, count, subtotal, clear, refresh } = useCart();
  const navigate = useNavigate();
  const config = useApiQuery(() => productService.config(), [], "");

  const saved = user?.addresses.find((a) => a.isDefault) ?? user?.addresses[0];
  const [fullName, setFullName] = useState(user ? `${user.firstName} ${user.lastName}`.trim() : "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phoneNumber ?? "");
  const [address, setAddress] = useState<AddressValue>(saved ? { address: saved.address, state: saved.state, city: saved.city } : { address: "", state: "", city: "" });
  const [saveAddress, setSaveAddress] = useState(!saved);
  const [delivery, setDelivery] = useState<DeliveryMethod>("doorstep");
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<string[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);

  const paystackEnabled = config.data?.paystackEnabled ?? false;
  const fee = delivery === "doorstep" ? (config.data?.deliveryFee ?? 3000) : 0;

  useEffect(() => {
    refresh().then(setNotes).catch(() => undefined);
  }, [refresh]);

  useEffect(() => {
    if (config.data && !payment) setPayment(config.data.paystackEnabled ? "paystack" : "delivery");
  }, [config.data, payment]);

  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  const lastName = rest.join(" ");

  // Checked here first so the preview only opens for a complete order.
  const validate = () => {
    const found: Record<string, string> = {};
    if (!firstName || !lastName) found.fullName = "Enter your first and last name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) found.email = "Enter a valid email address.";
    if (!/^\+?[\d\s()-]{10,20}$/.test(phone.trim())) found.phone = "Enter a valid phone number.";
    if (delivery === "doorstep") {
      if (address.address.trim().length < 5) found.address = "Enter your delivery address.";
      if (!address.state) found.state = "Pick your state.";
      if (!address.city) found.city = "Pick your city.";
    }
    if (!payment) found.payment = "Choose how to pay.";
    setErrors(found);
    if (Object.keys(found).length) showToast("Please complete all checkout steps", "error");
    return Object.keys(found).length === 0;
  };

  const confirm = async () => {
    if (!payment) return;
    setPlacing(true);
    try {
      const { order, paymentUrl } = await orderService.place({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity, color: item.color, storage: item.storage })),
        customer: { firstName: firstName!, lastName, email, phone, ...(delivery === "doorstep" ? address : { address: "", state: "", city: "" }) },
        deliveryMethod: delivery,
        paymentMethod: payment,
        saveAddress: delivery === "doorstep" && saveAddress,
      });
      clear();
      if (delivery === "doorstep" && saveAddress) authService.me().then(setUser).catch(() => undefined);
      if (paymentUrl) {
        window.location.assign(paymentUrl);
        return;
      }
      setPreviewing(false);
      setPlaced(order);
      showToast("Order placed successfully. Pay on delivery.");
    } catch (err) {
      const fields = apiFieldErrors(err);
      setErrors({
        fullName: fields["customer.firstName"] ?? fields["customer.lastName"],
        email: fields["customer.email"],
        phone: fields["customer.phone"],
        address: fields["customer.address"],
        state: fields["customer.state"],
        city: fields["customer.city"],
        payment: fields.paymentMethod,
      });
      setPreviewing(false);
      showToast(apiErrorMessage(err, "Your order wasn't placed. Please try again."), "error");
      refresh().then(setNotes).catch(() => undefined);
    } finally {
      setPlacing(false);
    }
  };

  let body: ReactNode;
  if (placed) {
    body = <div className="min-h-[40vh]" />;
  } else if (!items.length) {
    body = placing ? <PageLoader label="Placing your order…" /> : <EmptyState icon={<ShoppingCart />} title="Your cart is empty" text="Add something to your cart to check out." action={<Button to="/products">Start Shopping</Button>} />;
  } else {
    body = (
      <div className="flex w-full flex-col justify-between gap-5 lg:flex-row">
        <div className="flex w-full flex-col gap-4 lg:w-2/3">
          {notes.length > 0 && (
            <Notice tone="warning">
              <p className="font-semibold">Your cart was updated</p>
              <ul className="mt-1 list-disc pl-5">
                {notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </Notice>
          )}

          <Box title="Customer Details">
            <label className="text-lg" htmlFor="fullName">
              Full Name
            </label>
            <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Enter your full name" autoComplete="name" />
            <ErrorText message={errors.fullName} />
            <div className="my-2 flex flex-col gap-0 sm:flex-row sm:gap-5">
              <div className="sm:w-1/2">
                <label className="text-lg" htmlFor="email">
                  Email Address
                </label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="Enter your email address" autoComplete="email" />
                <ErrorText message={errors.email} />
              </div>
              <div className="sm:w-1/2">
                <label className="text-lg" htmlFor="phone">
                  Phone Number
                </label>
                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+234" autoComplete="tel" />
                <ErrorText message={errors.phone} />
              </div>
            </div>
            {delivery === "doorstep" ? (
              <>
                <AddressFields idPrefix="checkout" value={address} onChange={setAddress} errors={{ address: errors.address, state: errors.state, city: errors.city }} />
                <label className="flex items-center gap-2 pt-4">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-5 w-5 accent-brand" />
                  Save my information for a faster checkout
                </label>
              </>
            ) : (
              <p className="text-sm text-muted">Picking up: no delivery address needed.</p>
            )}
          </Box>

          <Box title="Delivery Details">
            <Option checked={delivery === "doorstep"} onChange={() => setDelivery("doorstep")} label="Door step Delivery" note={`${naira(config.data?.deliveryFee ?? 3000)} · 1-2 days`} />
            <Option checked={delivery === "pickup"} onChange={() => setDelivery("pickup")} label="Pick up" note="Free · from our showroom, 12 Street Address City, Lagos" />
          </Box>

          <Box title="Select Payment Method">
            <Option checked={payment === "delivery"} onChange={() => setPayment("delivery")} label="Pay On Delivery" icon={moneyBag} />
            <Option
              checked={payment === "paystack"}
              onChange={() => setPayment("paystack")}
              disabled={!paystackEnabled}
              label="Pay With Paystack"
              note={paystackEnabled ? "Card, bank transfer or USSD" : "Not available right now"}
              icon={atmCard}
            />
            <ErrorText message={errors.payment} />
          </Box>
        </div>

        <aside className="w-full self-start rounded-md border border-line p-3 lg:w-1/3">
          <h2 className="text-xl font-semibold">Order Summary ({count})</h2>
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between border-b border-t border-line p-3">
              <div className="flex items-center gap-2">
                <span className="h-[63px] w-[63px] shrink-0 overflow-hidden rounded-[3px] bg-panel">{item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}</span>
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted">
                    {[item.color, item.storage].filter(Boolean).join(" • ")} x{item.quantity}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted">{naira(item.price * item.quantity)}</p>
            </div>
          ))}
          <div className="flex flex-col py-3">
            <div className="flex justify-between">
              <p className="text-lg text-muted">Subtotal</p>
              <p className="text-lg">{naira(subtotal)}</p>
            </div>
            <div className="flex justify-between py-2">
              <p className="text-lg text-muted">Delivery Cost</p>
              <p className="text-lg">{naira(fee)}</p>
            </div>
          </div>
          <div className="flex justify-between">
            <p className="text-lg text-muted">Total</p>
            <p className="text-[22px]">{naira(subtotal + fee)}</p>
          </div>
          <Button className="my-5 h-12 w-full" onClick={() => validate() && setPreviewing(true)}>
            Confirm Order
          </Button>
          <p className="text-center text-muted">(Complete the steps in order to proceed)</p>
        </aside>
      </div>
    );
  }

  const row = "my-2 block w-full rounded-md border border-line px-3 py-2";

  return (
    <div className="flex w-full flex-col">
      <TopBar />
      <div className="container-page flex justify-between py-3">
        <Link to="/">
          <img src={logo} alt="GadgetHub" className="h-[39px] w-[152px] object-contain" />
        </Link>
        <div className="flex items-center gap-2">
          <img src={secureIcon} alt="" className="h-4 w-4 lg:h-6 lg:w-6" />
          <p className="text-sm lg:text-lg">secure & safe payment</p>
        </div>
      </div>
      <div className="container-page">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Cart", to: "/cart" }, { label: "Checkout" }]} />
        {body}
      </div>
      <Footer />

      {/* Review Your Order */}
      <Modal open={previewing} onClose={() => setPreviewing(false)} title="Review Your Order">
        <section className="mb-4">
          <h3 className="font-semibold">Customer Details</h3>
          <p className="mt-2 text-sm">Full Name</p>
          <p className={row}>{fullName}</p>
          <p className="text-sm">Email Address</p>
          <p className={row}>{email}</p>
          <p className="text-sm">Phone Number</p>
          <p className={row}>{phone}</p>
          {delivery === "doorstep" && (
            <>
              <p className="text-sm">Address</p>
              <p className={row}>{address.address}</p>
              <p className="text-sm">State and City</p>
              <p className={row}>
                {address.state}, {address.city}
              </p>
            </>
          )}
        </section>
        <section className="mb-4">
          <h3 className="font-semibold">Delivery Method</h3>
          <p className={row}>{delivery === "doorstep" ? "Door step Delivery" : "Pick up"}</p>
        </section>
        <section className="mb-4">
          <h3 className="font-semibold">Payment Method</h3>
          <p className={row}>{payment === "paystack" ? "Paystack" : "Pay On Delivery"}</p>
        </section>
        <section className="mb-4">
          <h3 className="font-semibold">Items</h3>
          {items.map((item) => (
            <div key={item.key} className="flex justify-between">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{naira(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold">
            <span>Total</span>
            <span>{naira(subtotal + fee)}</span>
          </div>
        </section>
        <div className="mt-6 flex justify-between gap-3">
          <Button variant="outline" onClick={() => setPreviewing(false)}>
            Edit Order
          </Button>
          <Button onClick={confirm} loading={placing}>
            {payment === "paystack" ? "Confirm & Pay" : "Confirm Order"}
          </Button>
        </div>
      </Modal>

      {/* Your Order Has Been Received */}
      <Modal open={Boolean(placed)} onClose={() => navigate(`/account/orders/${placed?.id}`)} size="sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-[99px] w-[99px] items-center justify-center rounded-full bg-[#f1ffec] text-success">
            <CircleCheck className="h-12 w-12" />
          </span>
          <p className="text-[28px] font-semibold">Your Order Has Been Received</p>
          <p className="text-xl text-[#686565]">Thank you for placing an order</p>
          <p className="text-xl">Order ID: {placed?.orderNumber}</p>
          <Button className="h-12 w-full" onClick={() => navigate(`/account/orders/${placed?.id}`)}>
            See Order Details
          </Button>
        </div>
      </Modal>
    </div>
  );
}
