import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import Sidebar from '@/components/Sidebar/sidebar-menu';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex">
            <div className="flex h-screen">
              <Sidebar />
            </div>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
