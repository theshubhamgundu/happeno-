import type { Metadata } from "next";
import { Geist, Geist_Mono, Kanit, Poppins, Montserrat, DM_Sans, Syne, Space_Mono } from "next/font/google";
import "./globals.css";
import { ViewTransitions } from 'next-view-transitions'
import SmoothScroll from "@/components/SmoothScroll";

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

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

// Landing page display font
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

// Landing page mono font
const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
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
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${kanit.variable} ${montserrat.variable} ${dmSans.variable} ${syne.variable} ${spaceMono.variable} ${poppins.className} antialiased overflow-x-hidden bg-white text-slate-900`}
        >
          <AuthProvider>
            <HackathonProvider>
              <SmoothScroll>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
                <Toaster
                  position="top-center"
                  theme="light"
                  richColors
                  toastOptions={{
                    style: {
                      background: "rgba(255, 255, 255, 0.94)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid #e7eaf1",
                      color: "#172033",
                      fontFamily: "var(--font-geist-sans)",
                      borderRadius: "14px",
                      boxShadow: "0 16px 35px -18px rgba(15, 23, 42, 0.25)",
                    },
                    classNames: {
                      toast: "group toast-group",
                      title: "group-[.toast]:font-bold group-[.toast]:text-base",
                      description: "group-[.toast]:text-slate-500",
                      actionButton: "group-[.toast]:bg-indigo-600 group-[.toast]:text-white",
                      cancelButton: "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-700",
                      error: "group-[.toast]:text-slate-900 group-[.toast]:border-slate-800/20",
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
