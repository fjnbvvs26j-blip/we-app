# 项目开发规范

> **「我们」— 考研+异地恋 双模块软件**
> 技术栈: Vite + React 18 + TypeScript + Tailwind CSS v4 + React Router v6 + Supabase
> 部署: Cloudflare Pages + Functions

---

## 一、开发黄金法则

### 1.1 三层粒度拆解

每个功能按此粒度由大到小拆解，**禁止一次性做超过 2 小时才能完成的任务**：

```
功能 (Feature)         →  2~4 天
  └─ 子任务 (Task)     →  2~4 小时
      └─ 步骤 (Step)   →  15~30 分钟
```

**检查标准**：一个子任务如果 2 小时内做不完 → 继续拆。拆到你认为"这也太简单了吧"的程度就对了。

### 1.2 每个功能的四步模板

```
1. types  →  定义数据接口          (5 分钟)
2. service → 数据访问层 (Supabase)  (15 分钟)
3. component → UI 组件             (30~60 分钟)
4. page   → 组合 + 路由注册        (10 分钟)
```

**不允许跳过或合并**。哪怕再简单的功能也至少保持 `types + service + component` 三层分离。

### 1.3 可验证才有价值

每个子任务完成后必须有**肉眼可见的产出**：
- ✅ 组件能在浏览器中渲染
- ✅ 数据能从 Supabase 读取/写入
- ✅ 交互反馈（点击/输入/滑动）有效
- ✅ 错误状态不白屏

"我代码写完了只是还没运行" = **没完成**。

---

## 二、架构规范

### 2.1 目录结构

```
src/
├── App.tsx                       # 路由 + 页面组合
├── main.tsx                      # 入口
├── index.css                     # 全局样式 + 设计系统变量
├── features/                     # 按功能模块组织
│   ├── auth/                     # 认证
│   │   ├── auth.types.ts         # 类型定义
│   │   ├── auth.service.ts       # 数据访问
│   │   ├── AuthPage.tsx          # 页面组件
│   │   └── components/           # (可选) 子组件
│   ├── vocab/                    # 单词模块
│   ├── home/                     # 首页仪表盘
│   ├── topics/                   # (未来) 每日话题
│   ├── wall/                     # (未来) 时光便签
│   ├── meet/                     # (未来) 见面规划
│   └── math/                     # (未来) 考研数学
└── shared/                       # 跨模块共享
    ├── types/                    # 全局类型
    ├── lib/                      # 基础设施 (supabase client 等)
    ├── hooks/                    # 全局 hooks (useAuth 等)
    └── components/               # 通用组件 (BottomNav 等)
```

### 2.2 文件命名约定

| 文件类型 | 命名规则 | 示例 |
|---------|---------|------|
| 类型定义 | `*.types.ts` | `vocab.types.ts` |
| 数据服务 | `*.service.ts` | `vocab.service.ts` |
| 页面组件 | PascalCasePage | `VocabPage.tsx` |
| 通用组件 | PascalCase | `FlashCard.tsx` |
| 子组件 | PascalCase | `StatusBar.tsx` |
| 基础设施 | camelCase | `supabase.ts` |

### 2.3 编码纪律

- **类型优先**：所有 Supabase 返回数据必须有 TypeScript 类型，禁止 `as any`
- **service 层不碰 UI**：service 函数只返回数据、抛出异常，不做 toast/modal
- **组件 only 职责**：组件只负责渲染 + 交互，不直接调 Supabase SDK（走 service）
- **错误冒泡**：service 层抛 Error，组件层 try/catch + 显示友好提示

---

## 三、开发节奏

### 3.1 单次开发 session 的标准流程

```
1. 看 TASKS.md → 找到当前优先级最高的未完成任务
2. 拆成 2 个以内的子任务（确保能完成）
3. 执行：types → service → component → page
4. 验证：确认功能在浏览器中可用
5. 更新 TASKS.md（打勾）+ DEVLOG.md（记录变更）
6. git commit + push（原子提交）
```

### 3.2 提交规范

```
<type>(<scope>): <描述>

类型: feat / fix / docs / refactor / perf / chore
范围: vocab / home / auth / topics / meet / math / infra / docs

示例:
feat(vocab): 互动出题入口接入底部导航
fix(home): 伴侣状态更新后不刷新
docs: 更新 TASKS + DEVLOG
```

**每个 commit 只做一件事**。如果改了 3 个不相关的文件 → 拆 3 个 commit。

### 3.3 每日必做

- [ ] 开始前: 读 `TASKS.md` + `DEVLOG.md` 了解上下文
- [ ] 完成时: 更新 TASKS.md（打勾）+ 写一行 DEVLOG
- [ ] 收尾: `git push`（确保 Cloudflare 自动部署触发）
- [ ] **关键操作留痕：** 每次 session 将未来可能复用的操作信息（API 端点/Token/已知约束/排查过的坑）写入 DEVLOG.md「关键操作速查」一节，避免后续 session 重复排查

---

## 四、技术决策参考

### 4.1 Supabase 操作模式

```
读取数据   → supabase.from('table').select().eq()
写入数据   → supabase.from('table').upsert() / .insert()
RPC调用    → supabase.rpc('function_name', { args })
错误展示   → 显示 error.message 让用户看到具体问题
超时保护   → 20s AbortController + 30s 硬兜底
```

### 4.2 UI 设计系统

- **配色**：奶油纸 `#FCF7F0`、暖棕 `#2C1810`/`#5C3D2E`、陶土橙 `#B8652B`、鼠尾草绿 `#6B8F71`
- **字体**：Playfair Display（英文装饰）、Noto Serif SC（中文正文）、Figtree（UI）
- **复用类**：`card-warm` / `input-warm` / `btn-primary` / `btn-secondary`
- **动画**：`animate-fade-up` / `animate-scale-in` / `animate-number-pop` / `stagger`
- **布局**：移动端优先 + `safe-bottom`（底部导航安全区域）

### 4.3 路由规则

```
/auth  → AuthPage（未登录）
/      → HomePage（已登录，有底部导航）
/vocab → VocabPage（懒加载，有底部导航）
```

新增页面时：
1. 在 `App.tsx` 的 `LayoutWithNav` 路由组下加 `<Route>`（带底部导航）
2. 不要用 BrowserRouter（HashRouter，兼容静态主机）

### 4.4 当前已知约束

| 约束 | 说明 |
|------|------|
| Supabase 在国内 DNS 污染 | 所有请求走 Cloudflare Functions 代理 `/api/*` |
| 签名过长时截断示意 | 设计上简短明晰 |
| 移动端为主 | 触摸事件、安全区域、最小字号 11px |
| 离线无支持 | 所有操作依赖网络，超时展示友好提示 |

---

## 五、高效开发锦囊

### 5.1 避免常见陷阱

| 陷阱 | 解法 |
|------|------|
| 一次做太多 → 代码写一半卡住 | 拆成 ≤2 小时可完成的原子任务 |
| 不写类型 → `as any` 泛滥 | types 文件先写，再写实现 |
| 不验证就下一项 → 回头 debug 半天 | 每个组件写了立刻跑起来看 |
| 代码和已有风格不统一 | 先读同模块已有的文件找模式 |
| 页面卡死/白屏 | 全局 ErrorBoundary + 每个组件 try/catch |
| 超时后无限 loading | AbortController 20s + 30s 兜底 |

### 5.2 新功能开发速查

```
1. 问：有对应的数据库表吗？
   有 → 查 supabase/migrations/ 中的表结构
   无 → 先建 migration，再开发前端

2. 问：需要新的 Supabase RPC 吗？
   是 → 先在 SQL Editor 创建 function，然后前端调 supabase.rpc()

3. 问：API 需要伴侣可见吗？
   是 → 检查 RLS 策略是否已包含伴侣可见，否则加 migration

4. 问：这个组件/页面有 loading/empty/error 三种状态吗？
   否 → 补上。每个组件至少处理这三种状态。
```

### 5.3 调试快捷命令

```bash
npm run dev        # 本地开发 (localhost:5173)
npm run build      # 生产构建
# 部署
npm run build && npx wrangler pages deploy dist --project-name=we-app --branch=main
```

### 5.4 每周维护节奏（推荐）

| 日 | 内容 | 时长 |
|---|------|------|
| 周一 | 小增量：Bug 修复 + 小优化 | 30min |
| 周三 | 主要开发：1 个完整子任务 | 1~2h |
| 周五 | 收尾：整理 TASKS + DEVLOG + git push | 15min |

保持低频率、高产出、零压力。**这个项目没有 deadline，可持续性优先。**

---

## 六、工作流自动化

### 6.1 当我说"开始新功能"时

请 Claude 自动执行：
1. 读 TASKS.md → 定位下一个未完成任务
2. 读相关 DB migration 了解表结构
3. 读已有同类文件了解风格
4. 写出实现计划 → 等确认后执行

### 6.2 当我说"验证当前工作"时

请 Claude 自动执行：
1. 检查每个新文件是否有完整的 loading / empty / error 三态
2. 检查是否有 `as any` 或未使用的 import
3. 检查样式是否使用了设计系统变量而非硬编码颜色
4. 检查组件是否遵循了 `types → service → component → page` 路径
