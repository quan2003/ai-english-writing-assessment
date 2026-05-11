import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Writing Assessment",
  description: "University writing assessment assistant for lecturers"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
