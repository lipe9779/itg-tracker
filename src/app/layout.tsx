import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITG Tracker",
  description: "Track maritime shipments by container number or Bill of Lading. Real-time carrier identification and shipment status monitoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-slate-950">
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
          {/* Subtle Background Watermark Image - Boosted Visibility & Screen Blending */}
          <div 
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: "url('/bg-watermark.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: 0.45,
              filter: "brightness(3.5) contrast(1.8) saturate(1.5)",
              mixBlendMode: "screen"
            }}
          />

          {/* Core Content - relative z-10 */}
          <div className="relative z-10 flex flex-col min-h-screen">
            {/* Navigation */}
          <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <a href="/" className="flex items-center gap-3">
                  <img src="/logo.png" alt="ITG Logo" className="h-8 w-auto object-contain" />
                  <span className="text-lg font-semibold text-white tracking-tight">ITG Tracker</span>
                </a>
                <div className="flex items-center gap-1">
                  <a
                    href="/"
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                  >
                    Track
                  </a>
                  <a
                    href="/admin"
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                  >
                    Admin
                  </a>
                </div>
              </div>
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
