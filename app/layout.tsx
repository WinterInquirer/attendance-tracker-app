import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "sonner"; // Assuming you have 'sonner' installed for toasts

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Attendance Tracker",
  description: "Track your subject attendance easily.",
};

// **THIS IS THE CHANGED LINE**
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
