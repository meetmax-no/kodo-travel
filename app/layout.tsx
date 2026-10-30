import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/AppShell";
import { Splash } from "@/components/Splash";
import { APP_VERSION } from "@/lib/version";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Ingen innlogging ennå → hold siden unna søkemotorer.
export const metadata: Metadata = {
  title: "Dream Travel",
  applicationName: "Dream Travel",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Dream Travel", statusBarStyle: "black-translucent" },
};

// viewportFit: cover + safe-area i CSS, så appen fyller skjermen på iPhone (hjem-skjerm-app).
export const viewport: Viewport = {
  themeColor: "#0a0e17",
  viewportFit: "cover",
};

// lang="no" = DEFAULT_LOCALE; LocaleProvider oppdaterer den på klienten.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <Splash />
          <AppShell version={APP_VERSION}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
