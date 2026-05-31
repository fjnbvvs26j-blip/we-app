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
- **认证：** 极简邮箱登录，关闭邮件验证（`mailer_autoconfirm: true`）

### 已完成
1. ✅ 项目脚手架（Vite + React + TS + Tailwind）
2. ✅ Supabase 项目创建（Tokyo 区域，ref: `kcgkrgalxgparkryzbhj`）
3. ✅ 12 张数据库表 + 索引 + RLS 策略（`001_init.sql`）
4. ✅ Auto-profile 触发器（新用户注册自动创建 profile）
5. ✅ AuthPage（登录/注册切换）+ AuthProvider + 路由守卫
6. ✅ Supabase CLI 配置 + 迁移历史管理
7. ✅ 开发服务器运行在 localhost:5173

### 遇到的问题 & 解决
- **问题：** 脚手架工具因目录非空取消 → **解决：** 手动 `npm init` + 安装依赖
- **问题：** Node.js 未安装 → **解决：** `brew install node`
- **问题：** CLI 无法在非 TTY 环境登录 → **解决：** 用户生成 Personal Access Token
- **问题：** 首次 db push 因 RLS 策略已存在报错 → **解决：** `migration repair` 标记已执行

### 发现的问题 & 解决
- **问题：** Supabase Auth SDK 导致页面无限加载/空白 → **根因：** `getSession()` / `onAuthStateChange()` 调用挂起
- **解决：** 改用 localStorage 本地认证 + Supabase 仅做数据库，关闭 RLS，移除 auth.users 外键依赖
- **经验：** 对于 2 人小型 App，Supabase Auth 的复杂度远超价值，本地认证足够

---

## 2026-05-31 — 单词模块深度增强 + UI 美化

### SM-2 算法完善
- **忘记重置：** 之前认识的词又被标不认识 → review_count 归零，间隔从 4 小时重新开始
- **追踪拆分：** 在 vocab_progress.metadata 中记录 times_known / times_unknown，用于搜索和易错词本

### 学习体验优化
- **本轮完成页：** 最后一词划完后显示"本轮完成！🎉"，可选"继续背单词"或修改每轮数量
- **每轮词数可调：** 默认 10 词，点击可改（3-50），存 localStorage，修改后立即生效
- **每日目标：** 默认 20 词/天，点击数字可编辑，环形进度条实时显示百分比
- **连续打卡：** 每天首次学习自动记录，存在 localStorage

### 新功能
- **单词搜索：** 前缀匹配搜索，显示复习次数、✓认识/✗不认识计数、学习状态
- **易错词本：** 不认识 ≥2 次的词自动归入，按错误次数降序排列
- **周报：** 新 Tab，展示近 7 天每日柱状图（复习/新学），周总览统计

### 数据增强
- **英文例句：** 调用 Free Dictionary API，4214/5407 词获得例句 ✅
- **中文翻译：** 调用 Google Translate API，3142 条例句翻译中（后台运行，~700/3142）
- **考研真题频次：** 从 exam-data/NETEMVocabulary（5530 词、200+ 套试卷统计）导入，匹配 5301 词，正在逐条写入（~2000/5301）
- **一词多义：** 下载 ECDICT stardict.csv（77 万词），解析多义项，熟词僻义用 `**僻义**` 标粗，正在扫描匹配（222MB CSV）
- **数据存储：** exam_frequency 和 times_known/times_unknown 暂存于 JSONB metadata 字段，迁移 SQL 已写好可随时执行

### UI 美化（已完成）
- **设计方向：** 暖调书房 / 纸本笔记本 — 奶油纸色 `#FCF7F0`、暖棕墨水 `#2C1810`/`#5C3D2E`、陶土橙 `#B8652B`/`#D4874A`、鼠尾草绿 `#6B8F71`
- **字体：** Playfair Display（英文展示）+ Noto Serif SC（中文正文）+ Figtree（UI 标注）
- **CSS 设计系统：** 完整 CSS 变量体系、纸张纹理背景、`card-warm`/`btn-primary`/`btn-secondary`/`input-warm` 组件类、入场动画（fadeUp/scaleIn/stagger）
- **AuthPage 重写：** 暖色调卡片表单、装饰渐变光晕、角落金线、品牌区域设计
- **VocabPage 全面重写：** 统计卡片、打卡进度环、Tab 切换、搜索/易错/周报全部统一设计语言
- **FlashCard 重写：** 顶部/底部装饰线、精制正反面排版、纸质阴影、改进按钮样式
- **僻义渲染：** `**僻义**` 以陶土橙粗体显示，FlashCard 和搜索结果中均生效

### 新功能：统计卡片单词列表
- **学习中 / 待复习 / 已掌握 / 总词库** 统计卡片可点击，弹出对应单词列表
- **总词库** 按字母顺序排序，其余按复习次数排序
- **单词咨询弹窗：** 点击列表中单词可查看详情（音标、释义、例句、复习统计、频度标签）
- **翻页浏览：** 咨询弹窗支持「上一个 / 下一个」前后翻阅，显示当前页码
- **列表内搜索：** 顶部搜索框可实时过滤单词（匹配单词名或释义关键词）

### Supabase 性能修复
- **1000 行限制绕过：** Supabase 默认单次最多 1000 行 → 重写 `getAllWordsSorted` 为分页串行，确保所有词都被取回
- **加载速度优化：** 从逐批串行（34 轮网络请求）→ 全并行（2 轮网络等待），5000 词加载从 ~3-5 秒降至 ~300-500ms

### Bug 修复
- **柱状图超出方框：** 容器加 `overflow-hidden` + 高度算法改为按总和最大值等比缩放
- **柱状图颜色不可见：** `--color-warm-border` 几乎是白色 → 改为 `--color-terracotta-light` 和 `--color-sage`

### Claude Code Skills 安装
- 克隆 anthropics/skills（117k ⭐），symlink 到 .claude/skills/
- 17 个官方 Skill 可用，含 frontend-design、web-artifacts-builder、webapp-testing
- frontend-design 技能指导了本次 UI 美化的设计方向

### 下一步
- 等待后台任务完成（例句翻译、词频导入、多义项更新）
- 添加伴侣关联功能
- 启用互动出题
