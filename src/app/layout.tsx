import "./globals.css";
import { MotionConfig } from "framer-motion";
import RefreshRedirect from '@/components/RefreshRedirect';

export const metadata = {
  title: "Jhner.dev",
  description: "Agustin Jhoner's personal portfolio, focused on web development and modern UI.",
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
