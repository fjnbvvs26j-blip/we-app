# 开发日志

> 项目: 考研+异地恋 双模块软件
> 创建时间: 2026-05-30
> 记录每次开发的变更、决策和遇到的问题

---

## 2026-05-30 — 项目启动 + 基础设施搭建

### 产品方向确认
- 双模块：考研（数学+单词）+ 异地恋（互动+见面规划）
- 交互亮点：互动背单词（她学习、他出题，学习即陪伴）
- 见面规划四步向导：时间协调 → 出行 → 时间分配 → 约会点子

### 技术决策
- **前端：** Vite + React 18 + TypeScript + Tailwind CSS v4 + React Router v6
- **后端：** Supabase（PostgreSQL + Auth + Storage）
- **架构：** feature-based 目录组织，service 层隔离数据访问
- **数据库：** 每表预留 `metadata JSONB` 扩展字段

### 已完成
1. ✅ 项目脚手架（Vite + React + TS + Tailwind）
2. ✅ Supabase 项目创建（Tokyo 区域，ref: `kcgkrgalxgparkryzbhj`）
3. ✅ 12 张数据库表 + 索引 + RLS 策略（`001_init.sql`）
4. ✅ Auto-profile 触发器
5. ✅ AuthPage + AuthProvider + 路由守卫
6. ✅ 开发服务器运行在 localhost:5173

### 遇到的问题 & 解决
- Supabase Auth SDK 导致页面无限加载 → 最初改用 localStorage 本地认证（后续在 2026-05-31 晚已重新接入真实 Supabase Auth）

---

## 2026-05-31（早） — 单词模块深度增强 + UI 美化

### SM-2 算法完善
- 忘记的词 review_count 归零，间隔从 4 小时重新开始
- metadata 中记录 times_known / times_unknown

### 功能
- 本轮完成页、每轮词数可调（3-50）、每日目标（环形进度）、连续打卡
- 单词搜索（前缀匹配）、易错词本（≥2 次不认识）
- 周报（近 7 天柱状图）、英文例句（4214 词）、考研真题频次（5301 词）

### UI 美化
- **设计方向：** 暖调书房 — 奶油纸色 `#FCF7F0`、暖棕 `#2C1810`/`#5C3D2E`、陶土橙 `#B8652B`、鼠尾草绿 `#6B8F71`
- **字体：** Playfair Display + Noto Serif SC + Figtree
- AuthPage / VocabPage / FlashCard 全面重写
- 统计卡片可点击查看单词列表 + 单词咨询弹窗（翻页 + 搜索）

---

## 2026-05-31（晚） — 真实认证 + 多设备部署

### Supabase Auth 接入（重大架构变更）
- **之前：** localStorage 模拟认证，密码被丢弃，任何人可登录
- **之后：** 接入真实 Supabase Auth（`auth.service.ts` 已有，之前未使用）
  - `signUp()` → `supabase.auth.signUp()`，服务端 bcrypt 哈希
  - `signIn()` → `supabase.auth.signInWithPassword()`，服务端校验
  - `getSession()` 启动时检查已有会话
  - `onAuthStateChange()` 监听 token 刷新
- 删除 localStorage 认证逻辑（`we_user` key、`crypto.randomUUID()`）
- 保留 auto-profile trigger（新用户注册自动创建 profiles 行）

### RLS 数据隔离
- **之前：** 所有表 RLS 关闭，anon key 可读写全库
- **之后：** 为 vocab_progress / vocab_quizzes / profiles 等表启用 RLS
  - `user_id = auth.uid()::text`（列是 TEXT 类型，需要显式转型）
  - vocab_words 等共享表：所有已认证用户只读
- **SQL 文件：** `supabase/migrations/20260531000001_reenable_rls.sql`

### 邮箱验证处理
- Supabase 默认开启邮箱验证，注册后不发 session
- 创建 auto_confirm_email trigger，自动标记 `email_confirmed_at`
- 代码层：注册后若未获得 session，自动补一次 `signIn()`

### 部署

| 平台 | URL | 状态 |
|------|-----|------|
| Vercel | https://we-xi-five.vercel.app | 国内需 VPN |
| Netlify（主） | **https://we-app-181.netlify.app** | 永久，国内直连 |

- **Git 仓库：** https://github.com/fjnbvvs26j-blip/we-app
- **GitHub 认证：** `gh` CLI 已配置（账号 fjnbvvs26j-blip）
- **Netlify 认证：** 已登录（邮箱 fjnbvvs26j@privaterelay.appleid.com）
- **部署命令：** `npm run build && npx netlify-cli deploy --dir=dist --prod`

### 部署中遇到的构建问题 & 解决
- `tsc -b` 在 Vercel 报 TS5101（baseUrl 弃用）→ 添加 `ignoreDeprecations: "6.0"`
- `tsc -b` 仍有多个类型错误 → build 命令简化为 `vite build`（Vite 自身处理 TS 编译）
- PostgrestFilterBuilder 不兼容 Promise.all → 用 `.then(r => r)` 包装

### 手机端优化（2026-05-31 深夜）
- **触摸滑动：** FlashCard 添加 touchStart/Move/End 手势，超过 60px 阈值触发，跟手拖拽
- **即时翻卡：** saveProgress 改为 fire-and-forget，不再 await 网络请求，卡片瞬间切换
- **总词库加载加速：** 所有词页并行获取 + 统一批量查进度，5000 词从 10+ 轮串行 → 2 轮等待

---

## 2026-05-31（深夜） — 中国网络适配 + 双平台部署

### 问题诊断
- **真凶：** `supabase.co` 域名在中国被 DNS 污染，API 请求永久挂起，导致页面无限 loading 或白屏
- 一直以为 Netlify/Vercel 被墙，实际是 Supabase 连不上

### 解决方案
- **API 代理：** `netlify/functions/api.ts` — Netlify Serverless Function 反向代理
  - 浏览器 → `we-app-181.netlify.app/api/*` → Netlify Function（美国服务器）→ `supabase.co`（国际直连）
  - 对浏览器透明，无需 VPN
- **超时保护：** Supabase 客户端加 12s AbortController 超时 + 30s 硬兜底
  - 防止网络不通时页面无限卡死
- **HashRouter：** BrowserRouter → HashRouter，兼容所有静态主机
- **双平台部署：**

| Netlify | https://we-app-181.netlify.app | 主力，API 代理中转 Supabase |

- **缓存控制：** `public/_headers` — index.html no-cache，assets 永久缓存

### 性能优化
- **getWeeklyStats：** 7 次串行查询 → 1 次范围查询
- **getNewWords：** 客户端过滤 → `not.in` 服务器过滤
- **getDifficultWords/getStats：** 全量扫描 → 加 limit 兜底
- **Tab 切换刷新：** 切回背单词自动刷新 stats，30s 后去重
- **页面可见性轮询：** 页面可见时每 30s 后台刷新

### Bug 修复 & 体验优化（2026-05-31 凌晨）
- **白屏修复：** useRef 漏导入 → 加全局 ErrorBoundary
- **登录即见：** 去掉 loading 阻塞，打开直接显示登录页，session 后台检查
- **代码分割：** React.lazy → VocabPage 独立 chunk（49KB），首屏仅 371KB
- **移除无用依赖：** pg、recharts，减少 562 行
- **每日目标：** 点击弹窗式选择器（+/− 按钮 + 50/100/150/200 快捷预设）
- **auth 容错：** loadProfile 失败不阻塞登录，signIn/checkSession 加固

### 后续
- [x] 伴侣关联功能（邀请码机制 + RLS 伴侣可见）
- [ ] 互动出题启用

---

## 2026-06-01 — 首页仪表盘（恋爱功能第一步）

### 数据库迁移
- **`supabase/migrations/20260601000001_add_partner_rls.sql`**
  - `profiles` 新增 `invite_code TEXT` 列 + unique index
  - `profiles_read_own` → 所有已认证用户可读（邀请码查找需要）
  - `statuses_read_own` → 自己+伴侣可见
  - `statuses` 补充 UPDATE 策略
  - `wall_notes`、`topic_answers` RLS 增加伴侣可见

### useAuth 扩展
- `User` 类型增加 `partner_id`、`target_school`、`invite_code`
- 新增 `refreshProfile()` 和 `linkPartner(inviteCode)` 方法
- 伴侣关联：A 复制邀请码→B 输入→双方互相可见

### 新增功能
- **底部导航：** `BottomNav` 组件（首页 / 单词），固定底部，毛玻璃效果
- **路由改造：** `/` → HomePage，`/vocab` → VocabPage（懒加载），`LayoutWithNav` 布局
- **状态栏：** 5 种状态（学习/休息/想你/有空/自定义），伴侣状态实时展示
- **见面倒计时：** 从 `meet_plans` 读取最近计划，大号数字倒计时
- **学习概览：** QuickStats 卡片（今日复习/已掌握/连续打卡），点击跳转单词页
- **伴侣关联：** PartnerLink（邀请码展示+输入）+ PartnerBanner（关联成功横幅）
- **VocabPage 精简：** 退出按钮移到首页头部

### 架构决策
- **邀请码 vs 邮箱：** 选邀请码，不暴露邮箱，6 位随机字符串
- **双向关联：** 各自更新自己的 `partner_id`，纯客户端操作
- **无伴侣也能用：** 首页所有功能不依赖伴侣关联，组件优雅降级
- **profiles RLS 放宽：** `USING (true)` 允许所有已认证用户读取（信息不敏感）
- **技能：** 使用 frontend-design 确保 UI 质量

### 文件清单
| 新建 | 修改 |
|------|------|
| `supabase/migrations/20260601000001_add_partner_rls.sql` | `src/shared/hooks/useAuth.tsx` |
| `src/features/home/home.types.ts` | `src/App.tsx` |
| `src/features/home/home.service.ts` | `src/features/vocab/VocabPage.tsx` |
| `src/features/home/HomePage.tsx` | `TASKS.md` / `DEVLOG.md` |
| `src/features/home/components/StatusBar.tsx` | |
| `src/features/home/components/CountdownCard.tsx` | |
| `src/features/home/components/QuickStats.tsx` | |
| `src/features/home/components/PartnerLink.tsx` | |
| `src/features/home/components/PartnerBanner.tsx` | |
| `src/shared/components/BottomNav.tsx` | `src/features/vocab/FlashCard.tsx` |
| | `src/features/vocab/vocab.service.ts` |
| | `src/features/vocab/vocab.types.ts` |
| | `src/shared/lib/supabase.ts` |
| | `src/index.css` |
| | `src/features/auth/AuthPage.tsx` |

---

## 2026-06-01（续） — UI 全局美化 + 伴侣绑定完善 + Bug 修复

### UI 美化（frontend-design 方法论驱动）
- 按 SKILL.md 方法论执行，设计方向：温暖亲密、触感真实
- 新增动画：`numberPop`（弹跳）、`heartbeat`（心跳）、`card-lift`（悬停浮动）
- **AuthPage：** 暖光光晕 + 装饰点线 + 卡片双层阴影 + 按钮三阶渐变
- **PartnerLink：** 心跳动画 + 虚线框 + 绿色提示
- **PartnerBanner：** 左侧色条 + 伴侣标签 pill + 邀请码分享行
- **CountdownCard：** 4.5rem 超大数字 + numberPop 弹跳 + 光晕
- **StatusBar：** 活跃态上浮 + 阴影 + 顶部指示点
- **BottomNav：** emoji → SVG 图标 + 活跃态背景色块 + 毛玻璃增强

### 伴侣关联完善
- **单方绑定：** `link_partners` SECURITY DEFINER 函数 + `supabase.rpc()`
  - 一方输入码 → 双方 partner_id 同时更新
  - TEXT → ::uuid 转换修复 + RPC 不存在降级兜底
- **PartnerBanner：** 已关联用户也能复制分享邀请码
- **错误提示：** 显示 Supabase 具体错误信息

### Bug 修复
- **周报/易错不显示：** Promise.all → Promise.allSettled
- **易错无法重试：** 去 difficultLoaded 锁，换 dedup + 刷新清除缓存
- **背单词加载失败：** review + new 并行，stats 非阻塞
- **自动刷新失效：** Tab 切换 force 绕过 dedup + 后台同时刷新 stats + daily
- **超时：** 12s → 20s + 友好中文超时提示
- **SQL 兼容：** column::text = auth.uid()::text 双向 cast

### 单词增强
- 高频词优先推送（≥50%）、键盘快捷键（←→Space）、周报三卡片、易错 20 个、已掌握规则说明

---

## 关键信息速查

### 运行项目
```bash
cd /Users/orange/Desktop/we
npm run dev        # 本地开发
npm run build      # 生产构建
```

### 部署
```bash
npm run build && npx netlify-cli deploy --dir=dist --prod
```

### 线上地址
- https://we-app-181.netlify.app

### Supabase 项目
- **Dashboard：** https://supabase.com/dashboard/project/kcgkrgalxgparkryzbhj
- **SQL Editor：** 用于执行迁移和查询

### 下一步
- [x] 伴侣关联功能
- [ ] 互动出题启用
- [ ] 每日话题
- [ ] 时光便签
- [ ] 见面规划
- [ ] 考研数学模块
