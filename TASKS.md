# 待完成计划

> 创建时间: 2026-05-30
> 最后更新: 2026-06-01
> 状态说明: [ ] 未开始 / [~] 进行中 / [x] 已完成

---

## 阶段一：项目初始化

- [x] 1.1 初始化 Vite + React + TypeScript 项目
- [x] 1.2 安装 Tailwind CSS 并配置
- [x] 1.3 安装 React Router、Recharts 等核心依赖
- [x] 1.4 创建 features/ 和 shared/ 目录结构
- [x] 1.5 创建 Supabase 项目，配置环境变量
- [x] 1.6 初始化 Git 仓库 → https://github.com/fjnbvvs26j-blip/we-app

## 阶段二：数据库 + 认证

- [x] 2.1 编写数据库迁移 SQL（初始化所有表）
- [x] 2.2 在 Supabase 执行迁移
- [x] 2.3 实现 Supabase Auth（真实邮箱注册+登录，服务端 bcrypt）
- [x] 2.4 创建 AuthPage 页面
- [x] 2.5 创建共享类型定义（shared/types/）
- [x] 2.6 创建 AuthProvider + useAuth 上下文
- [x] 2.7 RLS 数据隔离（vocab_progress/profiles 等按 auth.uid() 隔离）
- [x] 2.8 邮箱自动确认 trigger（绕过 Supabase 邮件验证）

## 阶段三：考研-单词模块

- [x] 3.1 设计 vocab.types.ts 类型
- [x] 3.2 导入考研词汇数据（5407 词）
- [x] 3.3 实现 vocab.service.ts（CRUD + 查询 + 进度 + 出题）
- [x] 3.4 实现闪卡组件（3D 翻转 + 触摸滑动 + 按钮）
- [x] 3.5 实现 SM-2 间隔重复算法（忘记重置 + times_known/unknown）
- [x] 3.6 实现互动出题功能（QuizBuilder）
- [x] 3.7 实现 VocabPage（六 Tab：背单词/周报/搜索/易错/TA题/我出）
- [x] 3.8 每日目标设定 + 连续打卡（环形进度）
- [x] 3.9 单词搜索（前缀匹配 + 复习历史）
- [x] 3.10 易错词本（≥2 次不认识自动归入）
- [x] 3.11 每轮词数可调（3-50）
- [x] 3.12 统计卡片可点击 → 单词列表弹窗 → 单词咨询弹窗（翻页 + 搜索）
- [x] 3.13 英文例句获取（4214/5407 词）
- [~] 3.14 例句中文翻译（运行中 ~700/3142）
- [x] 3.15 考研真题频次导入（5301 词全部导入）
- [~] 3.16 一词多义 + 熟词僻义标粗（运行中）
- [x] 3.17 周报（近 7 天柱状图 + 周总览）
- [x] 3.18 UI 美化（暖调书房风格，全面完成）
- [x] 3.19 手机触摸滑动手势
- [x] 3.20 卡片翻页即时响应（fire-and-forget 存进度）
- [x] 3.21 总词库并行加载（5000 词 ~500ms）

## 阶段四：考研-数学模块

- [ ] 4.1 设计 math.types.ts 类型
- [ ] 4.2 导入考研数学公式数据
- [ ] 4.3 实现 math.service.ts
- [ ] 4.4 实现错题本组件
- [ ] 4.5 实现公式速查组件
- [ ] 4.6 实现 MathPage 页面

## 阶段五：恋爱-首页仪表盘

- [x] 5.0 DB 迁移：invite_code + 伴侣可见 RLS + statuses UPDATE 策略（009_add_partner_rls.sql）
- [x] 5.1 useAuth 扩展：partner_id / target_school / invite_code + linkPartner + refreshProfile
- [x] 5.2 创建 home.types.ts + home.service.ts（状态/倒计时/伴侣信息/邀请码查找）
- [x] 5.3 实现 StatusBar 组件（5 种状态选择器 + 伴侣状态展示）
- [x] 5.4 实现 CountdownCard 组件（距下次见面倒计时）
- [x] 5.5 实现 QuickStats 组件（学习概览，链接到单词页）
- [x] 5.6 实现 PartnerLink 组件（邀请码关联 UI）
- [x] 5.7 实现 PartnerBanner 组件（已关联伴侣信息横幅）
- [x] 5.8 实现 BottomNav 底部导航（首页/单词）
- [x] 5.9 路由改造：/ → HomePage，/vocab → VocabPage，LayoutWithNav
- [x] 5.10 精简 VocabPage 头部（退出按钮移到首页）
- [x] 5.11 全局 UI 美化（frontend-design 方法论：动画/层次/氛围/仪式感）
- [x] 5.12 单方绑定伴侣（link_partners SECURITY DEFINER 函数 + RPC 调用）
- [x] 5.13 伴侣关联 UI 完善（PartnerBanner 邀请码分享 + PartnerLink 单向提示）
- [x] 5.14 单词高频词优先推送（每轮 ≥50% 真题高频词）
- [x] 5.15 周报丰富化（遗忘重置卡片、词频覆盖条形图、易错 TOP 20）
- [x] 5.16 桌面端键盘快捷键（← → Space）
- [x] 5.17 易错词显示 20 个（原 30）
- [x] 5.18 自动刷新修复（Tab 切换 force 跳过去重 + 后台轮询同时更新 daily）
- [x] 5.19 统计弹窗"已掌握"规则说明
- [x] 5.20 超时 12s→20s + 友好超时提示
- [x] 5.21 loadWords 改为 review+new 并行获取，stats 非阻塞
- [x] 5.22 loadWeeklyStats Promise.all→Promise.allSettled，单查询失败不影响整体
- [x] 5.23 loadDifficultWords 去 diffloaded 锁，换用 dedup 去重 + 可重试

## 阶段六：恋爱-日常互动

- [ ] 6.1 设计 topics.types.ts、wall.types.ts
- [ ] 6.2 实现每日话题
- [ ] 6.3 实现时光便签
- [ ] 6.4 实现 TopicsPage + WallPage

## 阶段七：恋爱-见面规划

- [ ] 7.1 设计 meet.types.ts
- [ ] 7.2 实现四步向导
- [ ] 7.3 实现 MeetPage

## 阶段八：部署 + 优化

- [x] 8.1 Git 仓库 + GitHub 推送
- [x] 8.2 部署到 Vercel（需 VPN）
- [x] ~~8.3 部署到 Netlify~~ → 2026-06-01 迁移到 Cloudflare Pages
- [x] ~~8.4 部署到 GitHub Pages~~ → 已废弃
- [x] ~~8.5 Netlify Function API 代理~~ → 迁移为 Cloudflare Pages Function
- [x] 8.6 请求超时保护（12s AbortController + 30s 硬兜底）
- [x] 8.7 HashRouter（兼容所有静态主机）
- [x] 8.8 慢查询优化（周报 7→1 查询、not.in 过滤、limit 兜底）
- [x] 8.9 数据实时同步（Tab 切换刷新 + 去重 + 页面可见性轮询）
- [x] 8.10 缓存控制（_headers：index.html no-cache，assets immutable）
- [x] 8.11 移动端触摸滑动 + 即时翻卡
- [x] 8.12 白屏修复（useRef 导入 + ErrorBoundary）
- [x] 8.13 登录体验优化（去掉 loading 阻塞 + auth 容错）
- [x] 8.14 代码分割（React.lazy VocabPage）
- [x] 8.15 每日目标弹窗选择器（50/100/150/200）
- [x] 8.16 伴侣关联功能（邀请码 + 单方绑定 + RLS 伴侣可见）
- [x] 8.17 迁移到 Cloudflare Pages + Functions（免费额度充足，Git 自动部署）
- [ ] 8.18 互动出题启用
