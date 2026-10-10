import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobSmith — Support AI pilot",
  description: "Prove an AI support workflow follows policy and handles sensitive requests safely before launch.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
