# 轻量级 AI API 中转/订阅管理服务调研

> 调研时间：2026-05-21
> 调研人：码飞（技术总监）
> 背景：Sub2API（Go+PostgreSQL+Redis）太重，无法部署到 Vercel，需要调研轻量级替代方案

---

## 一、调研范围

搜索 GitHub 上的 API 中转/订阅管理/多 Key 轮换项目，重点关注：
- 能部署到 Vercel / Cloudflare Workers / Railway 等 PaaS
- 技术栈轻量（不需要 PostgreSQL/Redis）
- 支持主流 AI API（OpenAI/Claude/DeepSeek 等）
- 有订阅管理/额度控制/Key 轮换功能
- 个人使用场景友好

---

## 二、项目对比表

| 项目 | GitHub | ⭐ Stars | 技术栈 | 支持 Vercel | 核心功能 | 优点 | 缺点 |
|------|--------|---------|--------|------------|---------|------|------|
| **QuantumNous/new-api** | [QuantumNous/new-api](https://github.com/QuantumNous/new-api) | ~34,500 | Go + React + SQLite/MySQL/PG | ❌ 需要 Go 二进制或 Docker | Key 轮换 ✅ 订阅管理 ✅ 额度控制 ✅ 计费开票 ✅ | 最活跃的 fork，功能最全，UI 好，支持 Claude/Gemini/DeepSeek，社区大 | 需要数据库，无法部署到 Vercel，对个人使用略重 |
| **songquanpeng/one-api** | [songquanpeng/one-api](https://github.com/songquanpeng/one-api) | ~34,000 | Go + React + SQLite/MySQL/PG | ❌ 需要 Go 二进制或 Docker | Key 轮换 ✅ 订阅管理 ✅ 额度控制 ✅ | 最成熟，文档最多，社区最大 | **已停止维护**（~1年无更新），功能被 new-api 超越 |
| **labring/FastGPT** | [labring/FastGPT](https://github.com/labring/FastGPT) | ~28,100 | Node.js (Next.js) + MongoDB | ❌ 需要 MongoDB + Docker | Key 轮换 ✅ 可视化工作流 ✅ RAG ✅ | 可视化工作流构建器，RAG 知识库，专业级 | 太重了，不是纯 API 管理工具，需要 MongoDB |
| **lanqian528/chat2api** | [lanqian528/chat2api](https://github.com/lanqian528/chat2api) | ~3,600 | Python (FastAPI) | ⚠️ 有 Vercel 部署选项 | Token 池轮换 ✅ | 轻量，有 Vercel 部署选项，ChatGPT Web 转 API | 逆向工程方案（不稳定），无订阅管理，已停止维护 |
| **MartialBE/one-hub** | [MartialBE/one-hub](https://github.com/MartialBE/one-hub) | ~2,800 | Go + React + SQLite/MySQL/PG | ❌ 需要 Go 二进制或 Docker | Key 轮换 ✅ 订阅管理 ✅ 额度控制 ✅ 月度账单 ✅ | 统计分析更好，函数调用优化，月度账单，计费标签 | 需要数据库，社区较小 |
| **Veloera/Veloera** | [Veloera/Veloera](https://github.com/Veloera/Veloera) | ~1,700 | Go + React + DB (new-api fork) | ❌ 需要 Go 二进制或 Docker | Key 轮换 ✅ 订阅管理 ✅ 额度控制 ✅ | 现代化 UI，活跃开发，new-api 的新 fork | 需要数据库，社区较小 |
| **souying/vercel-api-proxy** | [souying/vercel-api-proxy](https://github.com/souying/vercel-api-proxy) | ~467 | JavaScript (Vercel Edge) | ✅ 原生 Vercel 部署 | 纯反向代理 | 极其简单，免费 Vercel 部署 | **无 Key 轮换、无订阅管理、无额度控制**，已停止维护 |
| **ultrasev/llmproxy-vercel** | [ultrasev/llmproxy-vercel](https://github.com/ultrasev/llmproxy-vercel) | ~55 | JavaScript (Vercel Edge) | ✅ 原生 Vercel 部署 | 多提供商代理（OpenAI/Groq 等） | 轻量，支持多提供商 | **无管理功能**，纯代理 |
| **lopins/serverless-api-proxy** | [lopins/serverless-api-proxy](https://github.com/lopins/serverless-api-proxy) | ~20 | JavaScript (CF Workers/Vercel) | ✅ 支持 Vercel/CF Workers | 多提供商路由 | 部署灵活，支持多平台 | **无 Key 轮换、无订阅管理**，非常简单 |
| **sigazen/api-proxy** | [sigazen/api-proxy](https://github.com/sigazen/api-proxy) | ~5 | JavaScript (Vercel Serverless) | ✅ 原生 Vercel 部署 | 多 Key 轮换 + OpenAI 兼容 | 轻量，有基础 Key 轮换 | **无订阅管理**，功能极简 |

---

## 三、核心发现

### ⚠️ 生态存在明显断层

```
功能完整 ◄─────────────────────────────────────────► 部署轻量

  new-api ★★★★★                                    Vercel ★★★★★
  one-hub ★★★★        ← 中间地带几乎空白 →          CF Workers ★★★★★
  Veloera ★★★★                                      Railway ★★★★
  (全部需要 Go + DB)                                (全部无管理功能)
```

**结论：目前不存在同时满足"功能完整 + Vercel 部署"的开源项目。**

- **功能完整的项目**（one-api、new-api、one-hub、Veloera）全部基于 Go，需要数据库，无法部署到 Vercel/CF Workers
- **能部署到 Vercel 的项目**（vercel-api-proxy、llmproxy-vercel、serverless-api-proxy）都是简单反向代理，没有 Key 轮换、订阅管理、额度控制

---

## 四、TOP 3 推荐方案

### 🥇 推荐 1：QuantumNous/new-api（部署到 Railway）

| 项目 | 详情 |
|------|------|
| GitHub | https://github.com/QuantumNous/new-api |
| Stars | ~34,500 |
| 技术栈 | Go + React + SQLite（可选 MySQL/PG） |
| 部署方式 | **Railway**（一键部署，$5/月起）或自建 VPS + Docker |
| 核心功能 | 多渠道 Key 轮换、用户管理、Token 体系、额度控制、计费开票、Claude/Gemini/DeepSeek 支持 |
| 个人适用性 | ⭐⭐⭐⭐⭐ 功能最全，社区最大，持续维护 |

**推荐理由：**
- 功能最完整，覆盖所有需求
- 社区最活跃，遇到问题容易找到解决方案
- SQLite 模式下不需要额外数据库服务
- Railway 一键部署，运维成本低
- 支持所有主流 AI API，包括最新的 Claude 4、Gemini 2.5

**部署命令（Docker）：**
```bash
docker run -d \
  --name new-api \
  -p 3000:3000 \
  -v /data/new-api:/data \
  calciumion/new-api:latest
```

---

### 🥈 推荐 2：Veloera（部署到 Railway）

| 项目 | 详情 |
|------|------|
| GitHub | https://github.com/Veloera/Veloera |
| Stars | ~1,700 |
| 技术栈 | Go + React + DB（new-api fork） |
| 部署方式 | **Railway** 或自建 VPS + Docker |
| 核心功能 | Key 轮换、订阅管理、额度控制、现代化 UI |
| 个人适用性 | ⭐⭐⭐⭐ UI 更现代，功能齐全 |

**推荐理由：**
- new-api 的现代化 fork，UI 更好看
- 积极开发中，commit 活跃
- 如果觉得 new-api 太"老"，这是更好的选择
- 功能和 new-api 基本一致

---

### 🥉 推荐 3：自建轻量方案（Vercel Edge + Vercel KV）

| 项目 | 详情 |
|------|------|
| 方案 | 自建，基于 Vercel Edge Functions + Vercel KV |
| 技术栈 | TypeScript + Vercel Edge Runtime + Vercel KV (Redis) |
| 部署方式 | **Vercel**（免费额度足够个人使用） |
| 核心功能 | 按需定制：Key 轮换 + 额度追踪 + 简单管理面板 |
| 个人适用性 | ⭐⭐⭐⭐ 最轻量，完全可控，但需要开发 |

**推荐理由：**
- 唯一能真正部署到 Vercel 的完整方案
- Vercel 免费额度足够个人使用（100K 请求/月）
- Edge Runtime 性能极佳，延迟低
- 可以参考 [sigazen/api-proxy](https://github.com/sigazen/api-proxy) 作为起点
- 开发工作量约 2-3 天

**技术架构：**
```
用户请求 → Vercel Edge Function → Key 轮换逻辑 → 上游 AI API
                              ↕
                         Vercel KV (Redis)
                         - Key 池管理
                         - 使用量追踪
                         - 简单额度控制
```

**参考项目：**
- 起点代码：https://github.com/sigazen/api-proxy（有基础 Key 轮换）
- Vercel KV 文档：https://vercel.com/docs/storage/vercel-kv

---

## 五、各场景推荐

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| **想要开箱即用，功能全** | 🥇 new-api + Railway | 最成熟，功能最全，一键部署 |
| **喜欢现代化 UI** | 🥈 Veloera + Railway | new-api 的现代化 fork |
| **必须部署到 Vercel** | 🥉 自建 Vercel Edge 方案 | 唯一可行的 Vercel 方案 |
| **极简需求，只要代理** | vercel-api-proxy | 5 分钟部署，但无管理功能 |
| **企业级/团队使用** | new-api + 自建 VPS | 最稳定，支持多人 |

---

## 六、总结

**Boss 的需求是：Sub2API 太重，想找能部署到 Vercel 的轻量替代。**

现实情况是：**功能完整的 API 管理工具目前没有能直接部署到 Vercel 的**。原因是 Vercel 的 Serverless 运行时无法运行 Go 二进制，而这类工具的核心（Key 轮换 + 订阅管理 + 额度控制）需要状态管理，纯 Edge Function 不够用。

**我的建议：**

1. **短期方案**：用 **new-api** 部署到 Railway（$5/月），功能最全，10 分钟搞定
2. **长期方案**：如果一定要 Vercel，我可以花 2-3 天基于 Vercel Edge + KV 自建一个轻量版
3. **折中方案**：用 Veloera 部署到 Railway，UI 更好看，功能一样全

**不推荐**：one-api（已停止维护）、FastGPT（太重）、chat2api（逆向工程不稳定）

---

*报告由码飞生成，如有疑问随时沟通。*
