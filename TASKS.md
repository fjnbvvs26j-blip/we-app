# 待完成计划

> 创建时间: 2026-05-30
> 状态说明: [ ] 未开始 / [~] 进行中 / [x] 已完成

---

## 阶段一：项目初始化

- [x] 1.1 初始化 Vite + React + TypeScript 项目
- [x] 1.2 安装 Tailwind CSS 并配置
- [x] 1.3 安装 React Router、Recharts 等核心依赖
- [x] 1.4 创建 features/ 和 shared/ 目录结构
- [x] 1.5 创建 Supabase 项目，配置环境变量
- [ ] 1.6 初始化 Git 仓库

## 阶段二：数据库 + 认证

- [x] 2.1 编写数据库迁移 SQL（初始化所有表）
- [x] 2.2 在 Supabase 执行迁移
- [x] 2.3 实现 Supabase Auth（邮箱注册+登录）
- [x] 2.4 创建 AuthPage 页面
- [x] 2.5 创建共享类型定义（shared/types/）
- [x] 2.6 创建 AuthProvider + useAuth 上下文
- [x] 2.7 配置邮件自动确认（无需查收验证邮件）

## 阶段三：考研-单词模块

- [x] 3.1 设计 vocab.types.ts 类型
- [x] 3.2 导入考研词汇数据（5407 词，来自 maimemo-export）
- [x] 3.3 实现 vocab.service.ts（CRUD + 查询 + 每日单词 + 进度 + 出题）
- [x] 3.4 实现闪卡组件（FlashCard，3D 翻转 + 左右滑动）
- [x] 3.5 实现 SM-2 间隔重复算法（忘记重置 + times_known/unknown 追踪）
- [x] 3.6 实现互动出题功能（QuizBuilder：出题/答题/评分/鼓励）
- [x] 3.7 实现 VocabPage 页面（六 Tab：背单词/周报/搜索/易错/TA题/我出）
- [x] 3.8 每日目标设定 + 连续打卡（localStorage，环形进度）
- [x] 3.9 单词搜索（前缀匹配 + 复习历史 ✓/✗）
- [x] 3.10 易错词本（不认识 ≥2 次自动归入）
- [x] 3.11 每轮词数可调（3-50，立即生效）
- [x] 3.12 英文例句获取（Free Dictionary API，4214/5407 词）✅
- [~] 3.13 例句中文翻译（Google Translate，运行中 ~700/3142）
- [x] 3.14 考研真题频次导入（NETEMVocabulary，5301 词全部导入 ✅）
- [~] 3.15 一词多义 + 熟词僻义标粗（ECDICT stardict.csv，运行中）
- [x] 3.16 周报（近 7 天柱状图 + 周总览）
- [~] 3.17 UI 美化（暖调书房风格，FlashCard 已完成，VocabPage 进行中）

## 阶段四：考研-数学模块

- [ ] 4.1 设计 math.types.ts 类型
- [ ] 4.2 导入考研数学公式数据（math_formulas 表）
- [ ] 4.3 实现 math.service.ts（CRUD）
- [ ] 4.4 实现错题本组件（ProblemList + 添加/编辑）
- [ ] 4.5 实现公式速查组件（FormulaCards）
- [ ] 4.6 实现数据看板组件（正确率图表等）
- [ ] 4.7 实现 MathPage 页面

## 阶段五：恋爱-首页仪表盘

- [ ] 5.1 设计 home.types.ts 类型
- [ ] 5.2 实现 StatusBar 组件（设置/查看状态）
- [ ] 5.3 实现 Countdown 组件（见面倒计时）
- [ ] 5.4 实现今日碎片预览
- [ ] 5.5 实现 HomePage 页面

## 阶段六：恋爱-日常互动

- [ ] 6.1 设计 topics.types.ts、wall.types.ts 类型
- [ ] 6.2 实现每日话题逻辑（每日选题 + 互答可见）
- [ ] 6.3 实现 TopicsPage 页面
- [ ] 6.4 实现时光便签 CRUD（文字/图片/语音）
- [ ] 6.5 实现 WallPage 页面

## 阶段七：恋爱-见面规划

- [ ] 7.1 设计 meet.types.ts 类型
- [ ] 7.2 实现 StepCalendar（时间协调 + 日历勾选）
- [ ] 7.3 实现 StepTravel（车次推荐 + 酒店推荐）
- [ ] 7.4 实现 StepTimePlan（学习/约会时间分配）
- [ ] 7.5 实现 StepDateIdeas（约会点子库）
- [ ] 7.6 实现 MeetPage（四步向导容器）
- [ ] 7.7 实现历史见面记录（回忆）

## 阶段八：UI 打磨 + 部署

- [ ] 8.1 响应式适配验证（手机/平板/PC）
- [ ] 8.2 整体 UI 风格统一 + 过渡动画
- [ ] 8.3 部署到 Vercel
- [ ] 8.4 端到端测试（双账号）
