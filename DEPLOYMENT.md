# Cloudflare 部署说明

本仓库把网页构建为 Cloudflare Worker，并绑定一个名为 `DB` 的 D1 数据库。D1 用于缓存动态事件；应用首次访问实时事件接口时会自动创建所需表和索引。

## 1. 准备 Cloudflare 资源

安装依赖并登录：

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm wrangler login
```

创建 D1 数据库。`apac` 是面向亚洲用户的可选位置提示，也可以省略：

```bash
pnpm wrangler d1 create pr-pulse-2026 --location=apac
```

保存命令输出中的 `database_id`。如果你已有数据库，可执行 `pnpm wrangler d1 list` 查询。

## 2. 配置 GitHub

在仓库的 **Settings → Secrets and variables → Actions** 中添加：

### Secrets

| 名称 | 内容 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token。应限制在目标账号，并包含部署 Worker 与使用 D1 所需权限。 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID。 |

不要把这两个值放进代码、`.env` 或 Git 提交中。

### Variables

| 名称 | 是否必填 | 示例 |
| --- | --- | --- |
| `CLOUDFLARE_D1_DATABASE_ID` | 是 | 创建 D1 后得到的 UUID |
| `SITE_ORIGIN` | 是 | `https://pr-pulse-2026.example.workers.dev` |
| `CLOUDFLARE_D1_DATABASE_NAME` | 否 | `pr-pulse-2026` |
| `CLOUDFLARE_WORKER_NAME` | 否 | `pr-pulse-2026` |

`SITE_ORIGIN` 用于网页的 Open Graph 分享地址。首次部署前若还不知道 Workers 域名，可以先按 Cloudflare 账号的 workers.dev 子域填写预期地址；部署后如实际地址不同，修正变量并重新运行工作流。

## 3. 部署

进入 GitHub 仓库的 **Actions** 页面，选择 **Deploy to Cloudflare**，点击 **Run workflow**。工作流会：

1. 安装锁定版本依赖。
2. 检查 D1 ID 与站点地址。
3. 使用这些变量生成 Worker 配置并完成生产构建。
4. 通过 Cloudflare 官方 Wrangler Action 发布。

如需在本机部署，可在 `.env.local` 填入实际 D1 参数后执行：

```bash
pnpm deploy
```

## 4. 验证

部署完成后检查：

- 首页能正常打开，日历中有固定节点和肃穆提醒。
- “重大事件”页签可以获取动态结果或显示“暂无达到阈值的事件”。
- 请求 `/api/events?refresh=1` 后返回 JSON，字段中包含 `coverage`。
- Cloudflare D1 控制台出现 `live_events` 表。

## 5. 安全与数据边界

- API Token 只存放在 GitHub Actions Secrets 中，并尽可能限制账号与权限范围。
- GDELT 是公开新闻索引。它可能遗漏来源、延迟收录或产生误判，不能替代人工核查。
- 全国或属地禁娱、哀悼安排必须以正式公告为准，不应只依赖本项目中的预设提醒。
