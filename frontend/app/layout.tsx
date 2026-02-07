import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConsuMaarg - After-Sales Intelligence",
  description: "Get expert guidance on consumer protection issues in India. AI-powered support for warranty disputes, service claims, and consumer rights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
