import { env } from 'cloudflare:workers';
import { createHash } from 'node:crypto';

export const dynamic = 'force-dynamic';

type NewsArticle = {
  title: string;
  url: string;
  domain: string;
  publishedAt: Date;
  category: string;
  base: number;
};

type LiveEvent = {
  id: string;
  title: string;
  eventDate: string;
  category: string;
  riskLevel: 'watch' | 'high' | 'critical';
  score: number;
  authority: boolean;
  sourceCount: number;
  primaryDomain: string;
  sourceUrls: string[];
  recommendation: string;
  publishedAt: string;
  fetchedAt: string;
};

const queries = [
  { category: '全国哀悼 / 政策', base: 34, query: '("national mourning" OR "public entertainment activities suspended") sourcecountry:china' },
  { category: '灾害事故', base: 25, query: '(earthquake OR flood OR typhoon OR wildfire OR explosion OR crash OR outbreak) sourcecountry:china' },
  { category: '公共安全', base: 18, query: '(casualties OR evacuation OR "state of emergency" OR recall OR scandal) sourcecountry:china' },
  { category: '国际重大事件', base: 12, query: '(war OR ceasefire OR sanctions OR epidemic OR earthquake) tone<-4' },
];

const authorityDomains = ['gov.cn', 'xinhuanet.com', 'people.com.cn', 'cctv.com', 'news.cn', 'mod.gov.cn', 'mem.gov.cn', 'nhc.gov.cn', 'mps.gov.cn'];
const criticalTerms = /(全国性哀悼|停止公共娱乐|重大伤亡|特大|地震|海啸|空难|爆炸|恐怖袭击|疫情|national mourning|public entertainment|mass casualties|earthquake|tsunami|plane crash|terror)/i;
const highTerms = /(洪水|台风|山火|事故|伤亡|召回|公共卫生|制裁|战争|flood|typhoon|wildfire|accident|casualties|recall|outbreak|sanctions|war)/i;

function parseGdeltDate(value: string) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  return match ? new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`) : new Date();
}

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/https?:\/\/\S+/g, '').replace(/[\s\p{P}\p{S}]+/gu, '').slice(0, 120);
}

function shingles(value: string) {
  const text = normalizeTitle(value);
  const size = /[\u3400-\u9fff]/.test(text) ? 2 : 4;
  const set = new Set<string>();
  for (let index = 0; index <= text.length - size; index += 1) set.add(text.slice(index, index + size));
  return set;
}

function similarity(leftTitle: string, rightTitle: string) {
  const left = shingles(leftTitle);
  const right = shingles(rightTitle);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  left.forEach((token) => { if (right.has(token)) overlap += 1; });
  return overlap / (left.size + right.size - overlap);
}

function isAuthority(domain: string) {
  return authorityDomains.some((candidate) => domain === candidate || domain.endsWith(`.${candidate}`));
}

function shanghaiDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function fetchQuery(entry: (typeof queries)[number]): Promise<NewsArticle[]> {
  const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  url.searchParams.set('query', entry.query);
  url.searchParams.set('mode', 'artlist');
  url.searchParams.set('maxrecords', '50');
  url.searchParams.set('timespan', '12h');
  url.searchParams.set('sort', 'datedesc');
  url.searchParams.set('format', 'json');
  const response = await fetch(url, { signal: AbortSignal.timeout(12_000), headers: { 'User-Agent': 'PR-Pulse-Calendar/1.0' } });
  if (!response.ok) throw new Error(`GDELT_${response.status}`);
  const payload = await response.json() as { articles?: Array<{ title?: string; url?: string; domain?: string; seendate?: string }> };
  return (payload.articles || []).flatMap((article) => {
    if (!article.title || !article.url) return [];
    const domain = article.domain || new URL(article.url).hostname.replace(/^www\./, '');
    return [{ title: article.title.trim(), url: article.url, domain, publishedAt: parseGdeltDate(article.seendate || ''), category: entry.category, base: entry.base }];
  });
}

function cluster(articles: NewsArticle[]) {
  const groups: Array<{ title: string; articles: NewsArticle[] }> = [];
  for (const article of articles) {
    const group = groups.find((candidate) => similarity(candidate.title, article.title) >= 0.48);
    if (group) group.articles.push(article);
    else groups.push({ title: article.title, articles: [article] });
  }
  return groups;
}

function toEvent(group: { title: string; articles: NewsArticle[] }): LiveEvent {
  const uniqueByDomain = new Map<string, NewsArticle>();
  group.articles.forEach((article) => { if (!uniqueByDomain.has(article.domain)) uniqueByDomain.set(article.domain, article); });
  const articles = [...uniqueByDomain.values()].sort((left, right) => right.publishedAt.valueOf() - left.publishedAt.valueOf());
  const primary = articles.find((article) => isAuthority(article.domain)) || articles[0];
  const combined = articles.map((article) => article.title).join(' ');
  const critical = criticalTerms.test(combined);
  const high = critical || highTerms.test(combined);
  const authority = articles.some((article) => isAuthority(article.domain));
  const score = Math.min(100, 35 + Math.max(...articles.map((article) => article.base)) + Math.min(articles.length, 5) * 7 + (authority ? 15 : 0) + (critical ? 12 : high ? 6 : 0));
  const recommendation = critical ? '暂停可能冲突的娱乐化内容，核验权威通报、伤亡与影响范围，准备品牌回应口径。' : high ? '提高发布审批等级，持续观察权威通报，避免抢跑表态。' : '持续观察独立来源数量与权威通报，暂不建议主动借势。';
  return {
    id: `issue-${createHash('sha1').update(normalizeTitle(primary.title).slice(0, 80)).digest('hex').slice(0, 24)}`,
    title: primary.title,
    eventDate: shanghaiDate(primary.publishedAt),
    category: primary.category,
    riskLevel: critical ? 'critical' : high ? 'high' : 'watch',
    score,
    authority,
    sourceCount: articles.length,
    primaryDomain: primary.domain,
    sourceUrls: articles.slice(0, 8).map((article) => article.url),
    recommendation,
    publishedAt: primary.publishedAt.toISOString(),
    fetchedAt: new Date().toISOString(),
  };
}

async function ensureSchema(database: D1Database) {
  await database.batch([
    database.prepare('CREATE TABLE IF NOT EXISTS live_events (id TEXT PRIMARY KEY, title TEXT NOT NULL, event_date TEXT NOT NULL, category TEXT NOT NULL, risk_level TEXT NOT NULL, score INTEGER NOT NULL, authority INTEGER NOT NULL DEFAULT 0, source_count INTEGER NOT NULL DEFAULT 1, primary_domain TEXT NOT NULL, source_urls TEXT NOT NULL, recommendation TEXT NOT NULL, published_at INTEGER NOT NULL, fetched_at INTEGER NOT NULL)'),
    database.prepare('CREATE INDEX IF NOT EXISTS idx_live_events_published_at ON live_events(published_at)'),
    database.prepare('CREATE INDEX IF NOT EXISTS idx_live_events_score ON live_events(score)'),
  ]);
}

async function readCache(database: D1Database): Promise<LiveEvent[]> {
  const result = await database.prepare('SELECT * FROM live_events ORDER BY score DESC, published_at DESC LIMIT 50').all<Record<string, unknown>>();
  return result.results.map((row) => ({
    id: String(row.id), title: String(row.title), eventDate: String(row.event_date), category: String(row.category),
    riskLevel: String(row.risk_level) as LiveEvent['riskLevel'], score: Number(row.score), authority: Boolean(row.authority),
    sourceCount: Number(row.source_count), primaryDomain: String(row.primary_domain), sourceUrls: JSON.parse(String(row.source_urls)),
    recommendation: String(row.recommendation), publishedAt: new Date(Number(row.published_at)).toISOString(), fetchedAt: new Date(Number(row.fetched_at)).toISOString(),
  }));
}

async function writeCache(database: D1Database, events: LiveEvent[]) {
  const statements = events.map((event) => database.prepare('INSERT INTO live_events (id, title, event_date, category, risk_level, score, authority, source_count, primary_domain, source_urls, recommendation, published_at, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title=excluded.title, event_date=excluded.event_date, category=excluded.category, risk_level=excluded.risk_level, score=excluded.score, authority=excluded.authority, source_count=excluded.source_count, primary_domain=excluded.primary_domain, source_urls=excluded.source_urls, recommendation=excluded.recommendation, published_at=excluded.published_at, fetched_at=excluded.fetched_at').bind(event.id, event.title, event.eventDate, event.category, event.riskLevel, event.score, event.authority ? 1 : 0, event.sourceCount, event.primaryDomain, JSON.stringify(event.sourceUrls), event.recommendation, new Date(event.publishedAt).valueOf(), Date.now()));
  if (statements.length) await database.batch(statements);
}

export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.get('refresh') === '1';
  const database = env.DB;
  let cached: LiveEvent[] = [];
  if (database) {
    await ensureSchema(database);
    cached = await readCache(database);
    const fresh = cached[0] && Date.now() - new Date(cached[0].fetchedAt).valueOf() < 30 * 60 * 1000;
    if (fresh && !force) return Response.json({ events: cached, cached: true, coverage: 'GDELT 公开新闻索引，非互联网穷尽检索' });
  }
  try {
    const settled = await Promise.allSettled(queries.map(fetchQuery));
    const articles = settled.flatMap((item) => item.status === 'fulfilled' ? item.value : []);
    const events = cluster(articles).map(toEvent).filter((event) => event.score >= 62).sort((left, right) => right.score - left.score).slice(0, 50);
    if (database) await writeCache(database, events);
    return Response.json({ events, cached: false, providerErrors: settled.filter((item) => item.status === 'rejected').length, coverage: 'GDELT 公开新闻索引，非互联网穷尽检索' });
  } catch (error) {
    if (cached.length) return Response.json({ events: cached, cached: true, stale: true, coverage: 'GDELT 公开新闻索引，非互联网穷尽检索' });
    return Response.json({ events: [], error: error instanceof Error ? error.message : 'LIVE_FETCH_FAILED' }, { status: 503 });
  }
}
