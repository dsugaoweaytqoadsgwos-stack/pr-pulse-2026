'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  FileCheck2,
  Globe2,
  LoaderCircle,
  Radio,
  RefreshCw,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calendarEvents, solemnDays, type CalendarEvent } from '@/lib/calendar-data';

type LiveEvent = CalendarEvent & {
  eventDate: string;
  score: number;
  authority: boolean;
  sourceCount: number;
  primaryDomain: string;
  sourceUrls: string[];
  publishedAt: string;
  fetchedAt: string;
};

const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];

function isoDate(month: number, day: number) {
  return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildCells(month: number) {
  const firstDay = new Date(2026, month - 1, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const currentDays = new Date(2026, month, 0).getDate();
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? 2025 : 2026;
  const previousDays = new Date(previousYear, previousMonth, 0).getDate();
  return Array.from({ length: 42 }, (_, index) => {
    let day = index - offset + 1;
    let cellMonth = month;
    let cellYear = 2026;
    let inMonth = true;
    if (day < 1) {
      day = previousDays + day;
      cellMonth = previousMonth;
      cellYear = previousYear;
      inMonth = false;
    } else if (day > currentDays) {
      day -= currentDays;
      cellMonth = month === 12 ? 1 : month + 1;
      cellYear = month === 12 ? 2027 : 2026;
      inMonth = false;
    }
    const date = `${cellYear}-${String(cellMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { day, date, inMonth };
  });
}

function riskRank(events: CalendarEvent[]) {
  const ranks = { normal: 0, watch: 1, high: 2, critical: 3 };
  return events.reduce<CalendarEvent['riskLevel']>((current, event) => ranks[event.riskLevel] > ranks[current] ? event.riskLevel : current, 'normal');
}

function riskLabel(level: CalendarEvent['riskLevel']) {
  return { normal: '常规', watch: '持续观察', high: '高敏事件', critical: '重大风险' }[level];
}

export function CalendarDashboard() {
  const [tab, setTab] = useState('calendar');
  const [month, setMonth] = useState(9);
  const [selectedDate, setSelectedDate] = useState('2026-09-18');
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [liveState, setLiveState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [lastUpdated, setLastUpdated] = useState('');
  const [coverage, setCoverage] = useState('GDELT 公开新闻索引');

  async function loadLive(force = false) {
    setLiveState('loading');
    try {
      const response = await fetch(`/api/events${force ? '?refresh=1' : ''}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('LIVE_FETCH_FAILED');
      const result = await response.json() as { events: LiveEvent[]; coverage?: string };
      const normalized = (result.events || []).map((event) => ({ ...event, sourceType: 'live' as const, date: event.eventDate }));
      setLiveEvents(normalized);
      setCoverage(result.coverage || 'GDELT 公开新闻索引');
      setLastUpdated(normalized[0]?.fetchedAt || new Date().toISOString());
      setLiveState('ready');
    } catch {
      setLiveState('error');
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadLive(false); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const calendarLiveEvents = useMemo(() => liveEvents.filter((event) => event.score >= 82), [liveEvents]);
  const allEvents = useMemo(() => [...calendarEvents, ...solemnDays, ...calendarLiveEvents], [calendarLiveEvents]);
  const eventsByDate = useMemo(() => allEvents.reduce<Record<string, CalendarEvent[]>>((grouped, event) => {
    (grouped[event.date] ||= []).push(event);
    return grouped;
  }, {}), [allEvents]);
  const cells = useMemo(() => buildCells(month), [month]);
  const selectedEvents = eventsByDate[selectedDate] || [];

  const changeMonth = (direction: -1 | 1) => {
    const next = month + direction < 1 ? 12 : month + direction > 12 ? 1 : month + direction;
    setMonth(next);
    setSelectedDate(isoDate(next, 1));
  };

  const openInCalendar = (event: LiveEvent) => {
    const eventMonth = Number(event.date.slice(5, 7));
    if (Number.isInteger(eventMonth) && eventMonth >= 1 && eventMonth <= 12) setMonth(eventMonth);
    setSelectedDate(event.date);
    setTab('calendar');
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-[#071f46] text-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-4">
            <div className="grid size-11 place-items-center rounded-xl border border-white/15 bg-white/8"><CalendarDays className="size-5 text-[#f3bdca]" /></div>
            <div><p className="text-[11px] font-semibold tracking-[0.26em] text-[#9eb8d8]">PR PULSE · 2026</p><h1 className="mt-1 text-xl font-semibold tracking-tight">中国公关风险日历</h1></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#c9d7e8]">
            <span className="flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-2">
              {liveState === 'loading' ? <LoaderCircle className="size-3.5 animate-spin" /> : <Radio className={`size-3.5 ${liveState === 'ready' ? 'text-emerald-300' : 'text-amber-300'}`} />}
              {liveState === 'loading' ? '正在同步全网信号' : liveState === 'ready' ? '实时监测已连接' : '实时源暂不可用'}
            </span>
            <span className="rounded-full border border-white/12 px-3 py-2">基础数据：2026年日历.xlsx</span>
          </div>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="mx-auto max-w-[1500px] px-4 pt-4 lg:px-8">
        <TabsList className="h-10 w-full justify-start overflow-x-auto rounded-xl border bg-white p-1 md:w-fit">
          <TabsTrigger value="calendar" className="min-w-28 px-4">日历工作台</TabsTrigger>
          <TabsTrigger value="live" className="min-w-28 px-4">实时重大事件 <span className="ml-1 rounded-full bg-[#ede9fe] px-1.5 text-[10px] text-[#6d28d9]">{liveEvents.length}</span></TabsTrigger>
          <TabsTrigger value="rules" className="min-w-28 px-4">禁娱与肃穆规则</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <div className="grid gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-7">
            <section className="min-w-0 space-y-4">
              <Card className="border-0 bg-[#0b2a5b] text-white shadow-[0_20px_60px_rgba(7,31,70,.16)] ring-0">
                <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-6">
                  <div><p className="text-xs font-semibold tracking-[0.2em] text-[#a9c2df]">WORKING CALENDAR</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">2026 年 {month} 月</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#cbd9e9]">固定传播节点、国家纪念日、肃穆提醒和高置信实时事件在同一视图中排期。</p></div>
                  <div className="flex items-center gap-2">
                    <Button aria-label="上一个月" onClick={() => changeMonth(-1)} variant="outline" size="icon-lg" className="border-white/20 bg-white/8 text-white hover:bg-white/15 hover:text-white"><ArrowLeft /></Button>
                    <Button onClick={() => { setMonth(9); setSelectedDate('2026-09-01'); }} variant="outline" className="h-9 border-white/20 bg-white/8 px-4 text-white hover:bg-white/15 hover:text-white">回到本月</Button>
                    <Button aria-label="下一个月" onClick={() => changeMonth(1)} variant="outline" size="icon-lg" className="border-white/20 bg-white/8 text-white hover:bg-white/15 hover:text-white"><ArrowRight /></Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-0 py-0 shadow-[0_18px_45px_rgba(7,31,70,.08)]">
                <div className="grid grid-cols-7 border-b bg-[#fff1f4] text-center text-[10px] font-semibold text-[#7f4050] md:text-xs">{weekLabels.map((label) => <div className="py-3" key={label}>星期{label}</div>)}</div>
                <div className="grid grid-cols-7">
                  {cells.map((cell) => {
                    const events = eventsByDate[cell.date] || [];
                    const risk = riskRank(events);
                    const selected = cell.date === selectedDate;
                    const hasLive = events.some((event) => event.sourceType === 'live');
                    return (
                      <button className={`calendar-cell group relative min-h-24 border-b border-r p-2 text-left transition-colors md:min-h-28 md:p-3 ${!cell.inMonth ? 'bg-[#fafbfc] text-slate-300' : 'bg-white hover:bg-[#f3f7fc]'} ${selected ? 'z-10 ring-2 ring-inset ring-[#0b5cab]' : ''} ${risk === 'critical' ? 'bg-[#fff2f2]' : risk === 'high' ? 'bg-[#fff9f2]' : ''}`} disabled={!cell.inMonth} key={cell.date} onClick={() => setSelectedDate(cell.date)} type="button">
                        <span className="text-sm font-semibold">{cell.day}</span>
                        {events[0] && <span className="mt-2 line-clamp-2 block text-[9px] leading-4 text-slate-600 md:text-xs">{events[0].title}</span>}
                        <span className="absolute bottom-2 left-2 flex gap-1 md:left-3">
                          {events.length > 0 && <i className="size-1.5 rounded-full bg-[#0b5cab]" />}
                          {hasLive && <i className="size-1.5 rounded-full bg-[#7c3aed]" />}
                          {(risk === 'high' || risk === 'critical') && <i className="size-1.5 rounded-full bg-[#d92d20]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
              <div className="flex flex-wrap items-center gap-5 px-1 text-xs text-muted-foreground"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#0b5cab]" />固定节点</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#d92d20]" />高敏 / 肃穆</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#7c3aed]" />高置信实时事件</span></div>
            </section>

            <aside className="space-y-4">
              <Card className="border-0 bg-white shadow-[0_18px_45px_rgba(7,31,70,.08)] ring-1 ring-[#dfe6ef]">
                <CardHeader className="border-b border-[#e6ebf1] pb-4"><CardDescription className="font-mono text-xs tracking-wider">{selectedDate.replaceAll('-', '.')}</CardDescription><CardTitle className="text-xl text-[#0b2a5b]">当日沟通建议</CardTitle></CardHeader>
                <CardContent className="space-y-4 pt-1">
                  {selectedEvents.length ? selectedEvents.map((event) => (
                    <article className="rounded-xl border border-[#e3e9f1] p-4" key={event.id}>
                      <div className="flex items-start justify-between gap-3"><h3 className="font-semibold leading-6 text-[#162a48]">{event.title}</h3><Badge variant={event.riskLevel === 'critical' ? 'destructive' : event.sourceType === 'live' ? 'default' : 'secondary'}>{event.sourceType === 'live' ? '实时' : event.category}</Badge></div>
                      {event.recommendation && <div className="mt-3 flex gap-2 rounded-lg bg-[#fff5f3] p-3 text-xs leading-5 text-[#6f302a]"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#c43225]" /><p>{event.recommendation}</p></div>}
                    </article>
                  )) : <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">当天暂无特殊节点，可以正常排期。</div>}
                </CardContent>
              </Card>
              <Card size="sm" className="bg-[#eef5fb] ring-[#d7e5f2]"><CardContent className="space-y-3 text-xs leading-5 text-[#405876]"><div className="flex items-center gap-2 font-semibold text-[#0b2a5b]"><ShieldCheck className="size-4" />禁娱口径</div><p>固定全国禁娱日不存在统一法定清单。国家发布全国性哀悼等正式公告时，以公告为准；其余红色日期为公关风险建议。</p></CardContent></Card>
              <div className="grid grid-cols-3 gap-2">{[['363', '基础节点'], ['11', '肃穆提醒'], [String(calendarLiveEvents.length), '实时入历']].map(([value, label]) => <div className="rounded-xl border bg-white px-3 py-4 text-center" key={label}><div className="font-mono text-lg font-semibold text-[#0b2a5b]">{value}</div><div className="mt-1 text-[10px] text-muted-foreground">{label}</div></div>)}</div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="live">
          <div className="py-5 lg:py-7">
            <Card className="border-0 bg-[#0b2a5b] text-white ring-0">
              <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between">
                <div><p className="text-xs font-semibold tracking-[0.2em] text-[#a9c2df]">LIVE ISSUES MONITOR</p><h2 className="mt-2 text-3xl font-semibold">重大社会事件信号</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#cbd9e9]">聚合近 12 小时公开新闻信号，按权威来源、独立来源数量和风险关键词去重评分。评分 82 以上的事件自动进入日历。</p></div>
                <Button onClick={() => void loadLive(true)} disabled={liveState === 'loading'} className="h-10 bg-white px-4 text-[#0b5cab] hover:bg-[#eef5fb]"><RefreshCw className={liveState === 'loading' ? 'animate-spin' : ''} />刷新全网信号</Button>
              </CardContent>
            </Card>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="space-y-4">
                {liveState === 'loading' && !liveEvents.length && <Card><CardContent className="flex items-center justify-center gap-3 py-20 text-muted-foreground"><LoaderCircle className="size-5 animate-spin" />正在检索公开新闻索引…</CardContent></Card>}
                {liveState === 'error' && !liveEvents.length && <Card><CardContent className="py-16 text-center"><ShieldAlert className="mx-auto size-8 text-amber-600" /><p className="mt-4 font-medium">实时源暂时不可用</p><p className="mt-2 text-sm text-muted-foreground">基础日历和肃穆提醒仍可正常使用，稍后可再次刷新。</p></CardContent></Card>}
                {liveState === 'ready' && !liveEvents.length && <Card><CardContent className="py-16 text-center text-muted-foreground">当前没有达到展示阈值的重大事件信号。</CardContent></Card>}
                {liveEvents.map((event) => (
                  <Card key={event.id} className="bg-white shadow-[0_12px_32px_rgba(7,31,70,.06)]">
                    <CardHeader className="border-b pb-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2"><Badge variant={event.riskLevel === 'critical' ? 'destructive' : event.riskLevel === 'high' ? 'secondary' : 'outline'}>{riskLabel(event.riskLevel)}</Badge>{event.authority && <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle2 />含权威来源</Badge>}</div>
                        <span className="font-mono text-xs text-muted-foreground">{event.eventDate}</span>
                      </div>
                      <CardTitle className="mt-3 text-xl leading-8 text-[#102a4d]">{event.title}</CardTitle>
                      <CardDescription>{event.category} · {event.sourceCount} 个独立来源 · 置信评分 {event.score}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-xl bg-[#fff5f3] p-4 text-sm leading-6 text-[#6f302a]"><span className="font-semibold text-[#b42318]">公关动作：</span>{event.recommendation}</div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>首要来源：{event.primaryDomain}</span>{event.sourceUrls.slice(0, 2).map((url, index) => <a className="inline-flex items-center gap-1 text-[#0b5cab] hover:underline" href={url} key={url} rel="noreferrer" target="_blank">来源 {index + 1}<ExternalLink className="size-3" /></a>)}</div>
                        <Button variant="outline" onClick={() => openInCalendar(event)}>在日历中查看</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>

              <aside className="space-y-4">
                <Card size="sm"><CardHeader><CardTitle className="flex items-center gap-2"><Globe2 className="size-4 text-[#0b5cab]" />覆盖说明</CardTitle></CardHeader><CardContent className="space-y-3 text-xs leading-5 text-muted-foreground"><p>{coverage}</p><p>“全网”表示公开新闻索引的广泛覆盖，不保证穷尽互联网，也不能替代权威公告与人工核验。</p></CardContent></Card>
                <Card size="sm"><CardHeader><CardTitle className="flex items-center gap-2"><SearchCheck className="size-4 text-[#7c3aed]" />判定流程</CardTitle></CardHeader><CardContent className="space-y-3 text-xs leading-5 text-muted-foreground"><p>1. 近 12 小时新闻聚合</p><p>2. 标题相似度聚类与域名去重</p><p>3. 权威来源、严重度、来源数评分</p><p>4. 高置信事件自动进入日历</p></CardContent></Card>
                {lastUpdated && <p className="px-2 text-[11px] text-muted-foreground">最近同步：{new Date(lastUpdated).toLocaleString('zh-CN', { hour12: false })}</p>}
              </aside>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <div className="py-5 lg:py-7">
            <Card className="border-0 bg-[#0b2a5b] text-white ring-0"><CardContent className="p-6"><p className="text-xs font-semibold tracking-[0.2em] text-[#a9c2df]">GOVERNANCE NOTES</p><h2 className="mt-2 text-3xl font-semibold">禁娱与肃穆传播规则</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#cbd9e9]">把法律要求、国家纪念语境和品牌风控建议分开，避免将行业惯例误写成法定义务。</p></CardContent></Card>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {[
                { icon: ShieldAlert, tone: 'red', title: '一级：官方临时禁娱 / 哀悼公告', copy: '国务院或其他有权机关针对重大事件发布正式公告时，严格按公告停止公共娱乐活动，并立即调整传播排期。', action: '动作：立即停发、核对原文、启动危机审批。' },
                { icon: FileCheck2, tone: 'amber', title: '二级：国家纪念日 / 国家公祭日', copy: '如 9 月 3 日、9 月 30 日、12 月 13 日，属于国家纪念或公祭语境，但不自动等同于全国停止公共娱乐活动。', action: '动作：减少娱乐化表达，历史内容使用权威资料。' },
                { icon: ShieldCheck, tone: 'blue', title: '三级：公关肃穆建议日', copy: '如清明节、5 月 12 日、7 月 7 日、9 月 18 日等，作为品牌传播的高敏与肃穆提醒。', action: '动作：避免欢庆式营销、玩梗和不当借势。' },
              ].map((item) => <Card key={item.title} className="bg-white"><CardHeader><div className={`mb-3 grid size-10 place-items-center rounded-xl ${item.tone === 'red' ? 'bg-red-50 text-red-700' : item.tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}><item.icon className="size-5" /></div><CardTitle>{item.title}</CardTitle></CardHeader><CardContent className="space-y-4 text-sm leading-6 text-muted-foreground"><p>{item.copy}</p><p className="rounded-lg bg-muted p-3 font-medium text-foreground">{item.action}</p></CardContent></Card>)}
            </div>
            <Card className="mt-5 bg-white"><CardHeader><CardTitle>主要依据</CardTitle><CardDescription>上线运营时仍应复核当天最新官方公告和属地要求。</CardDescription></CardHeader><CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <a className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted" href="https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm" target="_blank" rel="noreferrer">2026年部分节假日安排 <ExternalLink className="size-4" /></a>
              <a className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted" href="https://app.www.gov.cn/govdata/gov/202004/03/456874/article.html" target="_blank" rel="noreferrer">全国性哀悼停止公共娱乐活动示例 <ExternalLink className="size-4" /></a>
              <a className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted" href="https://www.npc.gov.cn/zgrdw/npc/xinwen/lfgz/2014-02/26/content_1830441.htm" target="_blank" rel="noreferrer">抗战胜利纪念日决定 <ExternalLink className="size-4" /></a>
              <a className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted" href="https://rd.nanjing.gov.cn/lfgz_0/sjfg_1/202605/t20260508_5836290.html" target="_blank" rel="noreferrer">南京市国家公祭保障条例 <ExternalLink className="size-4" /></a>
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>

      <footer className="mx-auto flex max-w-[1500px] items-center justify-between px-5 pb-8 text-[11px] text-muted-foreground lg:px-8"><span className="flex items-center gap-2"><CircleDot className="size-3" />传播排期需结合当日权威公告复核</span><span>PR PULSE / 2026</span></footer>
    </main>
  );
}
