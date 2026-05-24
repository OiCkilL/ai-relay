# AI Relay v2.1 功能改进 PRD

> 版本：v1.0  
> 作者：饼哥  
> 日期：2026-05-25  
> 状态：Draft

## 1. 背景

AI Relay 当前已经具备无服务器部署、OpenAI 兼容、多 Provider、多 Key 轮换、Fallback、后台管理等基础能力。

下一阶段的核心不是继续堆 Provider，而是提升用户从部署到生产可用的完整体验：

1. 部署后能快速跑通第一条请求
2. Provider 状态可感知、可诊断
3. 请求链路可追踪、问题可定位

## 2. 产品定位

AI Relay v2.1 定位为：

> 一个可以一键部署的 Serverless AI Gateway，帮助个人开发者和小团队稳定、低成本、可观测地管理多模型调用。

## 3. 目标

### 3.1 用户目标

- 新用户部署后 5 分钟内完成首条请求
- 管理员能快速判断 Provider 是否可用
- 出错时能通过日志定位问题原因

### 3.2 产品目标

- 提升部署后激活率
- 降低接入和排障成本
- 强化“生产可用”的产品感

## 4. 范围

### 本期包含

1. Setup Wizard：部署后引导配置和测试
2. Provider Health：Provider 健康状态面板
3. Request Logs：请求日志与错误追踪

### 本期不包含

- 多租户组织体系
- 计费和商业化
- 复杂规则引擎
- 完整成本中心
- 第三方告警 Webhook 扩展

## 5. 用户角色

| 角色 | 描述 | 核心诉求 |
|---|---|---|
| 个人开发者 | 自己部署自用 | 快速跑通、少维护 |
| 小团队管理员 | 给团队统一转发 AI 请求 | 稳定、可观测、可控 |
| 开源试用用户 | 从 GitHub 进入并部署 | 低门槛、明确下一步 |

## 6. 核心功能

## 6.1 Setup Wizard

### 目标

让用户部署完成后，按步骤完成配置并成功发起第一条请求。

### 入口

- Admin 首页顶部提示
- 首次登录后台自动展示
- 后续可从侧边栏“快速开始”进入

### 流程

1. 检查基础环境
   - Relay API Key 是否存在
   - Admin Key 是否存在
   - KV 是否可用
2. 添加 Provider Key
   - 选择 Provider
   - 填写 API Key
   - 点击测试连接
3. 生成调用示例
   - 展示 curl 示例
   - 展示 OpenAI SDK 示例
   - 自动填入当前部署域名
4. 发起测试请求
   - 用户输入一句测试 prompt
   - 系统请求 `/v1/chat/completions`
   - 展示响应、命中 Provider、耗时
5. 完成状态
   - 标记 Setup 完成
   - 跳转到 Dashboard

### 验收标准

- 用户能从 Admin 入口进入 Setup Wizard
- 系统能展示环境检查结果
- 用户能添加并测试 Provider Key
- 系统能生成可复制的 curl / OpenAI SDK 示例
- 用户能完成一次真实测试请求
- 完成后不再强制弹出，但可再次进入

## 6.2 Provider Health Dashboard

### 目标

让管理员一眼知道每个 Provider 当前是否可用，以及最近失败原因。

### 展示字段

| 字段 | 说明 |
|---|---|
| Provider | Provider 名称 |
| 状态 | 正常 / 波动 / 不可用 |
| 最近测试时间 | 最近一次健康检查时间 |
| 延迟 | 最近一次请求耗时 |
| 成功率 | 最近 N 次请求成功率 |
| 最近错误 | 最近一次错误摘要 |
| 可用 Key 数 | 当前可用 Key 数量 |
| 支持模型 | 已注册模型数量 |

### 状态规则

| 状态 | 规则 |
|---|---|
| 正常 | 最近测试成功，且成功率 >= 95% |
| 波动 | 最近测试成功，但成功率 < 95% 或延迟过高 |
| 不可用 | 最近测试失败，或连续失败超过阈值 |

### 操作

- 手动测试 Provider
- 查看最近错误
- 启用 / 禁用 Provider
- 查看关联 Key 状态

### 验收标准

- Admin 中存在 Provider Health 页面或模块
- 每个 Provider 显示状态、延迟、成功率、最近错误
- 支持手动触发健康检查
- 健康检查失败时能展示可读错误原因
- 状态变化不影响现有请求链路稳定性

## 6.3 Request Logs

### 目标

让管理员能追踪每一次请求，快速定位模型、Provider、Key、错误原因。

### 日志字段

| 字段 | 说明 |
|---|---|
| 时间 | 请求发生时间 |
| Trace ID | 单次请求唯一标识 |
| API Key | 使用的 Relay Key，脱敏展示 |
| Model | 请求模型 |
| Provider | 实际命中的 Provider |
| Status | 成功 / 失败 |
| HTTP Status | 返回状态码 |
| Latency | 总耗时 |
| Prompt Tokens | 输入 Token |
| Completion Tokens | 输出 Token |
| Error Type | 错误类型 |
| Error Message | 错误摘要，脱敏展示 |

### 筛选能力

- 按时间范围筛选
- 按 Provider 筛选
- 按模型筛选
- 按状态筛选
- 按 Trace ID 搜索

### 隐私与安全

- 默认不记录完整 prompt / completion
- API Key 必须脱敏
- 错误信息需过滤 Provider Key、Authorization 等敏感字段
- 日志保留周期默认 7 天，可配置

### 验收标准

- 请求成功和失败都能写入日志
- Admin 中可查看最近请求日志
- 支持基础筛选和 Trace ID 搜索
- 敏感字段不会明文展示
- 日志写入失败不影响主请求链路

## 7. 信息架构

Admin 建议结构：

```text
Dashboard
├── Overview
├── Setup Wizard
├── Provider Keys
├── Provider Health
├── Request Logs
├── Usage
├── Temporary Keys
└── Settings
```

## 8. 优先级

| 优先级 | 功能 | 说明 |
|---|---|---|
| P0 | Setup Wizard | 影响新用户激活 |
| P0 | Request Logs 基础版 | 影响排障能力 |
| P0 | Provider Health 基础状态 | 影响生产可用感 |
| P1 | 成功率 / 延迟趋势 | 增强诊断 |
| P1 | 日志高级筛选 | 提升管理效率 |
| P2 | 成本估算 | 后续成本中心基础 |
| P2 | 告警通知 | 后续运营能力 |

## 9. 指标

| 指标 | 定义 | 目标 |
|---|---|---|
| 首次请求成功率 | 部署后完成首条测试请求的用户比例 | 提升 |
| Time to First Request | 从进入 Admin 到首条请求成功耗时 | <= 5 分钟 |
| Provider 测试成功率 | 用户测试 Provider Key 的成功比例 | 提升 |
| 错误定位耗时 | 从错误发生到找到原因的时间 | 降低 |

## 10. 设计要求

- Setup Wizard 使用步骤条，降低配置焦虑
- Provider Health 使用状态色：绿色正常、黄色波动、红色不可用
- Request Logs 默认展示最近错误优先
- 移动端至少保证可查看关键状态

## 11. 技术约束

- 继续保持 Serverless / Edge 友好
- 日志写入不能显著增加主请求延迟
- KV 可作为 v2.1 默认存储
- 大规模日志分析不在本期范围
- 所有敏感数据必须脱敏

## 12. 风险

| 风险 | 影响 | 应对 |
|---|---|---|
| 日志写入拖慢请求 | 影响 API 性能 | 异步写入，失败降级 |
| Provider 错误格式不统一 | 错误难以归类 | 增加标准化错误类型 |
| KV 存储容量有限 | 日志增长受限 | 默认 7 天保留，只存摘要 |
| Setup 流程过长 | 用户放弃 | 控制在 4-5 步内 |

## 13. 里程碑

### M1：Setup Wizard MVP

- 环境检查
- Provider Key 添加与测试
- 示例代码生成
- 测试请求

### M2：Request Logs MVP

- 请求日志写入
- 基础列表展示
- 错误摘要
- Trace ID 搜索

### M3：Provider Health MVP

- Provider 状态列表
- 手动健康检查
- 最近错误和延迟展示

## 14. 验收结论

v2.1 完成后，AI Relay 应从“能部署、能转发”升级为：

> 部署后能快速跑通，运行中能看到状态，出错时能定位原因。

这是 AI Relay 从工具型项目走向生产可用网关的关键一步。
