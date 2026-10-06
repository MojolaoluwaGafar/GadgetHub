import { Link, useParams } from "react-router";
import { Breadcrumbs } from "../Components";
import NotFoundPage from "./NotFoundPage";

// The footer's Quick Links that are text, not shopping: returns, privacy,
// FAQs, warranty, contact and our story.
const PAGES: Record<string, { title: string; body: { heading?: string; text: string }[] }> = {
  returns: {
    title: "Refund & Returns",
    body: [
      { text: "Changed your mind? Return any unused item in its original packaging within 24 hours of delivery for a full refund." },
      { heading: "How to return", text: "Call us on (+234) 01234 5678 with your order number, or bring the item to our showroom at 12 Street Address City, Lagos." },
      { heading: "Refunds", text: "Online payments are refunded to the card or account you paid with within 5 working days of us receiving the item. Pay-on-delivery orders are refunded by bank transfer." },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      { text: "We collect only what we need to deliver your order: your name, email, phone number and delivery address." },
      { heading: "Payments", text: "Card and bank details are entered on Paystack's secure page. They never reach GadgetHub." },
      { heading: "Your account", text: "You can update your details or delete your account at any time from Account Settings. Past orders stay in our records for accounting." },
    ],
  },
  faqs: {
    title: "Frequently Asked Questions",
    body: [
      { heading: "How long does delivery take?", text: "Doorstep delivery takes 1-2 days. Pickup orders are ready at our Lagos showroom the next day." },
      { heading: "How can I pay?", text: "Online with card, bank transfer or USSD through Paystack, or cash/transfer when your order arrives." },
      { heading: "Can I cancel an order?", text: "Yes, from My Orders, until it has been shipped." },
      { heading: "Are your products genuine?", text: "Every product is brand new and sourced from authorised distributors, with the manufacturer's warranty." },
    ],
  },
  warranty: {
    title: "Warranty",
    body: [
      { text: "All products come with the manufacturer's warranty, usually 12 months for phones and laptops and 6 months for accessories." },
      { heading: "Making a claim", text: "Bring the item and your order number to our showroom, or call us, and we'll handle the claim with the manufacturer." },
    ],
  },
  contact: {
    title: "Contact Us",
    body: [
      { heading: "Showroom", text: "12 Street Address City, Lagos. Monday to Saturday, 9:00 AM - 5:30 PM." },
      { heading: "Phone", text: "(+234) 01234 5678" },
      { heading: "Orders", text: "For help with an order, have your order number ready (you'll find it in My Orders and in your confirmation email)." },
    ],
  },
  "our-story": {
    title: "Our Story",
    body: [
      { text: "GadgetHub started with a simple idea: buying a phone or laptop in Nigeria should be easy, honest and safe." },
      { text: "We stock genuine gadgets from the brands people trust, price them clearly, and deliver them fast, with real people on the phone when you need help." },
    ],
  },
};

export default function InfoPage() {
  const { slug = "" } = useParams();
  const page = PAGES[slug];
  if (!page) return <NotFoundPage />;
  return (
    <div className="container-page max-w-3xl pb-6">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: page.title }]} />
      <h1 className="text-[28px] font-semibold">{page.title}</h1>
      <div className="mt-4 space-y-5 text-ink-soft">
        {page.body.map((section, index) => (
          <section key={index}>
            {section.heading && <h2 className="mb-1 text-lg font-semibold text-ink">{section.heading}</h2>}
            <p className="leading-relaxed">{section.text}</p>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted">
        Still need help?{" "}
        <Link to="/info/contact" className="text-brand hover:underline">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}
