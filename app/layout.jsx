import "./globals.css";
import { Sora, Inter } from "next/font/google";

const display = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "Shalom Fish — Fresh from the Sea",
  description:
    "Premium Kerala seafood, delivered in 8 minutes. Fresh daily, never frozen. An immersive 3D shopping experience.",
  openGraph: {
    title: "Shalom Fish — Fresh from the Sea",
    description: "Premium Kerala seafood, delivered in 8 minutes.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#0E4D54", // matches the header so the phone status bar blends in
  width: "device-width",
  initialScale: 1,
  // let the UI extend under notches/rounded corners; pinch-zoom stays enabled
  // (never disable it — screen readers and low-vision users rely on it)
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="noise">{children}</body>
    </html>
  );
}
