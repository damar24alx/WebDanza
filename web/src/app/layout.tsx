import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { WebVitalsReporter } from "@/components/observability/WebVitalsReporter";
import "./globals.css";

const heading = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Dance Academy",
  description: "Plataforma educativa de danza: estilos, tecnica, progreso y certificaciones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${heading.variable} ${body.variable} font-body`}>
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  );
}
