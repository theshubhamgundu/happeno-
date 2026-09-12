import type { Metadata } from "next";
import { Geist, Geist_Mono, Kanit, Poppins } from "next/font/google";
import "./globals.css";
import { ViewTransitions } from 'next-view-transitions'
import SmoothScroll from "@/components/SmoothScroll";
import ThemeToggle from "@/components/ThemeToggle";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kanit = Kanit({
  weight: ["400", "700", "800"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://tricity.online'),
  title: {
    default: "TRI-CITY AI HACKATHON | Centle India Hyderabad Hackathon",
    template: "%s | TRI-CITY AI HACKATHON"
  },
  description: "TRI-CITY AI HACKATHON is Centle India Hyderabad's student-run hackathon. Join us for 2 days of coding, innovation, and fun. February 27-28, 2026.",
  keywords: ["Hackathon", "Centle India", "Coding", "tricity", "Hyderabad", "Tech Event", "Centle India"],
  openGraph: {
    title: "TRI-CITY AI HACKATHON | Centle India Hyderabad Hackathon",
    description: "Join us for 2 days of coding, innovation, and fun at Centle India, Hyderabad.",
    url: 'https://tricity.online',
    siteName: 'TRI-CITY AI HACKATHON',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

import LayoutWrapper from "@/components/LayoutWrapper";

import { AuthProvider } from "@/context/AuthContext";
import { HackathonProvider } from "@/context/HackathonContext";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
          <script dangerouslySetInnerHTML={{
            __html: "try { const savedTheme = localStorage.getItem('tricity-theme'); const preferredTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; document.documentElement.dataset.theme = savedTheme || preferredTheme; } catch (_) { document.documentElement.dataset.theme = 'dark'; }",
          }} />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${kanit.variable} ${poppins.className} antialiased overflow-x-hidden bg-black`}
        >
          <ThemeToggle />
          <AuthProvider>
            <HackathonProvider>
              <SmoothScroll>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
                <Toaster
                  position="top-center"
                  theme="dark"
                  richColors
                  toastOptions={{
                    style: {
                      background: "rgba(11, 1, 20, 0.8)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#fff",
                      fontFamily: "var(--font-kanit)",
                      borderRadius: "16px",
                      boxShadow: "0 10px 30px -10px rgba(109, 40, 217, 0.3)",
                    },
                    classNames: {
                      toast: "group toast-group",
                      title: "group-[.toast]:font-bold group-[.toast]:text-base",
                      description: "group-[.toast]:text-white/60",
                      actionButton: "group-[.toast]:bg-purple-600 group-[.toast]:text-white",
                      cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white",
                      error: "group-[.toast]:text-red-400 group-[.toast]:border-red-500/20",
                      success: "group-[.toast]:text-green-400 group-[.toast]:border-green-500/20",
                      warning: "group-[.toast]:text-yellow-400 group-[.toast]:border-yellow-500/20",
                      info: "group-[.toast]:text-blue-400 group-[.toast]:border-blue-500/20",
                    },
                  }}
                />
              </SmoothScroll>
            </HackathonProvider>
          </AuthProvider>
        </body>
      </html>
    </ViewTransitions >
  );
}
