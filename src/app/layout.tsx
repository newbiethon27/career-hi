import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { CareerProvider } from "@/store/CareerContext";
import { StepHeader } from "@/components/layout/StepHeader";
import { DisclaimerFooter } from "@/components/layout/DisclaimerFooter";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "커리어Hi — 나에게 맞는 회사, 연봉만으로 정해지지 않으니까",
  description:
    "10개 질문으로 내가 회사를 고를 때 무엇을 중요하게 보는지 알아보고, 지금 회사와 얼마나 맞는지 점수와 이유로 확인하세요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${geistMono.variable} h-full antialiased`}>
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
