import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. IMPORT HAI COMPONENT VỪA TẠO
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SOT VDI Gateways",
  description: "Hệ thống thi thực hành trực tuyến",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-gray-50 text-gray-900 flex flex-col min-h-screen`}>
        {/* 2. ĐẶT NAVBAR Ở ĐẦU */}
        <Navbar />

        {/* Nội dung chính */}
        <main className="flex-grow">
          {children}
        </main>

        {/* 3. ĐẶT FOOTER Ở CUỐI */}
        <Footer />
      </body>
    </html>
  );
}