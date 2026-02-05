import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

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
      <body className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-cyber-bg text-cyber-text antialiased`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto matrix-grid">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
