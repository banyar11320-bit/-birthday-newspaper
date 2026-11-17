/* Native img preserves the same raster in preview and browser print. */
/* eslint-disable @next/next/no-img-element */
import { birthdayLabel, type Content, type PhotoKey } from '@/lib/content';
function Footer({page}:{page:number}) {return <footer className="paper-footer"><span>Mon Family · A keepsake edition</span><span>{page} / 2</span></footer>;}
export function Newspaper({content, portraitSrc, photoSources}:{content:Content;portraitSrc?:string;photoSources?:Partial<Record<PhotoKey,string>>}) {
 const name=content.name || 'Someone wonderful';
 const photo=photoSources?.portrait ?? portraitSrc ?? content.portrait;
 return <div className="newspaper" aria-label="Two-page birthday newspaper">
  <article className="paper front-page" aria-label="Page 1: Front page">
   <div className="edition"><span>Birthday Special Edition</span><span>{birthdayLabel(content.birthday)}</span></div>
   <header className="masthead"><span className="masthead-the">THE</span><h2>MON FAMILY TIMES</h2><p>Good stories. Great people. One family.</p></header>
   <div className="paper-kicker">Celebrating {name}</div>
   <h1 className="birthday-headline">{content.headline || 'A life worth celebrating'}</h1>
   <figure className="portrait">{photo ? <img src={photo} alt={`Birthday portrait of ${name}`} /> : <div className="portrait-placeholder"><span aria-hidden="true">✳</span><p>A place for your favorite portrait</p></div>}<figcaption>{name} · Loved beyond words</figcaption></figure>
   <section className="story-section"><h3>A new chapter, a beautiful story</h3><p>{content.story.replace(/\s+/gu,' ').trim() || 'Every birthday holds a story. Write yours in the editor.'}</p></section>
   <Footer page={1}/>
  </article>
  <article className="paper stories-page" aria-label="Page 2: Birthday stories">
   <div className="edition"><span>The Mon Family Times</span><span>Birthday stories</span></div>
   <header className="stories-heading"><span aria-hidden="true">✳</span><h2>The moments<br/>we keep.</h2><p>For {name}, with love from all of us.</p></header>
   <div className="memory-photos">{(['groupPhoto','memoryPhoto'] as const).map(key=>{
    const src=photoSources?.[key] ?? content[key];const label=key==='groupPhoto'?'Group photo':'Memory photo';
    return <figure className={`memory-photo ${key}`} key={key}>{src?<img src={src} alt={`${label} for ${name}`}/>:<div className="memory-photo-placeholder">{label}</div>}<figcaption>{label}</figcaption></figure>;
   })}</div>
   <section className="memory-section"><h3>Favorite memories</h3><p>{content.memories.replace(/\s+/gu,' ').trim() || 'The little moments that mean everything.'}</p></section>
   <section className="wishes-section"><span className="quote-mark" aria-hidden="true">“</span><h3>A birthday wish for you</h3><p>{content.wishes.replace(/\s+/gu,' ').trim() || 'A few heartfelt words for the year ahead.'}</p></section>
   <section className="closing-section"><h3>Always, your family.</h3><p>{content.closing.replace(/\s+/gu,' ').trim() || 'Finish with a message from the heart.'}</p></section>
   <Footer page={2}/>
  </article>
 </div>;
}
