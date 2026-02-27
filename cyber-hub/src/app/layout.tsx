import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { MobileSidebarProvider } from "@/components/layout/MobileSidebarContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "shebang.az | Security Engineering Platform",
  description:
    "#!/bin/security - Comprehensive cybersecurity engineering hub for documentation, news, articles, and community",
  keywords: [
    "cybersecurity",
    "infosec",
    "security engineering",
    "pentesting",
    "SIEM",
    "EDR",
    "shebang",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-cyber-bg text-cyber-text antialiased`}>
        <AuthProvider>
          <MobileSidebarProvider>
            <div className="flex h-[100dvh] overflow-hidden">
              <Sidebar />
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto matrix-grid">
                  {children}
                </main>
              </div>
            </div>
            <AuthModal />
          </MobileSidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
