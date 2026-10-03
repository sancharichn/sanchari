import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";

const siteUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

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

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
