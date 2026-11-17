import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "./_components/ThemeProvider";
import { THEME_STORAGE_KEY } from "./_lib/themePreference";

const themeBootstrap = `try { var savedTheme = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}); document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light"; } catch { document.documentElement.dataset.theme = "light"; }`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "YouthBiz | Big ideas start with small change",
  description: "A hands-on entrepreneurship and financial literacy club for young people.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
        <Script id="youthbiz-theme-init" strategy="beforeInteractive">
          {themeBootstrap}
        </Script>
      </body>
    </html>
  );
}
