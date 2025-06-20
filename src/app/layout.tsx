import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Layout from "@/component/layout";
import { ProviderContext } from "@/state/provider";
import { createTheme, ThemeProvider } from "@mui/material";
import ThemeWrapper from "@/component/theme wrapper";
import { ReactNode } from "react";
import { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

const theme = createTheme();

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ProviderContext>
          <ThemeWrapper>
            <Layout>{children}</Layout>
          </ThemeWrapper>
        </ProviderContext>
      </body>
    </html>
  );
}
