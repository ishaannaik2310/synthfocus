import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SynthFocus — Kill the Slow Focus Group",
  description:
    "Ten simulated buyers, about 70 seconds per run. Real-time stress-testing and objection playbook for your pitch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${oswald.variable} dark h-full antialiased`}
    >
      <head>
        <noscript>
          <style>{`
            [data-motion] {
              opacity: 1 !important;
              transform: none !important;
            }
          `}</style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col bg-[#133ee8] text-white font-sans selection:bg-[#ffe500] selection:text-black">
        {children}
      </body>
    </html>
  );
}
