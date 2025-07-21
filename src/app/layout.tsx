"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Layout from "@/component/layout";
import { ProviderContext, UseContext } from "@/state/provider";
import ThemeWrapper from "@/component/theme wrapper";
import { ReactNode } from "react";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { safeLocalStorage } from "./utils/storage";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface RootLayoutProps {
  children: ReactNode;
}

function AuthWrapper({ children }: { children: ReactNode }) {
  const {
    state: { token },
  } = UseContext();

  const TOKEN = safeLocalStorage.getItem("token");

  const pathname = usePathname();
  const router = useRouter();
  const authPages = ["/login", "/signup"];
  useEffect(() => {

    if (!TOKEN && !authPages.includes(pathname)) {
      router.replace("/login");
    } else if (TOKEN && authPages.includes(pathname)) {
      router.replace("/");
    }
  }, [TOKEN, pathname, router]);

  if (authPages.includes(pathname)) {
    return <>{children}</>;
  }
  return <Layout>{children}</Layout>;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ProviderContext>
          <ThemeWrapper>
            <AuthWrapper>{children}</AuthWrapper>
          </ThemeWrapper>
        </ProviderContext>
      </body>
    </html>
  );
}
