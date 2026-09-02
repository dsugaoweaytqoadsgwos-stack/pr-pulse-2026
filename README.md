# PR Pulse 2026｜中国公关风险日历

一个可以直接上传到 GitHub、并部署到 Cloudflare Workers 的 2026 年公关工作日历。网页整合了原始 Excel 中的公关节点、中国重要纪念与肃穆提醒，以及基于 GDELT 公开新闻索引的重大社会事件动态监测。

![PR Pulse 2026 预览](public/og.png)

## 已包含的能力

- 363 条从 `source/2026年日历.xlsx` 标准化得到的 2026 公关日历事件。
- 重要纪念日与高风险日期提醒，并标注暂停娱乐化营销、提高审批等级等建议。
- 通过 GDELT 公共 API 检索重大社会事件，按来源权威度、独立来源数和风险词评分。
- Cloudflare D1 缓存实时事件，降低外部接口波动的影响。
- 桌面端与移动端自适应界面。
- GitHub Actions 自动构建检查，以及手动触发的 Cloudflare 部署流程。

> “实时全网”在本项目中指 GDELT 收录的公开新闻索引，并不是对互联网的穷尽检索。禁娱或暂停商业传播应始终以国家有关部门、属地政府和权威媒体的正式公告为准。

## 本地运行

环境要求：Node.js 22.13 或更高版本、pnpm 10。

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

打开 `http://localhost:3000`。本地 D1 由 Wrangler/Miniflare 模拟，不需要 Cloudflare 账号。

## 上传到 GitHub

1. 在 GitHub 新建一个空仓库，不勾选自动生成 README。
2. 解压本项目压缩包，把 `pr-pulse-2026` 文件夹内的全部内容推送到仓库。
3. GitHub Actions 中的 `Build` 工作流会在每次推送和 Pull Request 时执行类型检查与生产构建。

```bash
git init
git add .
git commit -m "Initial PR Pulse 2026 release"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git push -u origin main
```

## 部署到 Cloudflare

完整步骤见 [DEPLOYMENT.md](DEPLOYMENT.md)。最短流程如下：

1. 登录 Cloudflare 后创建 D1 数据库：`pnpm wrangler d1 create pr-pulse-2026 --location=apac`。
2. 在 GitHub 仓库中添加两个 Actions Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。
3. 添加 Actions Variables：`CLOUDFLARE_D1_DATABASE_ID` 和 `SITE_ORIGIN`；数据库名或 Worker 名不使用默认值时，再添加对应变量。
4. 打开 **Actions → Deploy to Cloudflare → Run workflow**。

部署流程不会把任何账号、令牌或当前私有站点绑定写进仓库。

## 数据与维护

- 固定日历数据：`lib/calendar-2026.json`
- 日历转换与风险提醒：`lib/calendar-data.ts`
- 实时事件检索与评分：`app/api/events/route.ts`
- 原始表格：`source/2026年日历.xlsx`
- D1 表结构：`drizzle/0000_sad_bullseye.sql`

实时接口默认缓存 30 分钟。页面中的“立即更新”会请求刷新，但外部源限流或不可用时会回退到 D1 中最近一次成功缓存。

## 技术栈

React 19、Vinext、Vite、Tailwind CSS、Cloudflare Workers、D1、Drizzle ORM、GDELT。

## 免责声明

本项目提供的是公关风险辅助信息，不构成法律、政策或舆情处置意见。社会事件的标题、来源与评分均需人工复核；正式传播决策应以权威公告和组织内部审批为准。
