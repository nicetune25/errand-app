import "./globals.css";

export const metadata = {
  title: "Errand — Your personal market, delivered",
  description: "Shop from local stores in Lagos with real personal shoppers.",
  manifest: "/manifest.json",
  themeColor: "#FF5720",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  openGraph: {
    title: "Errand",
    description: "Your personal market, delivered.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
