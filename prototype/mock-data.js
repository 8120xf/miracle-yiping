/**
 * Admin 管理平台 · 一期原型 · 写死 JSON
 * 对齐 PRD-Admin管理平台-一期 v1.3 · A-5.1～A-5.4
 * version_label：短名 v1 / v2 / v0.1（界面展示）；admin_prompt_version_id 仅 API/库表
 */
window.ADMIN_MOCK_INITIAL = {
  languages: [
    {
      language_id: "lang_de_zh",
      source_lang: "zh",
      target_lang: "de",
      display_name: "中文 → 德语",
      status: "production",
      owner: "张雨时",
      remark: "主线路；桃花马上、放手以后等剧已接入",
      created_at: "2026-03-12T08:00:00Z",
    },
    {
      language_id: "lang_es_zh",
      source_lang: "zh",
      target_lang: "es",
      display_name: "中文 → 西班牙语",
      status: "staging",
      owner: "张健",
      remark: "预发验证中",
      created_at: "2026-04-01T10:30:00Z",
    },
    {
      language_id: "lang_pt_zh",
      source_lang: "zh",
      target_lang: "pt",
      display_name: "中文 → 葡萄牙语",
      status: "none",
      owner: "—",
      remark: "新建语种壳；v0.1 已由译评提交自动入库",
      created_at: "2026-05-28T14:00:00Z",
    },
  ],

  versions: [
    {
      admin_prompt_version_id: "apv-de-001",
      language_id: "lang_de_zh",
      version_label: "v1",
      source: "manual",
      changelog: "人工 PE 基线；三槽位初版",
      submitted_at: "2026-03-10T09:00:00Z",
      blocks: {
        system:
          "You are a professional subtitle translator from Chinese to German...\n[system prompt 摘要]",
        name_mapping:
          '{"李明":"Li Ming","王芳":"Wang Fang"}',
        engineering:
          "Output SRT format. Max 42 chars/line. Preserve timing codes.",
      },
      eval_task_id: null,
      eval_report_id: null,
      gate_result: "pass",
      eval_prompt_version_id: null,
    },
    {
      admin_prompt_version_id: "apv-de-002",
      language_id: "lang_de_zh",
      version_label: "v2",
      source: "eval_submit",
      changelog: "译评过线：11 维均 ≥ 阈值；name_mapping 优化",
      submitted_at: "2026-05-20T16:45:00Z",
      blocks: {
        system:
          "You are a senior DE translator for short drama. Tone: emotional, concise...\n[system prompt 摘要]",
        name_mapping:
          '{"李明":"Li Ming","王芳":"Wang Fang","陈总":"CEO Chen"}',
        engineering:
          "SRT only. Line break rules v2. Keep {{speaker}} tags.",
      },
      eval_task_id: "eval-task-8821",
      eval_report_id: "report-4412",
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
        system: "Translate Chinese short drama subtitles to Spanish (ES)...\n",
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
        system: "Portuguese (BR) subtitle translator for C-drama...\n",
        name_mapping: '{"小美":"Xiaomei"}',
        engineering: "SRT output; preserve indices.",
      },
      eval_task_id: "eval-task-9901",
      eval_report_id: "report-5500",
      gate_result: "pass",
      eval_prompt_version_id: "epv-pt-001",
    },
  ],

  pending: [],

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

  /** 每环境上一生效版本，供回滚 */
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

  gateLabels: {
    pass: "通过",
    fail: "未通过",
    pending: "待确认",
  },

  /** 译评报告外链模板（一期配置项，原型占位） */
  evalReportUrlTemplate:
    "https://eval.example.internal/reports/{report_id}?task={task_id}",

  /** 原型用报告摘要；正式环境由译评平台页面展示 */
  evalReports: {
    "report-4412": {
      eval_task_id: "eval-task-8821",
      title: "德语 · v2 · 全剧整体评估",
      verdict: "过线",
      summary:
        "11 维评测：平台 AI（t0）相对人工底稿（t1）均分 +2.1；专名/术语、CPS 达标；共识 3/3 裁判通过。",
      highlights: ["专名映射已更新", "engineering v2 行宽规则"],
    },
    "report-3201": {
      eval_task_id: "eval-task-7102",
      title: "西语 · v1 · 预发验证集",
      verdict: "过线",
      summary: "试点 3 剧抽评通过；engineering 字符行规则待下一版微调。",
      highlights: ["首次译评入库"],
    },
    "report-5500": {
      eval_task_id: "eval-task-9901",
      title: "葡语 · v0.1 · 候选集",
      verdict: "过线",
      summary: "首批评测完成，已提交可应用并自动入库。",
      highlights: ["新语种首版"],
    },
  },
};
