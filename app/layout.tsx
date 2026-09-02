import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_ORIGIN || 'http://localhost:3000'),
  title: 'PR Pulse 2026｜中国公关风险日历',
  description: '整合 2026 公关节点、国家纪念日、肃穆提醒与实时重大社会事件的工作日历。',
  openGraph: {
    title: 'PR Pulse 2026｜中国公关风险日历',
    description: '在同一个工作台查看公关节点、肃穆提醒与实时重大社会事件。',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'PR Pulse 2026 中国公关风险日历' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PR Pulse 2026｜中国公关风险日历',
    description: '在同一个工作台查看公关节点、肃穆提醒与实时重大社会事件。',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
