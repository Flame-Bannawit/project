// app/layout.tsx
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "HealthyMate AI",
  description: "AI-powered food logging assistant",
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/analyze", label: "Analyze" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <body className="min-h-screen text-white">
        <div className="min-h-screen flex flex-col">
          {/* ---------- NAVBAR ---------- */}
          <header className="border-b border-white/10 bg-black/40 backdrop-blur relative z-50">
            <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
              {/* โลโก้ HealthyMate */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center text-xs font-bold">
                  HM
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base">
                    HealthyMate
                  </div>
                  <div className="text-[11px] text-gray-400">
                    AI Food Logging Prototype
                  </div>
                </div>
              </div>

              {/* เมนู Desktop */}
              <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-1.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* เมนู Mobile (Hamburger) */}
              <details className="relative sm:hidden">
                <summary
                  className="list-none flex flex-col gap-1 p-2 rounded-lg border border-white/20 bg-black/40 cursor-pointer
                             [&::-webkit-details-marker]:hidden"
                >
                  <span className="w-5 h-[2px] bg-white rounded-full" />
                  <span className="w-5 h-[2px] bg-white rounded-full" />
                  <span className="w-5 h-[2px] bg-white rounded-full" />
                </summary>

                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-black/95 shadow-xl py-2 text-xs">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-1.5 text-gray-200 hover:bg-white/10"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            </nav>
          </header>
          {/* ---------- /NAVBAR ---------- */}

          {/* Main content */}
          <main className="flex-1 flex">
            <div className="w-full flex items-start sm:items-center justify-center px-4 py-6">
              <div className="w-full max-w-4xl">
                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_45px_rgba(0,0,0,0.75)] p-4 sm:p-6 lg:p-8">
                  {children}
                </div>
              </div>
            </div>
          </main>

          {/* Footer เล็ก ๆ */}
          <footer className="border-t border-white/5 text-[11px] text-gray-500 py-3 text-center">
            CPE491 · HealthyMate Prototype · Built with Next.js & Tailwind
          </footer>
        </div>
      </body>
    </html>
  );
}
