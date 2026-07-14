import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ween — Small acts, real impact",
  description: "Find meaningful volunteer work and see the difference you make.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const themeScript = `
    (() => {
      try {
        document.documentElement.classList.remove("dark");
        document.documentElement.dataset.theme = "light";
        document.documentElement.style.colorScheme = "light";
      } catch {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
