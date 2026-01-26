import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Football Team App",
  description: "Football team management and stats tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
