/**
 * 发布管理 MVP · Mock
 * 范围：语种列表 → 语种详情（手工 Prompt + 发布到当前环境）
 * 条目以序号标识，无版本号概念
 */
window.PUBLISH_MVP_INITIAL = {
  statusLabels: {
    production: "正式应用",
    staging: "预发验证",
    none: "未发布",
  },

  languages: [
    {
      language_id: "lang_de_zh",
      source_lang: "zh",
      target_lang: "de",
      owner: "张雨时",
      status: "production",
      remark: "主线路",
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

  prompts: [
    {
      prompt_id: "prm-de-001",
      language_id: "lang_de_zh",
      seq: 1,
      source: "manual",
      changelog: "人工 PE 基线",
      submitted_at: "2026-03-10T09:00:00Z",
      prompt_text:
        "You are a professional subtitle translator from Chinese to German.\nPreserve timing and speaker tags.\n…",
    },
    {
      prompt_id: "prm-de-002",
      language_id: "lang_de_zh",
      seq: 2,
      source: "eval_submit",
      changelog: "译评提交入库",
      submitted_at: "2026-05-20T16:45:00Z",
      prompt_text:
        "You are a senior DE translator for short drama.\nTone: emotional, concise.\n…",
    },
    {
      prompt_id: "prm-es-001",
      language_id: "lang_es_zh",
      seq: 1,
      source: "eval_submit",
      changelog: "首次译评提交",
      submitted_at: "2026-04-18T11:00:00Z",
      prompt_text: "Translate Chinese short drama subtitles to Spanish (ES)…",
    },
  ],

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
  newLangFormDefaults: { source_lang: "zh", target_lang: "" },
  newLangTargetPlaceholder: "请选择目标语言",

  currentPublish: {
    lang_de_zh: {
      prompt_id: "prm-de-002",
      published_at: "2026-05-21T10:00:00Z",
      published_by: "张雨时",
    },
    lang_es_zh: {
      prompt_id: "prm-es-001",
      published_at: "2026-04-20T14:30:00Z",
      published_by: "张健",
    },
  },
};
