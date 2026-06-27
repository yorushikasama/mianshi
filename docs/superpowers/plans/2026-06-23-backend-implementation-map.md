# 后端实现对照清单

状态：待实现  
日期：2026-06-23

目标：前端页面已经基本定型，后端接入时按这个清单补数据、API 和持久化，避免重新设计页面。

## 1. 账号与会话

对应页面：

- `/login`
- `/register`
- `/forgot-password`
- `/settings/profile`
- `/settings/email`
- `/settings/password`

需要实现：

- 用户注册、登录、退出。
- 找回密码邮件验证码。
- 邮箱验证码。
- 修改用户名、头像、邮箱、密码。
- 服务端会话校验，工作台页面登录后访问。

对应表：

- `"user"`
- `"session"`
- `"account"`
- `"verification"`

暂不做：

- 管理后台。
- 登录状态管理独立页。
- 多设备会话列表。

## 2. 面试目标

对应页面：

- `/dashboard`
- `/generate`

需要实现：

- 读取当前用户默认面试目标。
- 保存岗位、级别、技术栈、面试时间。
- AI 生成页默认带入当前目标。

对应表：

- `interview_targets`

暂不做：

- 独立目标方向管理页。
- 多目标复杂切换。

## 3. 资料与文件解析

对应页面：

- `/materials`
- `/materials/[materialId]`
- `/generate?material=...`

需要实现：

- 上传简历、JD、项目笔记、复习资料。
- 保存文件元数据和存储路径。
- 解析状态：上传中、解析中、解析失败、已解析。
- 保存解析摘要、知识点、项目点、可生成方向。
- 从资料详情跳 AI 生成时带入资料来源。

对应表：

- `source_documents`

暂不做：

- 文件二进制入库。
- 复杂文件管理器。

## 4. AI 生成与题库入库

对应页面：

- `/generate`
- `/questions`
- `/questions/[questionId]`

需要实现：

- 按目标生成候选题。
- 按资料生成候选题。
- AI 自动标注题型：问答题、选择题、STAR/行为题。
- 保存一次生成批次。
- 候选题批量确认入库。
- 题库筛选：来源、难度、状态、题型。
- 题库单题编辑、归档、恢复、删除。

对应表：

- `generated_question_sets`
- `questions`
- `answer_versions`

暂不做：

- 独立批量导入编辑器。
- 用户逐题手动创建主流程。

## 5. 练习、结果与复习计划

对应页面：

- `/practice`
- `/practice/[questionId]`
- `/practice/[questionId]/result`
- `/practice/history`
- `/practice/review`

需要实现：

- 按题开始练习。
- 问答题保存文本回答。
- 选择题保存用户选项并判定正确/错误。
- STAR/行为题复用问答题提交链路。
- 保存练习记录。
- 保存 AI 反馈：评分、遗漏点、追问风险、建议。
- 保存复习状态：掌握、错题、下次复习。
- 复习计划筛选：全部、复习到期、错题、薄弱点题。
- 练习历史按时间倒序展示。

对应表：

- `practice_attempts`
- `ai_reviews`
- `review_states`

暂不做：

- 语音练习。
- 复杂学习计划系统。
- 拖拽排序。

## 6. AI Provider 配置

对应页面：

- `/settings`
- `/settings/ai-provider`

需要实现：

- 一个用户保存多个 Provider。
- 字段：名称、供应商格式、Base URL、API Key、默认模型。
- 只能激活一个 Provider 作为默认调用配置。
- API Key 服务端加密保存。
- 测试连接接口。
- LiteLLM Proxy 统一适配 OpenAI Compatible、Anthropic、Gemini、自定义网关。

需要新增表：

- `ai_provider_configs`

建议字段：

- `id`
- `user_id`
- `name`
- `provider_format`
- `base_url`
- `model`
- `encrypted_api_key`
- `is_active`
- `status`
- `created_at`
- `updated_at`

暂不做：

- 平台额度。
- 支付、充值、套餐。
- 在浏览器里真实保存可调用 API Key。

## 7. Dashboard 数据

对应页面：

- `/dashboard`

需要实现：

- 今日待练数量。
- 复习到期数量。
- 题库数量。
- 资料数量。
- AI 接入状态。
- 最近练习。
- 复习压力。
- 近 7 天练习趋势。
- 薄弱点分布。

数据来源：

- `questions`
- `source_documents`
- `practice_attempts`
- `ai_reviews`
- `review_states`
- `ai_provider_configs`

暂缓：

- 图表 tooltip、时间范围筛选、题型筛选。
- 图表缩放、悬浮详情、多指标切换。

## 8. API 顺序建议

1. Auth：先让工作台能识别当前用户。
2. AI Provider：先保存多个配置并激活一个。
3. 面试目标：Dashboard 和 AI 生成共用目标。
4. 资料上传：先保存文件和解析状态。
5. AI 生成：先生成候选题和批次。
6. 题库：确认入库、筛选、编辑状态。
7. 练习：提交、结果、复习状态。
8. Dashboard：最后汇总真实数据。

## 9. 不做清单

- 支付、充值、套餐。
- 管理后台。
- 公开题库社区。
- 实时面试辅助。
- new-api 账号打通或源码改造。
- 单独目标方向管理页。
- 单独批量导入编辑器。
