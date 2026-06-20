import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MONarchy",
  description: "The first AI tool where being wrong has a cost.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
