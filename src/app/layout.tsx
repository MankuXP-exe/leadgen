import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "LeadHunter - AI Lead Generation",
  description: "AI-powered lead generation platform for finding local businesses that need websites",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <ThemeProvider defaultTheme="dark">
          <Sidebar />
          <main className="md:ml-[var(--sidebar-width)] min-h-screen transition-all duration-300">
            <div className="p-4 md:p-6 lg:p-8 pt-16 md:pt-6">
              {children}
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
