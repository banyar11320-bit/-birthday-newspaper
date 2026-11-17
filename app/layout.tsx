/* Full document navigation preserves the editor’s native unsaved-change guard. */
/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:{default:'Mon Family Birthday Studio',template:'%s | Mon Family'},description:'Turn a birthday into a family keepsake. Create a personal two-page newspaper.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body><header className="site-header no-print"><a className="brand" href="/">Mon Family <span>/ Birthday Studio</span></a><a href="/admin" className="header-link">Admin studio</a></header>{children}</body></html>;}
