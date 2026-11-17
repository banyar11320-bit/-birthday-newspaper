export const LIMITS = { name: 50, birthday: 10, headline: 60, story: 700, memories: 500, wishes: 400, closing: 200 } as const;
export type Content = { -readonly [K in keyof typeof LIMITS]: string } & { portrait: string };
export const SAMPLE: Content = {
  name: 'May Mon', birthday: '1995-11-17', headline: 'Another year of making life a little brighter',
  story: 'Today, we celebrate May: the keeper of our family stories, the first to lend a hand, and the person who turns an ordinary afternoon into a memory. From shared meals to long conversations, her warmth has made our family feel like home. This special edition is a small thank-you for all the joy she brings into our lives. Here’s to a new chapter filled with good health, wonderful surprises, and time with the people she loves.',
  memories: 'The kitchen filled with laughter. The road trip with no particular destination. The birthday cake we made together, a little uneven and completely perfect. It is the everyday moments with you that become the stories we tell again and again.',
  wishes: 'May your days be gentle, your dreams be bold, and your year be full of reasons to smile. We hope the love you give so freely finds its way back to you, today and every day.',
  closing: 'With all our love, from the Mon family. Happy birthday, May. There is so much more to celebrate.', portrait: '',
};
export const EMPTY: Content = { name: '', birthday: '', headline: '', story: '', memories: '', wishes: '', closing: '', portrait: '' };
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
  if (typeof obj.portrait !== 'string') throw new Error('Invalid portrait.');
  result.portrait = obj.portrait;
  if (result.portrait) {
    if (result.portrait.length > 1_400_000) throw new Error('Portrait must be smaller than 1 MB after resizing.');
    const match = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(result.portrait);
    if (!match || match[2].length % 4 !== 0) throw new Error('Use a JPEG or PNG portrait.');
    const prefix = match[2].slice(0,24);
    const bytes = Uint8Array.from(atob(prefix), c => c.charCodeAt(0));
    const valid = match[1] === 'jpeg' ? bytes[0]===255 && bytes[1]===216 && bytes[2]===255 : [137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n);
    if (!valid) throw new Error('Portrait contents do not match its file type.');
  }
  return result;
}
export function birthdayLabel(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Your special day';
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en', {month:'long',day:'numeric',timeZone:'UTC'}).format(date) : 'Your special day';
}
