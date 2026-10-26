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
          className={`${geistSans.variable} ${geistMono.variable} ${kanit.variable} ${montserrat.variable} ${dmSans.variable} ${syne.variable} ${spaceMono.variable} ${poppins.className} antialiased overflow-x-hidden bg-[#FAF9F5] text-black relative`}
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
                      background: "#FFFFFF",
                      border: "2px solid #000000",
                      color: "#000000",
                      fontFamily: "var(--font-geist-sans)",
                      borderRadius: "14px",
                      boxShadow: "2px 2px 0px #000000",
                    },
                    classNames: {
                      toast: "group toast-group",
                      title: "group-[.toast]:font-bold group-[.toast]:text-base",
                      description: "group-[.toast]:text-neutral-600",
                      actionButton: "group-[.toast]:bg-[#FF5722] group-[.toast]:text-white",
                      cancelButton: "group-[.toast]:bg-neutral-100 group-[.toast]:text-black",
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
