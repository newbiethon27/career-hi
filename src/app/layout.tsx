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
  title: "Career AtoZ — 같은 직무, 같은 연봉이어도 좋은 회사는 사람마다 다릅니다",
  description:
    "커리어 성향을 진단하고 현재 회사와의 적합도를 점수로 확인하세요. 설명 가능한 Career Decision Service.",
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
