import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";
import { MotionProvider } from "@/components/site/motion-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
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
  description:
    "Sanchari Chennai is a travel group that heads out of the city for treks, forests and coastlines. See upcoming trips and register.",
  openGraph: {
    title: "Sanchari Chennai — Travel with nature",
    description: "Upcoming trips, trip galleries and registrations for the Sanchari Chennai travel group.",
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
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <MotionProvider>
          <SiteHeader user={user} />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
