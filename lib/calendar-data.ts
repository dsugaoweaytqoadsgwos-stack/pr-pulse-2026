import calendar from './calendar-2026.json';

export type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  category: string;
  sourceType: 'workbook' | 'solemn' | 'live';
  riskLevel: 'normal' | 'watch' | 'high' | 'critical';
  recommendation?: string;
  sourceUrl?: string;
};

export const calendarEvents = calendar.events as CalendarEvent[];

export const solemnDays: CalendarEvent[] = [
  { id: 'solemn-0405', date: '2026-04-05', title: '清明节 · 慎用娱乐化传播', category: '肃穆提醒', sourceType: 'solemn', riskLevel: 'high', recommendation: '建议减少强娱乐、恶搞和过度促销内容；若有官方临时哀悼公告，以公告为准。' },
  { id: 'solemn-0512', date: '2026-05-12', title: '汶川地震纪念日 / 全国防灾减灾日', category: '肃穆提醒', sourceType: 'solemn', riskLevel: 'high', recommendation: '暂停灾难玩梗、欢庆式借势；公益与防灾内容须尊重事实和受灾者。' },
  { id: 'solemn-0707', date: '2026-07-07', title: '全民族抗战爆发纪念日', category: '肃穆提醒', sourceType: 'solemn', riskLevel: 'high', recommendation: '避免欢庆式营销、历史戏谑和不当国别比较。' },
  { id: 'solemn-0815', date: '2026-08-15', title: '日本宣布无条件投降纪念日', category: '肃穆提醒', sourceType: 'solemn', riskLevel: 'high', recommendation: '涉及抗战历史、国家与民族议题时提高审批等级。' },
  { id: 'solemn-0903', date: '2026-09-03', title: '中国人民抗日战争胜利纪念日', category: '国家纪念日', sourceType: 'solemn', riskLevel: 'high', recommendation: '避免娱乐化、戏谑化和商业硬广抢占纪念语境。' },
  { id: 'solemn-0909', date: '2026-09-09', title: '毛泽东逝世纪念日', category: '肃穆提醒', sourceType: 'solemn', riskLevel: 'watch', recommendation: '避免娱乐化借势；历史内容须使用权威来源。' },
  { id: 'solemn-0918', date: '2026-09-18', title: '九一八事变纪念日', category: '公关高敏日', sourceType: 'solemn', riskLevel: 'critical', recommendation: '建议暂停欢庆式营销、娱乐热搜和高调促销；历史与国别话题须升级审批。' },
  { id: 'solemn-0930', date: '2026-09-30', title: '烈士纪念日', category: '国家纪念日', sourceType: 'solemn', riskLevel: 'high', recommendation: '减少娱乐化内容；英烈相关传播须遵守英雄烈士保护法律法规。' },
  { id: 'solemn-1213', date: '2026-12-13', title: '南京大屠杀死难者国家公祭日', category: '国家公祭日', sourceType: 'solemn', riskLevel: 'critical', recommendation: '建议全天停止娱乐化和欢庆式营销；涉及南京及现场活动时遵守属地公告。' },
  { id: 'solemn-0108', date: '2026-01-08', title: '周恩来逝世纪念日', category: '肃穆提醒', sourceType: 'solemn', riskLevel: 'watch', recommendation: '避免戏谑化表达，相关历史内容加强事实核验。' },
  { id: 'solemn-0219', date: '2026-02-19', title: '邓小平逝世纪念日', category: '肃穆提醒', sourceType: 'solemn', riskLevel: 'watch', recommendation: '避免娱乐化借势，相关历史内容使用权威资料。' },
];
