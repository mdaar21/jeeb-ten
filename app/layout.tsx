import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "جيب العشرة | تعرف العشرة؟",
  description: "200 كاتاجوري، عشرة مراكز مخفية وخمس غلطات. العب فردي أو فريق ضد فريق على نفس الجهاز، مع شخصيات ومعالم أيقونية من العالم العربي وحول العالم.",
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
