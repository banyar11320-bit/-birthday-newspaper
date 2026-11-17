'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="not-found"><h1>We couldn’t open this edition.</h1><p>Please try again. If the problem continues, contact the family administrator.</p><button className="button" onClick={reset}>Try again</button></main>;}
