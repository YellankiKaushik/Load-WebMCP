import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Menu, Truck } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { label: "Overview", to: "/" },
  { label: "Architecture", to: "/architecture" },
  { label: "WebMCP", to: "/webmcp" },
  { label: "Verification", to: "/verification" },
] as const;

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="LoadGuard home">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
            <Truck className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold tracking-tight text-slate-950">
              LoadGuard 3D
            </span>
            <span className="hidden text-xs font-medium text-slate-500 sm:block">
              Human-authorized agent operations
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <MarketingNavLink key={item.to} to={item.to}>
              {item.label}
            </MarketingNavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href="https://github.com/YellankiKaushik/Load-WebMCP"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            GitHub
          </a>
          <Link
            to="/workspace"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Open live workspace
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <details className="group relative lg:hidden">
          <summary className="flex min-h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Open menu</span>
          </summary>
          <div className="absolute right-0 top-12 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
            {navItems.map((item) => (
              <MarketingNavLink key={item.to} to={item.to} mobile>
                {item.label}
              </MarketingNavLink>
            ))}
            <Link
              to="/workspace"
              className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Open live workspace
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}

function MarketingNavLink({
  to,
  mobile = false,
  children,
}: {
  to: "/" | "/architecture" | "/webmcp" | "/verification";
  mobile?: boolean;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className={
        mobile
          ? `block rounded-xl px-3 py-2.5 text-sm font-semibold ${
              isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
            }`
          : `rounded-lg px-3 py-2 text-sm font-semibold transition ${
              isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
            }`
      }
    >
      {children}
    </Link>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-slate-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-semibold text-slate-950">LoadGuard 3D</p>
          <p className="mt-1">Built for the OpenAI WebMCP Challenge 2026 by Kaushik Yellanki.</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Footer navigation">
          <Link to="/workspace" className="font-semibold hover:text-blue-700">
            Workspace
          </Link>
          <Link to="/architecture" className="font-semibold hover:text-blue-700">
            Architecture
          </Link>
          <Link to="/webmcp" className="font-semibold hover:text-blue-700">
            WebMCP
          </Link>
          <Link to="/verification" className="font-semibold hover:text-blue-700">
            Verification
          </Link>
          <a
            href="https://github.com/YellankiKaushik/Load-WebMCP"
            className="font-semibold hover:text-blue-700"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
