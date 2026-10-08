import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";
import { BottomTabs } from "@/components/site/bottom-tabs";
import { LaunchIntro } from "@/components/site/launch-intro";
import { MotionProvider } from "@/components/site/motion-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { INTRO_GATE_SCRIPT } from "@/lib/intro";
import { getCurrentUserSafe } from "@/lib/session";

const siteUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// Every page shows who is signed in, so every page renders per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sanchari Chennai — Travel with nature",
    template: "%s | Sanchari Chennai",
  },
  description: "Travel with nature, travel with people—Sanchari Chennai brings together a community that explores beyond the city.",
  openGraph: {
    title: "Sanchari Chennai — Travel with nature",
    description: "Travel with nature, travel with people—Sanchari Chennai brings together a community that explores beyond the city.",
    siteName: "Sanchari Chennai",
    locale: "en_IN",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserSafe();

  return (
    // The intro gate script sets data-intro on <html> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE_SCRIPT }} />
      </head>
      {/* On phones the bottom tabs cover the last 4rem, so the page ends above them. */}
      <body className="flex min-h-dvh flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <LaunchIntro />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <MotionProvider>
          <SiteHeader user={user} />
          <div className="site-page-shell flex-1">{children}</div>
          <SiteFooter />
          <BottomTabs signedIn={Boolean(user)} />
        </MotionProvider>
      </body>
    </html>
  );
}
