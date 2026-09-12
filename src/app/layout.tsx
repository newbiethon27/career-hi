import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CareerProvider } from "@/store/CareerContext";
import { StepHeader } from "@/components/layout/StepHeader";
import { DisclaimerFooter } from "@/components/layout/DisclaimerFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "커리어Hi — 어디에 지원해야 할지 모르겠다면, 기준부터",
  description:
    "커리어 성향을 진단하고, 그 기준으로 나에게 맞는 회사를 이유와 함께 추천받으세요. 설명 가능한 Career Decision Service.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <CareerProvider>
          <StepHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <DisclaimerFooter />
        </CareerProvider>
      </body>
    </html>
  );
}
