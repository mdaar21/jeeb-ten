import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "جيب العشرة | تعرف العشرة؟",
  description: "مئة كاتاجوري، عشرة مراكز مخفية، وخمس غلطات. العب فردي أو تحدّى صاحبك في جيب العشرة.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
