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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-slate-50">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
          {/* Ambient glowing radial effects for premium luxury feel */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#008361]/3 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00b090]/3 rounded-full blur-[120px] pointer-events-none" />

          {/* Subtle Background Watermark Image - Adjusted for Light Mode blending */}
          <div 
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: "url('/bg-watermark.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: 0.02,
              mixBlendMode: "multiply"
            }}
          />

          {/* Core Content - relative z-10 */}
          <div className="relative z-10 flex flex-col min-h-screen">
            {/* Navigation */}
          <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <a href="/" className="flex items-center gap-3">
                  <img src="/logo.png" alt="ITG Logo" className="h-8 w-auto object-contain" />
                  <span className="text-lg font-semibold text-[#0d131a] tracking-tight">ITG Tracker</span>
                </a>
                <div className="flex items-center gap-1">
                  <a
                    href="/"
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#008361] rounded-lg hover:bg-slate-100/60 transition-all"
                  >
                    Track
                  </a>
                  <a
                    href="/admin"
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#008361] rounded-lg hover:bg-slate-100/60 transition-all"
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
