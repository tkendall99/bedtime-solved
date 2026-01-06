import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bedtime. Solved. | Personalized Storybooks for Your Child",
  description:
    "Create magical, personalized storybooks starring your child. Upload their photo and we'll generate a beautiful illustrated story in minutes.",
  keywords: [
    "personalized storybook",
    "children's book",
    "custom story",
    "bedtime story",
    "photo book",
    "gift for kids",
  ],
  openGraph: {
    title: "Bedtime. Solved.",
    description:
      "Personalized storybooks starring your child — made from their photo in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
