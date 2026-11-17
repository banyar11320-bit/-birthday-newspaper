export const LIMITS = { name: 50, birthday: 10, headline: 60, story: 700, memories: 500, wishes: 400, closing: 200 } as const;
export const PHOTO_FIELDS = [{key:'portrait',label:'Member portrait'},{key:'groupPhoto',label:'Group photo'},{key:'memoryPhoto',label:'Memory photo'}] as const;
export type PhotoKey = typeof PHOTO_FIELDS[number]['key'];
export const MAX_PHOTO_LENGTH = 1_400_000;
export const MAX_TOTAL_PHOTO_LENGTH = 1_400_000;
export const UPLOAD_PHOTO_LENGTH = 400_000;
export type Content = { -readonly [K in keyof typeof LIMITS]: string } & Record<PhotoKey, string>;
export const SAMPLE: Content = {
  name: 'May Mon', birthday: '1995-11-17', headline: 'Another year of making life a little brighter',
  story: 'Today, we celebrate May: the keeper of our family stories, the first to lend a hand, and the person who turns an ordinary afternoon into a memory. From shared meals to long conversations, her warmth has made our family feel like home. This special edition is a small thank-you for all the joy she brings into our lives. Here’s to a new chapter filled with good health, wonderful surprises, and time with the people she loves.',
  memories: 'The kitchen filled with laughter. The road trip with no particular destination. The birthday cake we made together, a little uneven and completely perfect. It is the everyday moments with you that become the stories we tell again and again.',
  wishes: 'May your days be gentle, your dreams be bold, and your year be full of reasons to smile. We hope the love you give so freely finds its way back to you, today and every day.',
  closing: 'With all our love, from the Mon family. Happy birthday, May. There is so much more to celebrate.', portrait: '', groupPhoto: '', memoryPhoto: '',
};
export const EMPTY: Content = { name: '', birthday: '', headline: '', story: '', memories: '', wishes: '', closing: '', portrait: '', groupPhoto: '', memoryPhoto: '' };
export function validateContent(input: unknown): Content {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Enter valid newspaper content.');
  const obj = input as Record<string, unknown>;
  const result = {} as Content;
  for (const [key, limit] of Object.entries(LIMITS)) {
    if (typeof obj[key] !== 'string') throw new Error(`Enter ${key}.`);
    const value = (obj[key] as string).replace(/\s+/gu, ' ').trim();
    if (value.length > limit) throw new Error(`${key} must be ${limit} characters or fewer.`);
    result[key as keyof typeof LIMITS] = value;
  }
  if (!result.name || !result.headline) throw new Error('Member name and headline are required.');
  const date = new Date(`${result.birthday}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result.birthday) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== result.birthday || result.birthday < '1900-01-01' || result.birthday > new Date().toISOString().slice(0,10)) throw new Error('Enter a valid birthday between 1900 and today.');
  let total=0;
  for(const {key,label} of PHOTO_FIELDS){
    const value=obj[key]===undefined && key!=='portrait' ? '' : obj[key];
    if(typeof value!=='string')throw new Error(`Invalid ${label.toLowerCase()}.`);
    result[key]=value;total+=value.length;
    if(!value)continue;
    if(value.length>MAX_PHOTO_LENGTH)throw new Error(`${label} is too large. Choose a smaller image.`);
    const match=/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if(!match || match[2].length%4!==0)throw new Error(`Use a JPEG or PNG for ${label.toLowerCase()}.`);
    const bytes=Uint8Array.from(atob(match[2].slice(0,24)),c=>c.charCodeAt(0));
    const valid=match[1]==='jpeg' ? bytes[0]===255 && bytes[1]===216 && bytes[2]===255 : [137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n);
    if(!valid)throw new Error(`${label} contents do not match its file type.`);
  }
  // Includes legacy portraits; draft + published snapshots must fit serverless response limits.
  if(total>MAX_TOTAL_PHOTO_LENGTH)throw new Error('The combined photos are too large. Replace a larger photo with a smaller image.');
  return result;
}
export function birthdayLabel(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Your special day';
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en', {month:'long',day:'numeric',timeZone:'UTC'}).format(date) : 'Your special day';
}
