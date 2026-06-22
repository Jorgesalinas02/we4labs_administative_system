import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ConditionalShell } from "@/components/conditional-shell";
import { AccessDeniedScreen } from "@/components/access-denied-screen";
import { RoleProvider } from "@/components/role-provider";
import { resolveTenantId } from "@/lib/tenant";
import { checkEmailAccess, getCurrentUserEmail, resolveUserRole } from "@/lib/access";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "We4Labs — Sistema administrativo",
  description: "Flujo de caja, fiscalidad Colombia, cartera y nómina",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const email = await getCurrentUserEmail();
  const allowed = await checkEmailAccess(email);
  const tenantId = allowed ? await resolveTenantId() : null;
  const role = allowed ? await resolveUserRole() : null;

  return (
    <ClerkProvider>
      <html lang="es">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {!allowed && email ? (
            <AccessDeniedScreen email={email} />
          ) : (
            <RoleProvider role={role}>
              <ConditionalShell tenantId={tenantId}>{children}</ConditionalShell>
            </RoleProvider>
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
