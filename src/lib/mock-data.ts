export const targets = {
  role: "前端工程师",
  level: "中高级",
  deadline: "9 天后",
  stack: ["React", "Next.js", "TypeScript", "性能优化"]
};

export const todayTasks = [
  { title: "复述 React Server Components", tag: "技术概念", state: "待训练", href: "/questions/next-app-router" },
  {
    title: "准备项目难点追问",
    tag: "项目经历",
    state: "薄弱警报",
    href: "/questions/performance-project"
  },
  { title: "重练缓存设计题", tag: "系统设计", state: "复习到期", href: "/questions" }
];

export const weakAreas = [
  { name: "浏览器渲染", score: 48 },
  { name: "工程化取舍", score: 55 },
  { name: "项目复盘表达", score: 42 }
];

export const candidateQuestions = [
  {
    id: "next-app-router",
    type: "qa",
    typeLabel: "问答题",
    title: "Next.js App Router 相比 Pages Router 的核心变化是什么？",
    source: "岗位目标",
    difficulty: "中等",
    tags: ["Next.js", "路由", "服务端组件"],
    answer: "App Router 用文件夹组织布局、加载和错误状态，并默认支持 Server Components，让数据获取和渲染边界更贴近页面结构。",
    spokenAnswer: "我会先讲它不只是换了目录，而是把布局、服务端组件和数据获取方式一起换了。面试里我会补充迁移时要注意缓存、客户端组件边界和路由层级。"
  },
  {
    id: "performance-project",
    type: "qa",
    typeLabel: "问答题",
    title: "你在项目里如何定位一次首屏性能问题？",
    source: "项目笔记",
    difficulty: "偏难",
    tags: ["性能优化", "项目复盘", "监控"],
    answer: "先用真实指标确认是 LCP、TTFB、资源体积还是渲染阻塞，再结合瀑布图、性能面板和线上监控定位瓶颈。",
    spokenAnswer: "我不会一上来就说压缩代码，而是先拆指标。比如首屏慢可能是接口慢、图片大、JS 阻塞或服务端渲染慢，定位清楚再选优化手段。"
  },
  {
    id: "frontend-degrade",
    type: "single_choice",
    typeLabel: "选择题",
    title: "如果接口偶发超时，你会怎么设计前端降级方案？",
    source: "补薄弱点",
    difficulty: "偏难",
    tags: ["稳定性", "降级", "用户体验"],
    options: [
      { key: "A", text: "所有接口都无限重试，直到请求成功" },
      { key: "B", text: "按业务重要性设计重试、缓存兜底、部分渲染和错误提示" },
      { key: "C", text: "直接隐藏所有依赖接口的模块，避免用户看到错误" },
      { key: "D", text: "只把超时时间调大，不需要额外监控" }
    ],
    answerOption: "B",
    mockSelectedOption: "C",
    explanation: "偶发超时要先区分核心链路和非核心模块，再组合重试、缓存、降级展示和监控，不能只靠无限重试或拉长超时。"
  },
  {
    id: "star-conflict",
    type: "behavior_star",
    typeLabel: "STAR/行为题",
    title: "讲一次你和后端或产品对方案有分歧时，是怎么推进的？",
    source: "行为面试",
    difficulty: "中等",
    tags: ["STAR", "协作", "沟通"],
    answer: "按 STAR 回答：先说明项目背景和分歧点，再讲自己负责的目标、如何用数据和原型推动对齐，最后补充结果和复盘。",
    spokenAnswer: "我会先说清楚冲突不是人和人的问题，而是目标和约束不同。然后讲我怎么把争议拆成可验证的问题，最后用结果说明推进方式有效。"
  }
];

export const documents = [
  {
    id: "frontend-jd",
    name: "前端工程师 JD.md",
    type: "JD",
    status: "已解析",
    linked: 12,
    summary: "岗位强调 React、Next.js、性能优化和工程化协作，适合生成框架原理与项目追问题。",
    knowledgePoints: ["React 组件模型", "Next.js 路由与渲染", "性能优化指标"],
    projectPoints: ["中后台复杂表单", "前端工程化协作"],
    generationDirections: ["框架原理问答", "性能优化选择题", "项目经历追问"],
    relatedQuestionIds: ["next-app-router", "frontend-degrade"]
  },
  {
    id: "project-notes",
    name: "项目复盘笔记.md",
    type: "项目笔记",
    status: "待补题",
    linked: 8,
    summary: "包含首屏性能、接口降级和组件重构经历，需要补充可量化结果和追问风险。",
    knowledgePoints: ["LCP/TTFB 定位", "接口降级", "组件拆分边界"],
    projectPoints: ["首屏加载优化", "异常链路兜底", "重构收益复盘"],
    generationDirections: ["项目复盘问答", "稳定性场景题", "工程取舍追问"],
    relatedQuestionIds: ["performance-project", "frontend-degrade"]
  },
  {
    id: "resume",
    name: "个人简历.pdf",
    type: "简历",
    status: "已上传",
    linked: 6,
    summary: "简历突出中后台项目经验，后续可以围绕业务复杂度、协作和技术取舍生成题目。",
    knowledgePoints: ["业务建模", "权限与表格交互", "团队协作表达"],
    projectPoints: ["后台系统建设", "跨角色协作", "技术方案取舍"],
    generationDirections: ["简历深挖题", "行为面试题", "项目难点追问"],
    relatedQuestionIds: ["performance-project"]
  }
];

export const practiceFeedback = {
  question: "你如何解释 React 中 useMemo 的使用边界？",
  score: 76,
  missing: ["没有说明缓存本身也有成本", "没有结合真实渲染瓶颈判断"],
  followups: ["如果依赖项是对象，如何避免缓存失效？", "什么时候应该删掉 useMemo？"],
  suggestion: "下次回答先讲判断标准，再给项目例子，最后补一句不要为了代码整洁滥用缓存。"
};
