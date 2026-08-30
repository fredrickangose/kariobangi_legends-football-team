import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kariobangi Legends FC | Official Club Website",
  description: "Official website of Kariobangi Legends Football Club (KLFC), playing in FKF Division One, Nairobi Kenya. Founded by Mr. Erick Otieno Atanga to empower slum youths through football and community leadership.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}

