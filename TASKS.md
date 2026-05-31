# 待完成计划

> 创建时间: 2026-05-30
> 最后更新: 2026-05-31
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

- [ ] 5.1 设计 home.types.ts
- [ ] 5.2 实现 StatusBar 组件
- [ ] 5.3 实现 Countdown 组件
- [ ] 5.4 实现 HomePage 页面

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
- [x] 8.2 部署到 Vercel（https://we-xi-five.vercel.app）
- [x] 8.3 部署到 Netlify（https://we-app-181.netlify.app，主力，国内可访问）
- [x] 8.4 移动端触摸交互优化
- [x] 8.5 性能优化（即时翻卡 + 并行加载总词库）
- [ ] 8.6 伴侣关联功能
- [ ] 8.7 互动出题启用
