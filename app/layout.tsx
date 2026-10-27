import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FairShift",
  description: "Every shift gets a receipt.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:m-2 focus:rounded focus:bg-gray-900 focus:p-3 focus:text-white">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
