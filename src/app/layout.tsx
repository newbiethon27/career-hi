import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { CareerProvider } from "@/store/CareerContext";
import { CompaniesProvider } from "@/store/CompaniesContext";
import { StepHeader } from "@/components/layout/StepHeader";
import { DisclaimerFooter } from "@/components/layout/DisclaimerFooter";
import { loadCompanies } from "@/lib/companies.server";

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
  title: "커리어Hi — 어디에 지원해야 할지 모르겠다면, 기준부터",
  description:
    "커리어 성향을 진단하고, 그 기준으로 나에게 맞는 회사를 이유와 함께 추천받으세요. 설명 가능한 Career Decision Service.",
};

// 회사 지표는 Supabase 에서 읽는다. 대시보드에서 값을 고치면 배포 없이 60초 안에 반영된다.
export const revalidate = 60;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const companies = await loadCompanies();

  return (
    <html lang="ko" className={`${notoSansKr.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <CompaniesProvider value={companies}>
          <CareerProvider>
            <StepHeader />
            <main className="flex flex-1 flex-col">{children}</main>
            <DisclaimerFooter />
          </CareerProvider>
        </CompaniesProvider>
      </body>
    </html>
  );
}
