import "./globals.css";
import { MotionConfig } from "framer-motion";
import RefreshRedirect from '@/components/RefreshRedirect';

export const metadata = {
  title: "jhner.dev",
  description: "Jhner Torres personal portfolio — senior high school student and junior developer building modern web experiences.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MotionConfig reducedMotion="user">
          <RefreshRedirect />
          {children}
        </MotionConfig>
      </body>
    </html>
  );
}
