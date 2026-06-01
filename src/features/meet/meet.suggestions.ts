/**
 * AI 建议引擎（纯规则驱动，不调任何外部 API）
 *
 * 全部基于本地 JavaScript 生成建议，零费用、零延迟、可离线。
 * 接口设计为纯函数：suggest(input) → Suggestion[]
 * 未来可无缝替换为 Cloudflare Workers AI / 其他 LLM。
 */
import type { MeetingPlan, Suggestion, CalendarEntry } from './meet.types'

// ============ 约会点子模板库 ============

type DateTemplate = {
  id: string
  title: string
  description: string
  tags: string[]           // 匹配标签
  minHours: number
  maxHours: number
  hasStudy: boolean        // 包含学习环节
  activities: { time: string; title: string; type: 'study' | 'date' | 'other'; duration: number }[]
}

const DATE_TEMPLATES: DateTemplate[] = [
  {
    id: 'library-study',
    title: '图书馆学习日',
    description: '一起在图书馆/咖啡厅学习，互相出题，效率翻倍',
    tags: ['study', 'indoor', 'quiet'],
    minHours: 3,
    maxHours: 8,
    hasStudy: true,
    activities: [
      { time: '09:00', title: '到达图书馆/咖啡厅', type: 'other', duration: 15 },
      { time: '09:15', title: '各自复习（数学/单词）', type: 'study', duration: 120 },
      { time: '11:15', title: '互相出题检验', type: 'study', duration: 30 },
      { time: '11:45', title: '午餐', type: 'date', duration: 60 },
      { time: '13:00', title: '下午继续学习', type: 'study', duration: 120 },
      { time: '15:00', title: '整理笔记 + 讨论难点', type: 'study', duration: 45 },
      { time: '15:45', title: '散步休息', type: 'date', duration: 30 },
    ],
  },
  {
    id: 'city-walk',
    title: '城市漫游',
    description: '一起探索城市角落，拍照打卡，享受慢时光',
    tags: ['outdoor', 'walk', 'photo'],
    minHours: 4,
    maxHours: 10,
    hasStudy: false,
    activities: [
      { time: '10:00', title: '碰头', type: 'other', duration: 15 },
      { time: '10:15', title: '逛特色街区/公园', type: 'date', duration: 120 },
      { time: '12:15', title: '打卡当地美食', type: 'date', duration: 60 },
      { time: '13:30', title: '参观博物馆/美术馆', type: 'date', duration: 90 },
      { time: '15:00', title: '咖啡馆休息聊天', type: 'date', duration: 60 },
      { time: '16:00', title: '散步拍照', type: 'date', duration: 60 },
    ],
  },
  {
    id: 'movie-date',
    title: '电影约会',
    description: '看一部电影 + 晚餐 + 交流感想，经典浪漫',
    tags: ['indoor', 'cinema', 'romantic'],
    minHours: 3,
    maxHours: 6,
    hasStudy: false,
    activities: [
      { time: '14:00', title: '看电影', type: 'date', duration: 120 },
      { time: '16:00', title: '咖啡厅交流观后感', type: 'date', duration: 45 },
      { time: '16:45', title: '附近逛逛', type: 'date', duration: 45 },
      { time: '17:30', title: '晚餐', type: 'date', duration: 60 },
    ],
  },
  {
    id: 'picnic',
    title: '公园野餐',
    description: '带上零食和书本，在草地上度过悠闲一天',
    tags: ['outdoor', 'nature', 'relax'],
    minHours: 3,
    maxHours: 7,
    hasStudy: false,
    activities: [
      { time: '11:00', title: '超市采购野餐食物', type: 'other', duration: 30 },
      { time: '11:30', title: '到达公园铺好野餐垫', type: 'date', duration: 30 },
      { time: '12:00', title: '野餐 + 聊天', type: 'date', duration: 90 },
      { time: '13:30', title: '散步 / 拍照', type: 'date', duration: 60 },
      { time: '14:30', title: '一起看书或听音乐', type: 'date', duration: 60 },
      { time: '15:30', title: '收拾回家', type: 'other', duration: 30 },
    ],
  },
  {
    id: 'cooking',
    title: '一起做饭',
    description: '在家一起做一顿饭，合作完成，温馨又美味',
    tags: ['indoor', 'cooking', 'cozy'],
    minHours: 3,
    maxHours: 5,
    hasStudy: false,
    activities: [
      { time: '16:00', title: '一起去超市买菜', type: 'date', duration: 45 },
      { time: '16:45', title: '一起准备食材', type: 'date', duration: 30 },
      { time: '17:15', title: '合作做饭', type: 'date', duration: 60 },
      { time: '18:15', title: '享用晚餐', type: 'date', duration: 45 },
      { time: '19:00', title: '一起洗碗收拾', type: 'date', duration: 20 },
      { time: '19:20', title: '看剧/听歌放松', type: 'date', duration: 60 },
    ],
  },
  {
    id: 'study-cafe',
    title: '咖啡厅学习 + 简餐',
    description: '切换环境提高学习效率，适合半天的充电约会',
    tags: ['study', 'indoor', 'cafe'],
    minHours: 2,
    maxHours: 5,
    hasStudy: true,
    activities: [
      { time: '14:00', title: '找一家安静的咖啡厅', type: 'other', duration: 15 },
      { time: '14:15', title: '各自学习', type: 'study', duration: 90 },
      { time: '15:45', title: '互相测试单词', type: 'study', duration: 20 },
      { time: '16:05', title: '休息 + 甜点', type: 'date', duration: 25 },
      { time: '16:30', title: '继续学习/整理', type: 'study', duration: 45 },
    ],
  },
  {
    id: 'sports',
    title: '运动约会',
    description: '一起运动，释放压力，活力满满',
    tags: ['outdoor', 'sports', 'active'],
    minHours: 2,
    maxHours: 5,
    hasStudy: false,
    activities: [
      { time: '15:00', title: '到达运动场地', type: 'other', duration: 15 },
      { time: '15:15', title: '热身 + 运动（羽毛球/跑步等）', type: 'date', duration: 90 },
      { time: '16:45', title: '休息补水 + 聊天', type: 'date', duration: 30 },
      { time: '17:15', title: '散步放松', type: 'date', duration: 30 },
      { time: '17:45', title: '一起吃饭补充能量', type: 'date', duration: 60 },
    ],
  },
  {
    id: 'home-comfort',
    title: '宅在一起',
    description: '在家放松，一起看剧/玩游戏/聊天，最轻松的陪伴',
    tags: ['indoor', 'cozy', 'relax'],
    minHours: 2,
    maxHours: 12,
    hasStudy: false,
    activities: [
      { time: '10:00', title: '一起睡到自然醒', type: 'other', duration: 0 },
      { time: '10:30', title: '做一顿早午餐', type: 'date', duration: 45 },
      { time: '11:15', title: '看剧/电影', type: 'date', duration: 120 },
      { time: '13:15', title: '午休/各自看书', type: 'date', duration: 60 },
      { time: '14:15', title: '一起玩游戏/拼图', type: 'date', duration: 60 },
      { time: '15:15', title: '下午茶 + 聊天', type: 'date', duration: 30 },
    ],
  },
]

// ============ 城市距离参考（简化） ============

const CITY_DISTANCES: Record<string, Record<string, { km: number; train: string; trainTime: string; flight: string; flightTime: string }>> = {
  '北京': {
    '上海': { km: 1218, train: '高铁 G 字头', trainTime: '4.5h', flight: '飞机', flightTime: '2h' },
    '广州': { km: 2116, train: '高铁 G 字头', trainTime: '8h', flight: '飞机', flightTime: '3h' },
    '深圳': { km: 2145, train: '高铁 G 字头', trainTime: '8.5h', flight: '飞机', flightTime: '3h' },
    '成都': { km: 1800, train: '高铁 G 字头', trainTime: '7.5h', flight: '飞机', flightTime: '2.5h' },
    '杭州': { km: 1250, train: '高铁 G 字头', trainTime: '4.5h', flight: '飞机', flightTime: '2h' },
    '武汉': { km: 1150, train: '高铁 G 字头', trainTime: '4h', flight: '飞机', flightTime: '2h' },
    '南京': { km: 1000, train: '高铁 G 字头', trainTime: '3.5h', flight: '飞机', flightTime: '1.5h' },
    '西安': { km: 1100, train: '高铁 G 字头', trainTime: '4.5h', flight: '飞机', flightTime: '2h' },
    '长沙': { km: 1500, train: '高铁 G 字头', trainTime: '5.5h', flight: '飞机', flightTime: '2.5h' },
    '重庆': { km: 1700, train: '高铁 G 字头', trainTime: '7h', flight: '飞机', flightTime: '2.5h' },
  },
  '上海': {
    '北京': { km: 1218, train: '高铁 G 字头', trainTime: '4.5h', flight: '飞机', flightTime: '2h' },
    '广州': { km: 1650, train: '高铁 G 字头', trainTime: '7h', flight: '飞机', flightTime: '2.5h' },
    '深圳': { km: 1600, train: '高铁 G 字头', trainTime: '7h', flight: '飞机', flightTime: '2.5h' },
    '杭州': { km: 160, train: '高铁 G 字头', trainTime: '45min', flight: '—', flightTime: '—' },
    '南京': { km: 295, train: '高铁 G 字头', trainTime: '1h', flight: '—', flightTime: '—' },
  },
  '广州': {
    '深圳': { km: 100, train: '高铁 G 字头', trainTime: '30min', flight: '—', flightTime: '—' },
    '长沙': { km: 640, train: '高铁 G 字头', trainTime: '2.5h', flight: '—', flightTime: '—' },
  },
  '成都': {
    '重庆': { km: 300, train: '高铁 G 字头', trainTime: '1h', flight: '—', flightTime: '—' },
    '西安': { km: 700, train: '高铁 G 字头', trainTime: '3h', flight: '飞机', flightTime: '1.5h' },
  },
}

// ============ 建议生成函数 ============

/**
 * 生成所有建议
 */
export function generateSuggestions(plan: Partial<MeetingPlan>): Suggestion[] {
  const suggestions: Suggestion[] = []

  // 1. 时间分配建议
  const timeSplit = suggestTimeSplit(plan)
  if (timeSplit) suggestions.push(timeSplit)

  // 2. 约会点子
  const dateIdeas = suggestDateIdeas(plan)
  suggestions.push(...dateIdeas)

  // 3. 出行建议
  if (plan.from_city && plan.destination) {
    const transportSuggestion = suggestTransport(plan.from_city, plan.destination)
    if (transportSuggestion) suggestions.push(transportSuggestion)
  }

  // 4. 待办清单
  const packingList = suggestPackingList(plan)
  if (packingList) suggestions.push(packingList)

  // 5. 预算估算
  if (plan.total_hours) {
    const budget = suggestBudget(plan)
    if (budget) suggestions.push(budget)
  }

  return suggestions
}

/** 基于日历数据生成忙碌/空闲分析 */
export function analyzeAvailability(myEntries: CalendarEntry[], partnerEntries: CalendarEntry[], year: number, month: number): Suggestion[] {
  const suggestions: Suggestion[] = []
  const myAvailable = myEntries.filter(e => e.is_available)
  const partnerAvailable = partnerEntries.filter(e => e.is_available)

  // 双方都标记有空的日期
  const myDates = new Set(myAvailable.map(e => e.date))
  const partnerDates = new Set(partnerAvailable.map(e => e.date))
  const commonDates = [...myDates].filter(d => partnerDates.has(d))

  if (commonDates.length > 0) {
    suggestions.push({
      id: 'common-available',
      type: 'itinerary',
      title: '双方都有空的日子',
      description: `这个月有 ${commonDates.length} 天双方都标记了有空`,
      details: commonDates.slice(0, 7).map(d => {
        const date = new Date(d)
        const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
        return `${date.getMonth() + 1}/${date.getDate()} ${weekDay}`
      }),
    })
  }

  const bothBusyCount = myEntries.filter(e => !e.is_available && partnerEntries.find(p => p.date === e.date && !p.is_available)).length

  if (bothBusyCount > 5) {
    suggestions.push({
      id: 'busy-alert',
      type: 'itinerary',
      title: '这个月比较忙',
      description: '双方都很忙，建议尽早协调见面时间',
      details: ['可以考虑短途见面或调整日程'],
    })
  }

  return suggestions
}

// ---------- 内部实现 ----------

function suggestTimeSplit(plan: Partial<MeetingPlan>): Suggestion | null {
  const total = plan.total_hours
  if (!total || total <= 0) return null

  // 根据总时长推荐学习/约会比例
  let studyRatio: number
  let dateRatio: number

  if (total <= 3) {
    studyRatio = 0.3; dateRatio = 0.7     // 短时间多约会
  } else if (total <= 6) {
    studyRatio = 0.4; dateRatio = 0.6     // 半天学习半天玩
  } else {
    studyRatio = 0.5; dateRatio = 0.5     // 各一半
  }

  const studyH = Math.round(total * studyRatio)
  const dateH = total - studyH

  return {
    id: 'time-split',
    type: 'time_split',
    title: '⏰ 时间分配建议',
    description: `${total}小时，建议学习 ${studyH}h · 约会 ${dateH}h`,
    details: [
      `学习时间：${studyH}h（可以复习单词/数学，互相出题）`,
      `约会时间：${dateH}h（吃饭/散步/聊天）`,
      studyH >= 2 ? '学习时间充裕，可以带笔记/课本' : '以约会放松为主',
    ],
    actionable: true,
    apply: {
      study_hours: studyH,
      date_hours: dateH,
    },
  }
}

function suggestDateIdeas(plan: Partial<MeetingPlan>): Suggestion[] {
  const total = plan.total_hours || 6
  // 简单启发：长时→户外/漫游，短时→咖啡厅/电影
  const isLong = total >= 5
  const hasStudy = (plan.study_hours || 0) >= 2

  // 根据时长和是否有学习需求筛选模板
  const candidates = DATE_TEMPLATES.filter(t => {
    if (total < t.minHours || total > t.maxHours) return false
    if (hasStudy && !t.hasStudy) return false
    return true
  })

  // 如果没有匹配的模板，提供默认
  if (candidates.length === 0) {
    const defaultTemplates = isLong
      ? DATE_TEMPLATES.filter(t => !t.hasStudy)
      : DATE_TEMPLATES.filter(t => !t.hasStudy && t.maxHours <= 5)

    return defaultTemplates.slice(0, 2).map(t => ({
      id: `date-${t.id}`,
      type: 'date_idea' as const,
      title: `💑 ${t.title}`,
      description: t.description,
      details: t.activities.filter(a => a.duration > 0).map(a => `${a.time} ${a.title}（${a.duration}min）`),
      actionable: true,
      apply: {
        tasks: t.activities.filter(a => a.duration > 0).map((a, i) => ({
          task_type: a.type,
          title: a.title,
          duration_minutes: a.duration,
          sort_order: i,
        })),
      },
    }))
  }

  return candidates.slice(0, 3).map(t => ({
    id: `date-${t.id}`,
    type: 'date_idea' as const,
    title: `💑 ${t.title}`,
    description: t.description,
    details: t.activities.filter(a => a.duration > 0).map(a => `${a.time} ${a.title}（${a.duration}min）`),
    actionable: true,
    apply: {
      tasks: t.activities.filter(a => a.duration > 0).map((a, i) => ({
        task_type: a.type,
        title: a.title,
        duration_minutes: a.duration,
        sort_order: i,
      })),
    },
  }))
}

function suggestTransport(from: string, to: string): Suggestion | null {
  const route = CITY_DISTANCES[from]?.[to] || CITY_DISTANCES[to]?.[from]
  if (!route) {
    return {
      id: 'transport',
      type: 'transport',
      title: '🚄 出行建议',
      description: `${from} → ${to}`,
      details: [
        '建议查询 12306 或航司 App 获取具体班次',
        `距离较远，建议提前一周订票`,
        `可考虑夜间出发节约白天时间`,
      ],
    }
  }

  const suggestions: string[] = [
    `🚄 ${route.train}：约 ${route.trainTime}`,
    route.flight !== '—' ? `✈️ ${route.flight}：约 ${route.flightTime}` : null,
    `距离 ${route.km}km`,
    `${route.km >= 800 ? '距离较远，建议提前规划' : '距离适中，当天往返也可行'}`,
  ].filter(Boolean) as string[]

  return {
    id: 'transport',
    type: 'transport',
    title: '🚄 出行建议',
    description: `${from} → ${to}`,
    details: suggestions,
    actionable: true,
    apply: {
      transport: `${from} → ${to}，${route.train} ${route.trainTime}`,
    },
  }
}

function suggestPackingList(plan: Partial<MeetingPlan>): Suggestion | null {
  const total = plan.total_hours || 0
  const hasHotel = !!plan.hotel

  const items: string[] = ['手机 + 充电宝', '身份证/学生证']
  const studyItems: string[] = ['单词本/笔记', '课本/复习资料', '笔']
  const dateItems: string[] = ['纸巾/湿巾', '水杯']
  const hotelItems: string[] = ['换洗衣物', '洗漱用品', '充电器']

  return {
    id: 'packing',
    type: 'packing',
    title: '🎒 出门备忘清单',
    description: `根据${total}h 安排整理的待办`,
    details: [
      '【必备】' + items.join('、'),
      ...(total >= 3 ? ['【学习】' + studyItems.join('、')] : []),
      ...(total >= 4 ? ['【约会】' + dateItems.join('、')] : []),
      ...(hasHotel ? ['【过夜】' + hotelItems.join('、')] : []),
      ...(total >= 4 ? ['提前查看天气预报', '确认集合地点和时间'] : []),
      '出门前检查一遍！',
    ],
    actionable: false,
  }
}

function suggestBudget(plan: Partial<MeetingPlan>): Suggestion | null {
  const total = plan.total_hours || 0
  const hasHotel = !!plan.hotel
  const hasTransport = !!plan.transport

  let base = 0
  if (total <= 3) base = 100
  else if (total <= 6) base = 200
  else base = 300

  if (hasHotel) base += 300
  if (hasTransport) base += 200

  return {
    id: 'budget',
    type: 'budget',
    title: '💰 预算参考（粗略估算）',
    description: `预计约 ¥${base}${hasHotel ? '~' + (base + 200) : ''}`,
    details: [
      `餐饮：约 ¥${Math.round(base * 0.4)}`,
      `活动：约 ¥${Math.round(base * 0.3)}`,
      ...(hasHotel ? [`住宿：约 ¥${Math.round(base * 0.2)}`] : []),
      ...(hasTransport ? [`交通：约 ¥${Math.round(base * 0.2)}`] : []),
      '此为粗略估算，实际以当地消费为准',
    ],
  }
}
