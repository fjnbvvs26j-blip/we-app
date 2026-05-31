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
- **主力：** https://we-app-181.netlify.app
- 备用：https://we-xi-five.vercel.app（需 VPN）

### Supabase 项目
- **Dashboard：** https://supabase.com/dashboard/project/kcgkrgalxgparkryzbhj
- **SQL Editor：** 用于执行迁移和查询

### 下一步
- 添加伴侣关联功能
- 启用互动出题
- 考研数学模块
- 恋爱互动模块
