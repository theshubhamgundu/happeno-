import type { Metadata } from "next";
import { Geist, Geist_Mono, Kanit, Poppins, Montserrat, DM_Sans, Syne, Space_Mono } from "next/font/google";
import "./globals.css";
import { ViewTransitions } from 'next-view-transitions'
import SmoothScroll from "@/components/SmoothScroll";

const poppins = Poppins({
  subsets: ["latin"],
  weight: "400",
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
  weight: "400",
  subsets: ["latin"],
  variable: "--font-kanit",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: "variable",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: "400",
});

// Landing page display font
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: "variable",
});

// Landing page mono font
const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://happeno.in'),
  title: {
    default: "HAPPENO | HMS Operating System",
    template: "%s | HAPPENO"
  },
  description: "Happeno is the modern hackathon platform for universities and builder communities. Stage-wise pipelines, live rubric scoring, sub-second QR entry, and team management.",
  keywords: ["Hackathon", "Happeno", "Coding", "Tech Event", "Hackathon Platform", "Judging Rubric", "Team Workspace"],
  openGraph: {
    title: "HAPPENO | HMS Operating System",
    description: "Modern hackathon platform for universities and builder communities.",
    url: 'https://happeno.in',
    siteName: 'HAPPENO',
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
          className={`${geistSans.variable} ${geistMono.variable} ${kanit.variable} ${montserrat.variable} ${dmSans.variable} ${syne.variable} ${spaceMono.variable} ${poppins.className} antialiased overflow-x-hidden bg-black text-white`}
        >
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
                      background: "rgba(13, 13, 18, 0.95)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid #27272a",
                      color: "#ffffff",
                      fontFamily: "var(--font-geist-sans)",
                      borderRadius: "14px",
                      boxShadow: "0 16px 35px -18px rgba(15, 23, 42, 0.25)",
                    },
                    classNames: {
                      toast: "group toast-group",
                      title: "group-[.toast]:font-bold group-[.toast]:text-base",
                      description: "group-[.toast]:text-slate-500",
                      actionButton: "group-[.toast]:bg-orange-600 group-[.toast]:text-white",
                      cancelButton: "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-200",
                      error: "group-[.toast]:text-red-400 group-[.toast]:border-red-500/20",
                      success: "group-[.toast]:text-green-400 group-[.toast]:border-green-500/20",
                      warning: "group-[.toast]:text-yellow-400 group-[.toast]:border-yellow-500/20",
                      info: "group-[.toast]:text-orange-400 group-[.toast]:border-orange-500/20",
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
