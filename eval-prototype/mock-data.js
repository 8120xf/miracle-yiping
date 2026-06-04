/**
 * AI 译评工作台 · 一期原型 Mock（规则评测 + 发布管理）
 * 对齐 PRD v1.10 / Admin v1.9 · 统一 language_id
 */
window.EVAL_MOCK_INITIAL = {
  /** 平台内置系统提示词（专家仅可查看，不可编辑） */
  builtInSystem: {
    source_lang: "zh",
    preview:
      "You are a professional subtitle translator for short-form drama.\nFollow role, quality, and timing principles defined by the platform.\nLocale-specific rules are supplied in name_mapping and engineering blocks.",
  },

  languages: [
    {
      language_id: "lang_de_zh",
      source_lang: "zh",
      target_lang: "de",
      owner: "张雨时",
      status: "production",
      remark: "主线路；桃花马上、放手以后等剧已接入",
      created_at: "2026-03-12T08:00:00Z",
    },
    {
      language_id: "lang_es_zh",
      source_lang: "zh",
      target_lang: "es",
      owner: "张健",
      status: "staging",
      remark: "预发验证中",
      created_at: "2026-04-01T10:30:00Z",
    },
    {
      language_id: "lang_pt_zh",
      source_lang: "zh",
      target_lang: "pt",
      owner: "—",
      status: "none",
      remark: "新建语种壳",
      created_at: "2026-05-28T14:00:00Z",
    },
  ],

  /** 发布管理模块 · Prompt 版本库（原 Admin versions） */
  configVersions: [
    {
      admin_prompt_version_id: "apv-de-001",
      language_id: "lang_de_zh",
      version_label: "v1",
      source: "manual",
      changelog: "人工 PE 基线；三槽位初版",
      submitted_at: "2026-03-10T09:00:00Z",
      blocks: {
        system:
          "You are a professional subtitle translator from Chinese to German...",
        name_mapping: '{"李明":"Li Ming","王芳":"Wang Fang"}',
        engineering: "Output SRT format. Max 42 chars/line. Preserve timing codes.",
      },
      eval_task_id: null,
      eval_report_id: null,
      gate_result: "pass",
      eval_prompt_version_id: "epv-de-001",
    },
    {
      admin_prompt_version_id: "apv-de-002",
      language_id: "lang_de_zh",
      version_label: "v2",
      source: "eval_submit",
      changelog: "译评可用：11 维达标；name_mapping 优化",
      submitted_at: "2026-05-20T16:45:00Z",
      blocks: {
        system:
          "You are a senior DE translator for short drama. Tone: emotional, concise...",
        name_mapping:
          '{"李明":"Li Ming","王芳":"Wang Fang","陈总":"CEO Chen"}',
        engineering: "SRT; line break rules v2. Keep {{speaker}} tags.",
      },
      eval_task_id: "task-de-8821",
      eval_report_id: "report-de-4412",
      gate_result: "pass",
      eval_prompt_version_id: "epv-de-002",
    },
    {
      admin_prompt_version_id: "apv-es-001",
      language_id: "lang_es_zh",
      version_label: "v1",
      source: "eval_submit",
      changelog: "首次译评提交；staging 验证",
      submitted_at: "2026-04-18T11:00:00Z",
      blocks: {
        system: "Translate Chinese short drama subtitles to Spanish (ES)...",
        name_mapping: "{}",
        engineering: "SRT; max 2 lines per cue.",
      },
      eval_task_id: "eval-task-7102",
      eval_report_id: "report-3201",
      gate_result: "pass",
      eval_prompt_version_id: "epv-es-001",
    },
    {
      admin_prompt_version_id: "apv-pt-001",
      language_id: "lang_pt_zh",
      version_label: "v0.1",
      source: "eval_submit",
      changelog: "译评提交可应用后自动入库",
      submitted_at: "2026-05-30T09:12:00Z",
      blocks: {
        system: "Portuguese (BR) subtitle translator for C-drama...",
        name_mapping: '{"小美":"Xiaomei"}',
        engineering: "SRT output; preserve indices.",
      },
      eval_task_id: "eval-task-9901",
      eval_report_id: "report-5500",
      gate_result: "pass",
      eval_prompt_version_id: "epv-pt-001",
    },
  ],

  bindings: {
    lang_de_zh: {
      test: {
        admin_prompt_version_id: "apv-de-002",
        published_at: "2026-05-21T10:00:00Z",
        published_by: "xf",
      },
      staging: {
        admin_prompt_version_id: "apv-de-002",
        published_at: "2026-05-22T14:30:00Z",
        published_by: "xf",
      },
      production: {
        admin_prompt_version_id: "apv-de-001",
        published_at: "2026-03-15T08:00:00Z",
        published_by: "张雨时",
      },
    },
    lang_es_zh: {
      test: {
        admin_prompt_version_id: "apv-es-001",
        published_at: "2026-04-19T09:00:00Z",
        published_by: "张健",
      },
      staging: {
        admin_prompt_version_id: "apv-es-001",
        published_at: "2026-04-20T11:00:00Z",
        published_by: "张健",
      },
      production: null,
    },
    lang_pt_zh: {
      test: null,
      staging: null,
      production: null,
    },
  },

  bindingPrev: {
    "lang_de_zh:production": {
      admin_prompt_version_id: "apv-de-001",
      published_at: "2026-03-15T08:00:00Z",
      published_by: "张雨时",
    },
    "lang_de_zh:staging": {
      admin_prompt_version_id: "apv-de-001",
      published_at: "2026-03-16T10:00:00Z",
      published_by: "张雨时",
    },
    "lang_de_zh:test": {
      admin_prompt_version_id: "apv-de-001",
      published_at: "2026-03-17T09:00:00Z",
      published_by: "张雨时",
    },
  },

  releaseHistory: [
    {
      id: "rh-001",
      language_id: "lang_de_zh",
      environment: "production",
      action: "publish",
      from_version: null,
      to_version: "apv-de-001",
      operator: "张雨时",
      created_at: "2026-03-15T08:00:00Z",
    },
    {
      id: "rh-002",
      language_id: "lang_de_zh",
      environment: "test",
      action: "publish",
      from_version: "apv-de-001",
      to_version: "apv-de-002",
      operator: "xf",
      created_at: "2026-05-21T10:00:00Z",
    },
    {
      id: "rh-003",
      language_id: "lang_de_zh",
      environment: "staging",
      action: "publish",
      from_version: "apv-de-001",
      to_version: "apv-de-002",
      operator: "xf",
      created_at: "2026-05-22T14:30:00Z",
    },
    {
      id: "rh-004",
      language_id: "lang_es_zh",
      environment: "staging",
      action: "publish",
      from_version: null,
      to_version: "apv-es-001",
      operator: "张健",
      created_at: "2026-04-20T11:00:00Z",
    },
  ],

  statusLabels: {
    none: "无",
    testing: "测试中",
    staging: "预发",
    production: "正式",
    offline: "已下线",
  },

  envLabels: {
    test: "测试",
    staging: "预发",
    production: "正式",
  },

  evalReportUrlTemplate:
    "https://eval.example.internal/reports/{report_id}?task={task_id}",

  evalReports: {
    "report-de-4412": {
      eval_task_id: "task-de-8821",
      title: "德语 · v2 · 全剧整体评估",
      verdict: "可用",
      summary:
        "11 维评测：平台翻译相对人工校对均分 +2.1；专名/术语、CPS 达标；共识 3/3 裁判通过。",
      highlights: ["专名映射已更新", "engineering v2 行宽规则"],
    },
    "report-3201": {
      eval_task_id: "eval-task-7102",
      title: "西语 · v1 · 预发验证集",
      verdict: "可用",
      summary: "试点 3 剧抽评通过；engineering 字符行规则待下一版微调。",
      highlights: ["首次译评入库"],
    },
    "report-5500": {
      eval_task_id: "eval-task-9901",
      title: "葡语 · v0.1 · 候选集",
      verdict: "可用",
      summary: "首批评测完成，已提交可应用并自动入库。",
      highlights: ["新语种首版"],
    },
  },

  promptVersions: [
    {
      eval_prompt_version_id: "epv-de-001",
      language_id: "lang_de_zh",
      version_label: "v1",
      state: "submitted",
      changelog: "人工 PE 基线",
      updated_at: "2026-03-10T09:00:00Z",
      blocks: {
        system:
          "You are a professional subtitle translator from Chinese to German...",
        name_mapping: '{"李明":"Li Ming"}',
        engineering: "SRT; max 42 chars/line.",
      },
      last_task_id: null,
      admin_prompt_version_id: "apv-de-001",
    },
    {
      eval_prompt_version_id: "epv-de-002",
      language_id: "lang_de_zh",
      version_label: "v2",
      state: "submitted",
      changelog: "专名映射优化；engineering v2",
      updated_at: "2026-05-20T16:00:00Z",
      blocks: {
        system:
          "You are a senior DE translator for short drama. Tone: emotional, concise...",
        name_mapping:
          '{"李明":"Li Ming","王芳":"Wang Fang","陈总":"CEO Chen"}',
        engineering: "SRT; line break rules v2.",
      },
      last_task_id: "task-de-8821",
      expert_usability: null,
      admin_prompt_version_id: "apv-de-002",
    },
    {
      eval_prompt_version_id: "epv-de-003",
      language_id: "lang_de_zh",
      version_label: "v3",
      state: "draft",
      changelog: "根据优化清单调整 CPS 相关 engineering",
      updated_at: "2026-05-28T10:00:00Z",
      blocks: {
        system:
          "You are a senior DE translator for short drama. Tone: emotional, concise...",
        name_mapping:
          '{"李明":"Li Ming","王芳":"Wang Fang","陈总":"CEO Chen"}',
        engineering: "SRT; CPS 14–20; max 80 chars.",
      },
      last_task_id: null,
      expert_usability: "usable",
      expert_marked_by: "张专家",
      expert_marked_at: "2026-05-29T09:00:00Z",
      admin_prompt_version_id: null,
    },
    {
      eval_prompt_version_id: "epv-pt-001",
      language_id: "lang_pt_zh",
      version_label: "v0.1",
      state: "submitted",
      changelog: "新语种首版 Prompt",
      updated_at: "2026-05-29T14:00:00Z",
      blocks: {
        system: "Portuguese (BR) subtitle translator for C-drama...",
        name_mapping: '{"小美":"Xiaomei"}',
        engineering: "SRT output; preserve indices.",
      },
      last_task_id: null,
      gate_result: null,
      admin_prompt_version_id: "apv-pt-001",
    },
  ],

  knowledgeBlocks: [
    {
      knowledge_id: "kb-de-001",
      language_id: "lang_de_zh",
      category: "专名",
      title: "人名音译",
      content: "中文人名采用标准德语转写，保留姓在前。",
      example: "李明 → Li Ming",
    },
    {
      knowledge_id: "kb-de-002",
      language_id: "lang_de_zh",
      category: "称谓",
      title: "职场称谓",
      content: "CEO/总 → Geschäftsführer 或上下文简称。",
      example: "陈总 → CEO Chen（字幕可简写）",
    },
    {
      knowledge_id: "kb-de-003",
      language_id: "lang_de_zh",
      category: "术语",
      title: "CPS 工程",
      content: "德语字幕 14 < CPS < 20，单行 ≤80 字符。",
      example: "🚨CPS=23 视为违规行",
    },
  ],

  evalTasks: [
    {
      task_id: "task-de-8821",
      language_id: "lang_de_zh",
      eval_prompt_version_ids: ["epv-de-001", "epv-de-002"],
      version_labels: ["v1", "v2"],
      report_kind: "compare",
      eval_prompt_version_id: "epv-de-002",
      version_label: "v1 vs v2",
      dramas: ["桃花马上请长缨", "放手以后，自私女友跪求我回头"],
      episode_range: "前 3 集",
      status: "done",
      created_at: "2026-05-18T08:00:00Z",
      finished_at: "2026-05-20T16:30:00Z",
      report_id: "report-de-4412",
      gate_result: "pass",
    },
    {
      task_id: "task-de-9001",
      language_id: "lang_de_zh",
      eval_prompt_version_ids: ["epv-de-002", "epv-de-003"],
      version_labels: ["v2", "v3"],
      report_kind: "compare",
      eval_prompt_version_id: "epv-de-003",
      version_label: "v2 vs v3",
      dramas: ["桃花马上请长缨"],
      episode_range: "前 3 集",
      status: "running",
      created_at: "2026-05-28T11:00:00Z",
      finished_at: null,
      report_id: null,
      gate_result: null,
    },
  ],

  reports: {
    "report-de-4412": {
      title: "德语 · v1 vs v2 · 对比报告",
      report_kind: "compare",
      summary:
        "11 维：两版均相对人工校对跑评完成；详见版本对比。是否可用请专家人工标注。",
      compare_summary: "v2 整体优于 v1：11 维中 8 维 v2 平台均分更高，整体均分差 +1.4（v2−v1）。",
      compare_dimensions: [
        { name: "专有名词/专业术语", verdict: "v2 优" },
        { name: "CPS/字符数/时长", verdict: "v2 优" },
        { name: "语义完整", verdict: "持平" },
      ],
      dimensions: [
        { name: "专有名词/专业术语", score0: 88, score1: 85, win: true },
        { name: "CPS/字符数/时长", score0: 82, score1: 78, win: true },
        { name: "语义完整", score0: 80, score1: 79, win: true },
      ],
      gate_details: [
        { rule_id: "R1", label: "全剧均分差 ≥ 阈值", met: true, value: "+2.1" },
        { rule_id: "R2", label: "落后维度数 ≤ 2", met: true, value: "0" },
      ],
      archive_count: 12,
      checklist_exported: true,
    },
  },

  gateRuleTemplates: [
    { label: "全剧整体 · 均分差（平台−人工）", operator: "≥" },
    { label: "落后维度个数", operator: "≤" },
    { label: "裁判共识（score0≥score1）", operator: "≥" },
    { label: "单维 · 专有名词/术语 分差", operator: "≥" },
    { label: "工程违规率", operator: "≤" },
  ],

  gateRules: {
    lang_de_zh: [
      {
        rule_id: "R1",
        label: "全剧整体 · 均分差（平台−人工）",
        operator: "≥",
        threshold: "0",
        enabled: true,
      },
      {
        rule_id: "R2",
        label: "落后维度个数",
        operator: "≤",
        threshold: "2",
        enabled: true,
      },
      {
        rule_id: "R3",
        label: "裁判共识（score0≥score1）",
        operator: "≥",
        threshold: "3",
        enabled: true,
      },
    ],
    lang_es_zh: [],
    lang_pt_zh: [],
  },

  /** 语种规则版本展示状态（落库仍为 Prompt 版本） */
  promptStatusLabels: {
    pending_eval: "待评测",
    running: "评测中",
    usable: "可用",
    unusable: "不可用",
    submitted: "已提交",
  },
  /** 库表字段：submitted=已提交 Admin；其余由任务推导展示态 */
  taskStatusLabels: {
    pending: "待跑",
    running: "运行中",
    done: "完成",
    failed: "失败",
  },
  gateLabels: {
    pass: "可用",
    fail: "不可用",
    pass_with_warnings: "可用（有警告）",
    pending: "待判定",
  },
  slotLabels: {
    system: "系统提示",
    name_mapping: "人名映射",
    engineering: "工程约束",
  },
  slotHints: {
    system: "平台内置 · 仅可查看，不可编辑",
    name_mapping: "人名、称谓、专名、职位/公司名映射",
    engineering: "CPS、字符数、时长、合并拆分等",
  },
  categoryLabels: {
    专名: "专名",
    称谓: "称谓",
    俗语: "俗语",
    禁忌: "禁忌",
    术语: "术语",
  },

  /** 新建语种下拉选项（一期由配置/接口下发，原型写死） */
  langOptions: [
    { code: "zh", label: "中文" },
    { code: "en", label: "英语" },
    { code: "de", label: "德语" },
    { code: "es", label: "西班牙语" },
    { code: "pt", label: "葡萄牙语" },
    { code: "fr", label: "法语" },
    { code: "ja", label: "日语" },
    { code: "ko", label: "韩语" },
    { code: "th", label: "泰语" },
    { code: "vi", label: "越南语" },
    { code: "id", label: "印尼语" },
    { code: "ar", label: "阿拉伯语" },
  ],
  newLangFormDefaults: {
    source_lang: "zh",
    target_lang: "",
  },

  /** 创建评测任务 · 试点剧列表（配置下发） */
  pilotDramas: [
    "桃花马上请长缨",
    "放手以后，自私女友跪求我回头",
  ],
  taskFormDefaults: {
    episode_range: "前 3 集",
  },
};
