import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const SITE_URL = "https://kariobangi-legends-football-team.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Kariobangi Legends FC | Official Club Website",
  description:
    "Official website of Kariobangi Legends Football Club (KLFC), playing in FKF Division One, Nairobi Kenya. Founded by Mr. Erick Otieno Atanga to empower slum youths through football and community leadership.",
  openGraph: {
    title: "Kariobangi Legends FC | Official Club Website",
    description:
      "Official website of Kariobangi Legends Football Club (KLFC), playing in FKF Division One, Nairobi Kenya.",
    type: "website",
    siteName: "Kariobangi Legends FC",
    url: SITE_URL,
    locale: "en_KE",
    images: [
      {
        url: "/assets/hero-team.jpg",
        width: 1024,
        height: 682,
        alt: "Kariobangi Legends FC team photo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kariobangi Legends FC | Official Club Website",
    description:
      "Official website of Kariobangi Legends Football Club (KLFC), playing in FKF Division One, Nairobi Kenya.",
    images: ["/assets/hero-team.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="bg-slate-50 text-slate-900 antialiased overflow-x-hidden"
      >
        {children}
      </body>
    </html>
  );
}

