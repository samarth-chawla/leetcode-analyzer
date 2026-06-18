import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Logo } from "@/components/logo";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSA Intelligence Platform",
  description: "Personalized LeetCode analytics and daily DSA practice plans.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          {/* <header className="flex h-16 items-center justify-end gap-2 border-b border-border px-4 md:px-8">
            
            <div className="flex items-center gap-2">
              <SignedOut>
                <SignInButton />
                <SignUpButton />
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </header> */}
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
