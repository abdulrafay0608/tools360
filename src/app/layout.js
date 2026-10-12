import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { SITE_URL, SITE_NAME } from "@/config/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Free PDF, Image & Calculator Tools`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Free and private browser-based utilities for PDF documents, image editing and conversion, and everyday calculators. All processing runs locally in your browser.",
  openGraph: {
    title: `${SITE_NAME} | Free PDF, Image & Calculator Tools`,
    description:
      "Free and private browser-based utilities for PDF documents, image editing and conversion, and everyday calculators. All processing runs locally in your browser.",
    siteName: SITE_NAME,
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
