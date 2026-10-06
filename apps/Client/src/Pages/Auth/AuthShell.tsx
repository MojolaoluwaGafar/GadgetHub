import type { ReactNode } from "react";
import { Link } from "react-router";
import { X } from "lucide-react";

// The design's auth screens: a big title, a line with a link (e.g. "Don't have
// an account yet? Sign up now"), the form, and a close button back to the shop.
export default function AuthShell({ title, subtitle, children, wide }: { title: string; subtitle?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center px-5 py-8 lg:px-10">
      <div className={`relative flex w-full flex-col items-center ${wide ? "lg:w-[700px]" : "lg:w-[600px]"}`}>
        <Link to="/" className="absolute right-0 top-0" aria-label="Back to the shop">
          <X className="h-10 w-10" strokeWidth={1.5} />
        </Link>
        <h1 className="text-[44px] font-semibold sm:text-[54px]">{title}</h1>
        {subtitle && <p className="text-center text-lg">{subtitle}</p>}
        <div className="w-full pt-5">{children}</div>
      </div>
    </div>
  );
}
