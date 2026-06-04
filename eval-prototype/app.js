(function () {
  "use strict";

  const SLOTS = ["system", "name_mapping", "engineering"];
  const ENVS = ["test", "staging", "production"];

  if (!window.EVAL_MOCK_INITIAL) {
    document.addEventListener("DOMContentLoaded", () => {
      const el = document.getElementById("app");
      if (el) el.innerHTML = '<div class="page empty">未加载 mock-data.js</div>';
    });
    return;
  }

  let state = JSON.parse(JSON.stringify(window.EVAL_MOCK_INITIAL));
  let route = { module: "iter", page: "list", langId: null };
  let modalPvId = null;
  let activeSlot = "system";

  function $(s, r) {
    return (r || document).querySelector(s);
  }
  function $$(s, r) {
    return Array.from((r || document).querySelectorAll(s));
  }
  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function showToast(message) {
    const el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 280);
    }, 3200);
  }

  let lastFocusBeforeModal = null;
  let modalKeydownHandler = null;

  function getFocusable(root) {
    if (!root) return [];
    return $$(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      root
    ).filter((el) => el.offsetParent !== null && !el.closest("[hidden]"));
  }

  function closeModal(wrap) {
    if (!wrap) return;
    if (wrap.parentNode) wrap.remove();
    if (modalKeydownHandler) {
      document.removeEventListener("keydown", modalKeydownHandler);
      modalKeydownHandler = null;
    }
    if (lastFocusBeforeModal && typeof lastFocusBeforeModal.focus === "function") {
      try {
        lastFocusBeforeModal.focus();
      } catch (e) {
        /* ignore */
      }
    }
    lastFocusBeforeModal = null;
  }

  function mountModal(wrap, options) {
    const opts = options || {};
    const dialog =
      wrap.querySelector(".modal, .modal-form, .modal-wide, .modal-dialog") ||
      wrap.firstElementChild;
    wrap.className = "modal-backdrop";
    if (dialog) {
      dialog.classList.add("modal-dialog");
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      const titleEl = dialog.querySelector("h3, h2, .modal-title");
      if (titleEl) {
        if (!titleEl.id) titleEl.id = "dialog-title-" + Date.now();
        dialog.setAttribute("aria-labelledby", titleEl.id);
      }
    }
    lastFocusBeforeModal = document.activeElement;
    document.body.appendChild(wrap);

    modalKeydownHandler = (e) => {
      if (e.key === "Escape") {
        if (opts.onEscape) opts.onEscape();
        else closeModal(wrap);
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const nodes = getFocusable(dialog);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", modalKeydownHandler);

    wrap.addEventListener("click", (e) => {
      if (e.target !== wrap) return;
      if (opts.closeOnBackdrop === false) return;
      if (opts.onEscape) opts.onEscape();
      else closeModal(wrap);
    });

    const focusTarget =
      (opts.focusSelector && wrap.querySelector(opts.focusSelector)) ||
      (dialog && getFocusable(dialog)[0]);
    if (focusTarget) {
      requestAnimationFrame(() => focusTarget.focus());
    }
    return wrap;
  }

  function showMessageDialog(title, message, onClose) {
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="modal modal-dialog">' +
      "<h3>" +
      esc(title) +
      "</h3>" +
      "<p>" +
      esc(message) +
      "</p>" +
      '<div class="modal-ft">' +
      '<button type="button" class="btn btn-primary" data-ok>知道了</button></div></div>';
    mountModal(wrap);
    wrap.querySelector("[data-ok]").onclick = () => {
      closeModal(wrap);
      if (onClose) onClose();
    };
  }

  function showConfirmDialog(opts) {
    const wrap = document.createElement("div");
    const danger = opts.danger ? " btn-danger" : " btn-primary";
    wrap.innerHTML =
      '<div class="modal modal-dialog">' +
      "<h3>" +
      esc(opts.title || "确认") +
      "</h3>" +
      "<p>" +
      esc(opts.message || "") +
      "</p>" +
      '<div class="modal-ft">' +
      '<button type="button" class="btn" data-x>取消</button>' +
      '<button type="button" class="btn' +
      danger +
      '" data-ok>' +
      esc(opts.confirmLabel || "确定") +
      "</button></div></div>";
    mountModal(wrap, {
      onEscape: () => closeModal(wrap),
    });
    wrap.querySelector("[data-x]").onclick = () => closeModal(wrap);
    wrap.querySelector("[data-ok]").onclick = () => {
      closeModal(wrap);
      if (opts.onConfirm) opts.onConfirm();
    };
  }

  function langLabel(code) {
    const o = (state.langOptions || []).find((x) => x.code === code);
    return o ? o.label : code;
  }

  function pairName(source, target) {
    return langLabel(source) + " → " + langLabel(target);
  }

  function buildLangSelect(id, selectedCode, withPlaceholder) {
    const opts = state.langOptions || [];
    let html =
      '<select id="' +
      id +
      '" class="lang-select">' +
      (withPlaceholder
        ? '<option value="">' +
          esc(state.newLangTargetPlaceholder || "请选择目标语言") +
          "</option>"
        : "");
    opts.forEach((o) => {
      html +=
        '<option value="' +
        esc(o.code) +
        '"' +
        (o.code === selectedCode ? " selected" : "") +
        ">" +
        esc(o.label) +
        "（" +
        esc(o.code) +
        "）</option>";
    });
    return html + "</select>";
  }

  function getLang(id) {
    return state.languages.find((l) => l.language_id === id);
  }

  function langStatus(l) {
    return (l && (l.status || l.admin_status)) || "none";
  }

  function getConfigVersions(langId) {
    return (state.configVersions || []).filter((v) => v.language_id === langId);
  }
  function getConfigVer(id) {
    return (state.configVersions || []).find((v) => v.admin_prompt_version_id === id);
  }
  function configVerLabel(id) {
    const v = getConfigVer(id);
    if (v) return v.version_label;
    if (!id) return "—";
    const m = String(id).match(/(\d+)$/);
    return m ? "#" + m[1] : id;
  }
  function getBind(langId, env) {
    const b = state.bindings && state.bindings[langId];
    return b && b[env] ? b[env] : null;
  }
  function ensureBindings(langId) {
    if (!state.bindings) state.bindings = {};
    if (!state.bindings[langId]) {
      state.bindings[langId] = { test: null, staging: null, production: null };
    }
  }
  function getPrompts(langId) {
    return state.promptVersions
      .filter((p) => p.language_id === langId)
      .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
  }
  function getPrompt(id) {
    return state.promptVersions.find((p) => p.eval_prompt_version_id === id);
  }
  function getTasks(langId) {
    return state.evalTasks.filter((t) => t.language_id === langId);
  }
  function getTask(id) {
    return state.evalTasks.find((t) => t.task_id === id);
  }
  function taskLinksPrompt(t, pvId) {
    if (t.eval_prompt_version_ids && t.eval_prompt_version_ids.length) {
      return t.eval_prompt_version_ids.includes(pvId);
    }
    return t.eval_prompt_version_id === pvId;
  }

  function tasksForPrompt(pvId) {
    return state.evalTasks.filter((t) => taskLinksPrompt(t, pvId));
  }

  function taskVersionDisplay(t) {
    if (t.version_labels && t.version_labels.length > 1) {
      return t.version_labels.join(" vs ");
    }
    if (t.version_labels && t.version_labels.length === 1) {
      return t.version_labels[0];
    }
    return t.version_label || "—";
  }

  function pickListHtml(pickName, items, opts) {
    const max = opts && opts.max != null ? opts.max : "";
    return (
      '<div class="pick-list" data-pick="' +
      esc(pickName) +
      '"' +
      (max ? ' data-max="' + esc(String(max)) + '"' : "") +
      ">" +
      items
        .map(
          (item) =>
            '<button type="button" class="pick-item' +
            (item.checked ? " selected" : "") +
            '" data-value="' +
            esc(item.value) +
            '">' +
            '<span class="pick-box" aria-hidden="true"></span>' +
            '<span class="pick-text"><span class="pick-label">' +
            esc(item.label) +
            "</span>" +
            (item.sub
              ? '<span class="pick-sub">' + esc(item.sub) + "</span>"
              : "") +
            "</span></button>"
        )
        .join("") +
      "</div>"
    );
  }

  function bindPickList(wrap) {
    $$(".pick-list", wrap).forEach((list) => {
      const max = list.dataset.max ? parseInt(list.dataset.max, 10) : 0;
      $$(".pick-item", list).forEach((btn) => {
        btn.addEventListener("click", () => {
          const willSelect = !btn.classList.contains("selected");
          if (willSelect && max > 0) {
            const n = list.querySelectorAll(".pick-item.selected").length;
            if (n >= max) {
              showToast("最多选择 " + max + " 个");
              return;
            }
          }
          btn.classList.toggle("selected");
        });
      });
    });
  }

  function getPickValues(wrap, pickName) {
    const list = wrap.querySelector('[data-pick="' + pickName + '"]');
    if (!list) return [];
    return $$(".pick-item.selected", list).map((b) => b.dataset.value);
  }

  /**
   * 语种规则版本列表「状态」：待评测 / 评测中 / 可用 / 不可用（+ 已提交）
   * 可用/不可用仅来自专家人工标注 expert_usability（一期不做自动过线）
   */
  function promptDisplayStatus(p) {
    if (!p) return { key: "pending_eval", label: "待评测" };
    if (p.state === "submitted" || p.admin_prompt_version_id) {
      return {
        key: "submitted",
        label: (state.promptStatusLabels && state.promptStatusLabels.submitted) || "已提交",
      };
    }
    const tasks = tasksForPrompt(p.eval_prompt_version_id);
    if (tasks.some((t) => t.status === "running")) {
      return {
        key: "running",
        label: (state.promptStatusLabels && state.promptStatusLabels.running) || "评测中",
      };
    }
    if (p.expert_usability === "usable") {
      return {
        key: "usable",
        label: (state.promptStatusLabels && state.promptStatusLabels.usable) || "可用",
      };
    }
    if (p.expert_usability === "unusable") {
      return {
        key: "unusable",
        label: (state.promptStatusLabels && state.promptStatusLabels.unusable) || "不可用",
      };
    }
    return {
      key: "pending_eval",
      label: (state.promptStatusLabels && state.promptStatusLabels.pending_eval) || "待评测",
    };
  }

  function taskReportKind(t) {
    if (!t) return "analysis";
    if (t.report_kind) return t.report_kind;
    const ids = t.eval_prompt_version_ids || [];
    return ids.length > 1 ? "compare" : "analysis";
  }

  function taskReportLabel(t) {
    return taskReportKind(t) === "compare" ? "对比报告" : "分析报告";
  }

  function markPromptUsability(pvId, usability) {
    const p = getPrompt(pvId);
    if (!p) return;
    if (p.state === "submitted" || p.admin_prompt_version_id) {
      showToast("已提交版本不可修改可用状态");
      return;
    }
    const title =
      usability === "usable"
        ? "标为可用 · " + p.version_label
        : usability === "unusable"
          ? "标为不可用 · " + p.version_label
          : "清除可用标注 · " + p.version_label;
    askOperator(title, (name) => {
      if (usability) {
        p.expert_usability = usability;
        p.expert_marked_by = name;
        p.expert_marked_at = new Date().toISOString();
      } else {
        p.expert_usability = null;
        p.expert_marked_by = null;
        p.expert_marked_at = null;
      }
      render();
      showToast(title + " · " + name);
    });
  }

  function promptStatusBadge(p) {
    const s = promptDisplayStatus(p);
    return (
      '<span class="badge badge-' +
      esc(s.key) +
      '">' +
      esc(s.label) +
      "</span>"
    );
  }

  function isUsable(p) {
    return promptDisplayStatus(p).key === "usable";
  }

  function platformSystemPrompt(langId) {
    const l = getLang(langId);
    const bi = state.builtInSystem;
    if (!bi || !bi.preview) return "";
    if (bi.source_lang && l && bi.source_lang !== l.source_lang) {
      return (
        bi.preview +
        "\n\n[原型：生产环境按源语言 " +
        l.source_lang +
        " 匹配对应内置模板]"
      );
    }
    return bi.preview;
  }

  function ensureSystemBlock(pv, langId) {
    if (!pv) return;
    if (!pv.blocks) pv.blocks = {};
    pv.blocks.system = platformSystemPrompt(langId);
  }

  function slotIsEditable(slot, pv) {
    if (slot === "system") return false;
    return pv.state !== "submitted";
  }

  /** 旧 hash 重定向到双应用路由 */
  function normalizeHash() {
    const raw = location.hash || "#/";
    if (raw === "#" || raw === "#/") {
      location.replace("#/iter");
      return true;
    }
    const mLegacyConfig = raw.match(/^#\/lang\/([^/]+)\/config\/?$/);
    if (mLegacyConfig) {
      location.replace("#/config/lang/" + mLegacyConfig[1]);
      return true;
    }
    const mLegacyLang = raw.match(/^#\/lang\/([^/]+)\/?$/);
    if (mLegacyLang) {
      location.replace("#/iter/lang/" + mLegacyLang[1]);
      return true;
    }
    return false;
  }

  function parseRoute() {
    const parts = (location.hash || "#/iter").slice(1).split("/").filter(Boolean);
    const head = parts[0];
    const module =
      head === "config" ? "config" : head === "review" ? "review" : "iter";
    if (module === "review") {
      route = { module: "review", page: "list", langId: null };
      return;
    }
    if (parts[1] === "lang" && parts[2]) {
      route = {
        module,
        page: "detail",
        langId: decodeURIComponent(parts[2]),
      };
    } else if (head === "iter" || head === "config") {
      route = { module, page: "list", langId: null };
    } else {
      route = { module: "iter", page: "list", langId: null };
    }
  }

  function hrefIterList() {
    return "#/iter";
  }
  function hrefReviewList() {
    return "#/review";
  }
  function hrefConfigList() {
    return "#/config";
  }
  function hrefIterLang(langId) {
    return "#/iter/lang/" + encodeURIComponent(langId);
  }
  function hrefConfigLang(langId) {
    return "#/config/lang/" + encodeURIComponent(langId);
  }

  function renderBackToList() {
    const href =
      route.module === "config"
        ? hrefConfigList()
        : route.module === "review"
          ? hrefReviewList()
          : hrefIterList();
    const label = route.module === "review" ? "人校评阅" : "语种管理";
    return '<a class="back" href="' + esc(href) + '">← ' + esc(label) + "</a>";
  }
  function hrefLangDetail(langId) {
    return route.module === "config"
      ? hrefConfigLang(langId)
      : hrefIterLang(langId);
  }
  function hrefList() {
    if (route.module === "config") return hrefConfigList();
    if (route.module === "review") return hrefReviewList();
    return hrefIterList();
  }

  function renderReviewPlaceholder() {
    return (
      '<div class="page app-page app-page-review">' +
      '<div class="page-head">' +
      "<div><h1>人校评阅</h1>" +
      '<p class="lede">查看评测结果详情 · 人工 review（一期仅模块占位，功能后续迭代）</p></div></div>' +
      '<div class="card card-placeholder" style="padding:28px 24px">' +
      "<p>本模块规划承载：</p>" +
      "<ul class=\"gate-rules-list\">" +
      "<li>评测任务结果的<strong>逐条/逐维</strong>详情（JSONL 工作台）</li>" +
      "<li>人工改分、改 reason、问题标记与导出</li>" +
      "<li>与规则评测中的<strong>分析报告 / 对比报告</strong>（摘要）区分：摘要在规则评测，细阅在本模块</li>" +
      "</ul>" +
      '<p class="sub" style="margin-top:16px">现网能力可参考 M5 人校工作台；合并迁入路径与排期待 PRD 补充。</p>' +
      '<p style="margin-top:20px"><a class="btn btn-sm" href="' +
      esc(hrefIterList()) +
      '">前往规则评测</a></p></div></div>'
    );
  }

  function renderSidebar() {
    const side = $("#app-sidebar");
    if (!side) return;
    const m = route.module;
    side.innerHTML =
      '<div class="sidebar-brand">' +
      '<span class="sidebar-brand-title">AI 译评工作台</span>' +
      '<span class="sidebar-brand-sub">规则评测 · 人校评阅 · 发布管理</span></div>' +
      '<nav class="sidebar-nav" aria-label="应用">' +
      '<a class="sidebar-nav-link' +
      (m === "iter" ? " is-active" : "") +
      '" href="' +
      esc(hrefIterList()) +
      '"><span class="sidebar-nav-label">规则评测</span>' +
      '<span class="sidebar-nav-desc">规则 · 评测 · 可用</span></a>' +
      '<a class="sidebar-nav-link' +
      (m === "review" ? " is-active" : "") +
      '" href="' +
      esc(hrefReviewList()) +
      '"><span class="sidebar-nav-label">人校评阅</span>' +
      '<span class="sidebar-nav-desc">详情 · 人工 review</span></a>' +
      '<a class="sidebar-nav-link' +
      (m === "config" ? " is-active" : "") +
      '" href="' +
      esc(hrefConfigList()) +
      '"><span class="sidebar-nav-label">发布管理</span>' +
      '<span class="sidebar-nav-desc">入库 · 三环境</span></a>' +
      "</nav>" +
      (route.page === "detail" && route.langId && m !== "review"
        ? '<div class="sidebar-cross">' +
          (m === "iter"
            ? '<a class="sidebar-cross-link" href="' +
              esc(hrefConfigLang(route.langId)) +
              '">↗ 发布管理（本语种）</a>'
            : '<a class="sidebar-cross-link" href="' +
              esc(hrefIterLang(route.langId)) +
              '">↗ 规则评测（本语种）</a>') +
          "</div>"
        : "") +
      '<p class="sidebar-foot">三模块 · 双后端</p>';

    document.body.classList.toggle("module-config", m === "config");
    document.body.classList.toggle("module-iter", m === "iter");
    document.body.classList.toggle("module-review", m === "review");
  }

  /** 详情顶栏 · 三环境一行摘要（任意 Tab 可见） */
  function renderEnvStrip(langId) {
    const chips = ENVS.map((env) => {
      const b = getBind(langId, env);
      const ver = b ? configVerLabel(b.admin_prompt_version_id) : "未绑定";
      return (
        '<span class="env-chip">' +
        '<span class="env-chip-env">' +
        esc(state.envLabels[env]) +
        "</span>" +
        '<span class="env-chip-ver">' +
        esc(ver) +
        "</span></span>"
      );
    }).join("");
    return (
      '<div class="env-strip">' +
      '<span class="env-strip-label">环境生效</span>' +
      chips +
      "</div>"
    );
  }

  function render() {
    if (normalizeHash()) return;
    parseRoute();
    renderSidebar();
    const root = $("#app");
    if (!root) return;
    try {
      let html;
      if (route.module === "review") {
        html = renderReviewPlaceholder();
      } else if (route.module === "config") {
        html =
          route.page === "list"
            ? renderConfigList()
            : renderConfigDetail(route.langId);
      } else {
        html =
          route.page === "list"
            ? renderIterList()
            : renderIterDetail(route.langId);
      }
      root.innerHTML = html;
      bindEvents();
    } catch (err) {
      root.innerHTML =
        '<div class="page empty">渲染错误：' + esc(err.message) + "</div>";
      console.error(err);
    }
  }

  function renderIterList() {
    const rows = state.languages
      .map((l) => {
        const prompts = getPrompts(l.language_id);
        const latest = prompts[0];
        return (
          '<tr class="clickable" data-go="' +
          esc(l.language_id) +
          '">' +
          "<td><strong>" +
          esc(pairName(l.source_lang, l.target_lang)) +
          "</strong></td>" +
          '<td class="mono sub">' +
          esc(l.source_lang) +
          " → " +
          esc(l.target_lang) +
          "</td>" +
          "<td>" +
          (latest
            ? esc(latest.version_label) +
              " " +
              promptStatusBadge(latest)
            : "—") +
          "</td>" +
          "<td>" +
          esc(l.owner) +
          '</td><td class="col-actions">' +
          '<button type="button" class="btn btn-sm btn-link" data-act="go-detail" data-id="' +
          esc(l.language_id) +
          '">详情</button></td></tr>'
        );
      })
      .join("");

    return (
      '<div class="page app-page app-page-iter">' +
      '<div class="page-head">' +
      "<div><h1>语种管理</h1>" +
      '<p class="lede">语种规则版本 · 分析/对比报告 · 专家标可用 · 提交可应用</p></div>' +
      '<button type="button" class="btn btn-primary" data-act="new-lang">+ 新建语种</button></div>' +
      '<div class="card card-list"><table class="simple table-list">' +
      "<thead><tr><th>语种</th><th>语对</th><th>最新规则版本</th><th>负责人</th><th>操作</th></tr></thead>" +
      "<tbody>" +
      rows +
      "</tbody></table></div></div>"
    );
  }

  function renderConfigList() {
    const rows = state.languages
      .map((l) => {
        const st = langStatus(l);
        const n = getConfigVersions(l.language_id).length;
        return (
          '<tr class="clickable" data-go="' +
          esc(l.language_id) +
          '">' +
          "<td><strong>" +
          esc(pairName(l.source_lang, l.target_lang)) +
          "</strong></td>" +
          '<td class="mono sub">' +
          esc(l.source_lang) +
          " → " +
          esc(l.target_lang) +
          "</td>" +
          '<td><span class="badge badge-' +
          esc(st) +
          '">' +
          esc((state.statusLabels && state.statusLabels[st]) || st) +
          "</span></td>" +
          "<td>" +
          esc(n) +
          " 个</td>" +
          "<td>" +
          esc(l.owner) +
          '</td><td class="col-actions">' +
          '<button type="button" class="btn btn-sm btn-link" data-act="go-detail" data-id="' +
          esc(l.language_id) +
          '">详情</button></td></tr>'
        );
      })
      .join("");

    return (
      '<div class="page app-page app-page-config">' +
      '<div class="page-head">' +
      "<div><h1>语种管理</h1>" +
      '<p class="lede">Prompt 版本库 · 测试 / 预发 / 正式环境发布与回滚</p></div>' +
      '<button type="button" class="btn btn-primary" data-act="new-lang">+ 新建语种</button></div>' +
      '<div class="card card-list"><table class="simple table-list">' +
      "<thead><tr><th>语种</th><th>语对</th><th>应用阶段</th><th>已入库</th><th>负责人</th><th>操作</th></tr></thead>" +
      "<tbody>" +
      rows +
      "</tbody></table></div></div>"
    );
  }

  function getGateRules(langId) {
    if (!state.gateRules) state.gateRules = {};
    if (!state.gateRules[langId]) state.gateRules[langId] = [];
    return state.gateRules[langId];
  }

  function renderGateRulesSection(langId) {
    const rules = getGateRules(langId);
    const rows = rules
      .map(
        (r) =>
          "<tr data-rule-id=\"" +
          esc(r.rule_id) +
          "\">" +
          "<td><strong>" +
          esc(r.label) +
          "</strong></td>" +
          "<td class=\"sub mono\">" +
          esc(r.operator) +
          "</td>" +
          "<td>" +
          '<input type="text" class="gate-threshold-input" data-gate-threshold value="' +
          esc(r.threshold ?? "") +
          '" placeholder="按语种填写" /></td>' +
          "<td>" +
          '<label class="gate-enable"><input type="checkbox" data-gate-enabled' +
          (r.enabled !== false ? " checked" : "") +
          " /> 启用</label></td>" +
          '<td><button type="button" class="btn btn-sm btn-link" data-act="del-gate" data-rid="' +
          esc(r.rule_id) +
          '">删除</button></td></tr>'
      )
      .join("");

    return (
      '<section class="section" id="sec-gate">' +
      '<div class="section-head"><h2 class="section-title">可用规则</h2>' +
      '<button type="button" class="btn btn-sm" data-act="add-gate">+ 添加规则</button></div>' +
      '<p class="tool-hint">评测任务完成后，按本语种规则自动判定版本是否<strong>可用</strong>（可提交 Admin）。<strong>不预置全局默认阈值</strong>；未配置任何启用规则时，结论为 <code>pending</code>，报告仍展示维度分与共识。</p>' +
      '<div class="card gate-panel">' +
      (rules.length
        ? '<table class="simple gate-rules-table"><thead><tr><th>规则</th><th>比较</th><th>阈值</th><th>启用</th><th></th></tr></thead><tbody>' +
          rows +
          "</tbody></table>"
        : '<p class="empty" style="padding:16px 20px">尚未配置可用规则 · 完成评测后需人工看报告判定，版本状态不会自动变为「可用」</p>') +
      "</div></section>"
    );
  }

  function renderConfigModule(langId) {
    const snaps = getConfigVersions(langId);
    const publishRows = ENVS.map((env) => {
      const b = getBind(langId, env);
      const curLabel = b ? configVerLabel(b.admin_prompt_version_id) : "—";
      const curTime = b ? fmtDate(b.published_at) : "—";
      const curOp = b ? esc(b.published_by) : "—";
      const opts = snaps
        .map(
          (v) =>
            '<option value="' +
            esc(v.admin_prompt_version_id) +
            '">' +
            esc(v.version_label) +
            "</option>"
        )
        .join("");
      const prev = state.bindingPrev && state.bindingPrev[langId + ":" + env];
      const canRollback = !!(b && prev);

      return (
        "<tr>" +
        "<td><strong>" +
        esc(state.envLabels[env]) +
        "</strong></td>" +
        "<td><strong>" +
        esc(curLabel) +
        "</strong></td>" +
        "<td>" +
        curTime +
        "</td>" +
        "<td>" +
        curOp +
        "</td>" +
        '<td><div class="row-actions">' +
        '<select data-env="' +
        env +
        '">' +
        (opts || '<option value="">（无已入库版本）</option>') +
        "</select>" +
        '<button type="button" class="btn btn-sm" data-act="publish" data-env="' +
        env +
        '">发布</button>' +
        '<button type="button" class="btn btn-sm btn-danger" data-act="rollback" data-env="' +
        env +
        '"' +
        (canRollback ? "" : " disabled") +
        ">回滚</button></div></td></tr>"
      );
    }).join("");

    const snapTable = snaps
      .map((v) => {
        const reportBtn = v.eval_report_id
          ? '<button type="button" class="btn btn-sm" data-act="view-config-report" data-vid="' +
            esc(v.admin_prompt_version_id) +
            '">评测报告</button>'
          : '<span class="sub">—</span>';
        return (
          "<tr class=\"no-hover\">" +
          "<td><strong>" +
          esc(v.version_label) +
          "</strong></td>" +
          '<td><span class="badge badge-source">' +
          esc(v.source === "eval_submit" ? "译评提交" : v.source) +
          "</span></td>" +
          "<td class=\"sub\">" +
          fmtDate(v.submitted_at) +
          "</td>" +
          '<td><div class="snap-actions">' +
          '<button type="button" class="btn btn-sm" data-act="view-config-snap" data-vid="' +
          esc(v.admin_prompt_version_id) +
          '">Prompt</button>' +
          reportBtn +
          "</div></td></tr>"
        );
      })
      .join("");

    const snapSection =
      snaps.length === 0
        ? '<p class="empty" style="padding:20px">暂无已入库版本；规则评测侧「提交可应用」后将自动出现在此</p>'
        : '<table class="simple snap-table"><thead><tr><th>版本</th><th>来源</th><th>入库时间</th><th>操作</th></tr></thead><tbody>' +
          snapTable +
          "</tbody></table>";

    const histItems = (state.releaseHistory || []).filter(
      (h) => h.language_id === langId
    );
    const hist = histItems
      .slice(0, 8)
      .map(
        (h) =>
          "<tr>" +
          "<td>" +
          fmtDate(h.created_at) +
          "</td>" +
          "<td>" +
          esc(state.envLabels[h.environment] || h.environment || "—") +
          "</td>" +
          "<td>" +
          (h.action === "rollback" ? "回滚" : "发布") +
          "</td>" +
          "<td>" +
          esc(configVerLabel(h.from_version)) +
          " → " +
          esc(configVerLabel(h.to_version)) +
          "</td>" +
          "<td>" +
          esc(h.operator) +
          "</td></tr>"
      )
      .join("");

    const histCount = histItems.length;

    return (
      '<section class="section">' +
      '<h2 class="section-title">环境发布</h2>' +
      '<p class="tool-hint">在下方选择已入库版本，发布到测试 / 预发 / 正式，或回滚到上一生效版本。</p>' +
      '<div class="card"><table class="simple">' +
      "<thead><tr><th>环境</th><th>当前版本</th><th>生效时间</th><th>操作人</th><th>更换并发布 / 回滚</th></tr></thead>" +
      "<tbody>" +
      publishRows +
      "</tbody></table></div></section>" +
      '<section class="section">' +
      '<h2 class="section-title">已入库 Prompt 版本 <span class="sub">（' +
      snaps.length +
      " 个）</span></h2>" +
      '<div class="card">' +
      snapSection +
      "</div></section>" +
      '<section class="section section-collapsible">' +
      '<details class="collapse-panel">' +
      '<summary class="collapse-summary">发布历史' +
      (histCount
        ? ' <span class="sub">（最近 ' + histCount + " 条）</span>"
        : "") +
      "</summary>" +
      '<div class="collapse-body card">' +
      (hist
        ? '<table class="simple"><thead><tr><th>时间</th><th>环境</th><th>动作</th><th>版本</th><th>操作人</th></tr></thead><tbody>' +
          hist +
          "</tbody></table>"
        : '<p class="empty" style="padding:16px 20px">暂无发布或回滚记录</p>') +
      "</div></details></section>"
    );
  }

  function renderIterDetail(langId) {
    const l = getLang(langId);
    if (!l) {
      return (
        '<div class="page app-page-iter">' +
        renderBackToList() +
        '<p class="empty">语种不存在</p></div>'
      );
    }

    const prompts = getPrompts(langId);
    const readySubmit = prompts.find((p) => isUsable(p));

    const promptRows = prompts
      .map((p) => {
        const st = promptDisplayStatus(p);
        const canSubmit = isUsable(p);
        const canMark = st.key !== "submitted" && st.key !== "running";
        const markBtns = canMark
          ? '<button type="button" class="btn btn-sm" data-act="mark-usable" data-pv="' +
            esc(p.eval_prompt_version_id) +
            '">标为可用</button>' +
            '<button type="button" class="btn btn-sm" data-act="mark-unusable" data-pv="' +
            esc(p.eval_prompt_version_id) +
            '">标为不可用</button>' +
            (p.expert_usability
              ? '<button type="button" class="btn btn-sm btn-link" data-act="mark-clear" data-pv="' +
                esc(p.eval_prompt_version_id) +
                '">清除标注</button>'
              : "")
          : "";
        return (
          '<tr class="no-hover">' +
          "<td><strong>" +
          esc(p.version_label) +
          "</strong></td>" +
          "<td>" +
          promptStatusBadge(p) +
          "</td>" +
          "<td class=\"sub\">" +
          esc(p.changelog) +
          "</td>" +
          "<td class=\"sub\">" +
          fmtDate(p.updated_at) +
          '</td><td><div class="row-actions">' +
          '<button type="button" class="btn btn-sm" data-act="edit-prompt" data-pv="' +
          esc(p.eval_prompt_version_id) +
          '">编辑</button>' +
          markBtns +
          '<button type="button" class="btn btn-sm" data-act="submit-admin" data-pv="' +
          esc(p.eval_prompt_version_id) +
          '"' +
          (canSubmit ? "" : " disabled") +
          ">提交可应用</button></div></td></tr>"
        );
      })
      .join("");

    const taskRows = getTasks(langId)
      .map((t) => {
        const done = t.status === "done";
        const reportBtn = done
          ? '<button type="button" class="btn btn-sm" data-act="view-report" data-task="' +
            esc(t.task_id) +
            '">' +
            esc(taskReportLabel(t)) +
            "</button>"
          : '<span class="sub">—</span>';
        return (
          "<tr class=\"no-hover\">" +
          "<td>" +
          esc(taskVersionDisplay(t)) +
          "</td>" +
          "<td class=\"sub\">" +
          esc(t.dramas.join("、")) +
          " · " +
          esc(t.episode_range) +
          "</td>" +
          '<td><span class="badge badge-' +
          esc(t.status === "running" ? "running" : t.status === "done" ? "done" : "pending") +
          '">' +
          esc(state.taskStatusLabels[t.status]) +
          "</span></td>" +
          "<td class=\"sub\">" +
          fmtDate(t.finished_at || t.created_at) +
          "</td><td>" +
          reportBtn +
          "</td></tr>"
        );
      })
      .join("");

    const langTitle = esc(pairName(l.source_lang, l.target_lang));

    return (
      '<div class="page page-detail app-page-iter">' +
      renderBackToList() +
      '<div class="page-head detail-head">' +
      "<div><h1>" +
      langTitle +
      "</h1>" +
      '<p class="lede">语种规则版本 · 评测任务 · 专家标可用</p></div>' +
      '<button type="button" class="btn btn-primary" data-act="new-prompt">+ 新建语种规则版本</button></div>' +
      (readySubmit
        ? '<div class="banner"><div><strong>' +
          esc(readySubmit.version_label) +
          ' 可用</strong><p class="sub">专家已标为可用，可「提交可应用」</p></div>' +
          '<button type="button" class="btn" data-act="submit-admin" data-pv="' +
          esc(readySubmit.eval_prompt_version_id) +
          '">提交可应用</button></div>'
        : "") +
      '<section class="section" id="sec-prompt">' +
      '<div class="section-head"><h2 class="section-title">语种规则版本 <span class="sub">（' +
      prompts.length +
      " 个）</span></h2>" +
      '<span class="sub">待评测 → 评测中 → 专家标可用/不可用 → 可提交可应用</span></div>' +
      '<div class="card">' +
      (promptRows
        ? '<table class="simple snap-table"><thead><tr><th>版本</th><th>状态</th><th>changelog</th><th>更新</th><th>操作</th></tr></thead><tbody>' +
          promptRows +
          "</tbody></table>"
        : '<p class="empty" style="padding:20px">暂无版本，点击右上角新建语种规则版本</p>') +
      "</div></section>" +
      '<section class="section" id="sec-tasks">' +
      '<div class="section-head"><h2 class="section-title">评测任务</h2>' +
      '<button type="button" class="btn btn-sm" data-act="new-task">+ 创建任务</button></div>' +
      '<div class="card">' +
      (taskRows
        ? '<table class="simple"><thead><tr><th>规则版本</th><th>范围</th><th>任务状态</th><th>时间</th><th>报告</th></tr></thead><tbody>' +
          taskRows +
          "</tbody></table>"
        : '<p class="empty" style="padding:20px">暂无评测任务</p>') +
      "</div></section>" +
      '<p class="foot-note">入库与环境发布请前往 <a href="' +
      esc(hrefConfigLang(langId)) +
      '">发布管理 · 该语种</a></p></div>'
    );
  }

  function renderConfigDetail(langId) {
    const l = getLang(langId);
    if (!l) {
      return (
        '<div class="page app-page-config">' +
        renderBackToList() +
        '<p class="empty">语种不存在</p></div>'
      );
    }
    const st = langStatus(l);
    const langTitle = esc(pairName(l.source_lang, l.target_lang));

    return (
      '<div class="page page-detail app-page-config">' +
      renderBackToList() +
      '<div class="page-head detail-head">' +
      "<div><h1>" +
      langTitle +
      ' <span class="badge badge-' +
      esc(st) +
      '">' +
      esc((state.statusLabels && state.statusLabels[st]) || st) +
      "</span></h1></div></div>" +
      renderEnvStrip(langId) +
      renderConfigModule(langId) +
      '<p class="foot-note">写规则与跑评测请前往 <a href="' +
      esc(hrefIterLang(langId)) +
      '">规则评测 · 该语种</a></p></div>'
    );
  }

  function bindEvents() {
    $$("#app tr.clickable[data-go]").forEach((tr) => {
      tr.addEventListener("click", (e) => {
        if (e.target.closest("[data-act=go-detail]")) return;
        location.hash = hrefLangDetail(tr.dataset.go);
      });
    });
    $$("#app [data-act=go-detail]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        location.hash = hrefLangDetail(btn.dataset.id);
      });
    });
    $$("#app [data-act=new-lang]").forEach((btn) => {
      btn.addEventListener("click", () => showNewLangModal());
    });
    $$("#app [data-act=new-prompt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (route.langId) createDraft(route.langId);
      });
    });
    $$("#app [data-act=edit-prompt]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        showPromptModal(route.langId, btn.dataset.pv);
      });
    });
    $$("#app [data-act=submit-admin]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        showSubmitModal(route.langId, btn.dataset.pv);
      });
    });
    $$("#app [data-act=view-report]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        showReportModal(btn.dataset.task);
      });
    });
    $$("#app [data-act=new-task]").forEach((btn) => {
      btn.addEventListener("click", () => showNewTaskModal(route.langId));
    });
    $$("#app [data-act=mark-usable]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        markPromptUsability(btn.dataset.pv, "usable");
      });
    });
    $$("#app [data-act=mark-unusable]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        markPromptUsability(btn.dataset.pv, "unusable");
      });
    });
    $$("#app [data-act=mark-clear]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        markPromptUsability(btn.dataset.pv, null);
      });
    });
    if (route.langId) {
      const langId = route.langId;
      $$("#app [data-gate-threshold]").forEach((inp) => {
        inp.addEventListener("change", () => {
          const row = inp.closest("tr[data-rule-id]");
          const rid = row && row.dataset.ruleId;
          const r = getGateRules(langId).find((x) => x.rule_id === rid);
          if (r) r.threshold = inp.value.trim();
        });
      });
      $$("#app [data-gate-enabled]").forEach((cb) => {
        cb.addEventListener("change", () => {
          const row = cb.closest("tr[data-rule-id]");
          const rid = row && row.dataset.ruleId;
          const r = getGateRules(langId).find((x) => x.rule_id === rid);
          if (r) r.enabled = cb.checked;
        });
      });
      $$("#app [data-act=del-gate]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const rid = btn.dataset.rid;
          state.gateRules[langId] = getGateRules(langId).filter(
            (x) => x.rule_id !== rid
          );
          render();
          showToast("已删除规则");
        });
      });
      $$("#app [data-act=add-gate]").forEach((btn) => {
        btn.addEventListener("click", () => showAddGateRuleModal(langId));
      });
    }

    $$("#app [data-act=publish]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const env = btn.dataset.env;
        const row = btn.closest("tr");
        const sel = $("select", row);
        const vid = sel && sel.value;
        if (!vid) {
          showToast("请先选择要发布的版本");
          return;
        }
        btn.disabled = true;
        btn.setAttribute("aria-busy", "true");
        askOperator("发布到 " + state.envLabels[env], (op) => {
          doPublish(route.langId, env, vid, op);
          render();
          showToast("已发布到 " + state.envLabels[env]);
        });
      });
    });

    $$("#app [data-act=rollback]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (btn.disabled) return;
        const env = btn.dataset.env;
        const envLabel = state.envLabels[env];
        showConfirmDialog({
          title: "确认回滚",
          message:
            "将把「" +
            envLabel +
            "」环境恢复为上一发布版本，此操作会写入发布历史。",
          confirmLabel: "继续回滚",
          danger: true,
          onConfirm: () => {
            askOperator("回滚 · " + envLabel, (op) => {
              if (!doRollback(route.langId, env, op)) return;
              render();
              showToast("已回滚 " + envLabel);
            });
          },
        });
      });
    });

    $$("#app [data-act=view-config-snap]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const v = getConfigVer(btn.dataset.vid);
        if (v) showConfigSnapModal(v);
      });
    });

    $$("#app [data-act=view-config-report]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const v = getConfigVer(btn.dataset.vid);
        if (v) showConfigReportModal(v);
      });
    });
  }

  function askOperator(title, fn) {
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="modal modal-dialog">' +
      "<h3>" +
      esc(title) +
      "</h3>" +
      '<label for="op-input">操作人姓名或工号 <em>*</em></label>' +
      '<input type="text" id="op-input" value="xf" autocomplete="name" />' +
      '<div class="modal-ft">' +
      '<button type="button" class="btn" data-x>取消</button>' +
      '<button type="button" class="btn btn-primary" data-ok>确定</button></div></div>';
    mountModal(wrap, { focusSelector: "#op-input" });
    wrap.querySelector("[data-x]").onclick = () => closeModal(wrap);
    wrap.querySelector("[data-ok]").onclick = () => {
      const op = $("#op-input", wrap).value.trim();
      if (!op) {
        showToast("请填写操作人");
        return;
      }
      closeModal(wrap);
      fn(op);
    };
  }

  function doPublish(languageId, env, versionId, operator) {
    ensureBindings(languageId);
    const cur = getBind(languageId, env);
    if (cur) {
      if (!state.bindingPrev) state.bindingPrev = {};
      state.bindingPrev[languageId + ":" + env] = { ...cur };
    }
    state.bindings[languageId][env] = {
      admin_prompt_version_id: versionId,
      published_at: new Date().toISOString(),
      published_by: operator,
    };
    if (!state.releaseHistory) state.releaseHistory = [];
    state.releaseHistory.unshift({
      id: "rh-" + Date.now(),
      language_id: languageId,
      environment: env,
      action: "publish",
      from_version: cur ? cur.admin_prompt_version_id : null,
      to_version: versionId,
      operator,
      created_at: new Date().toISOString(),
    });
  }

  function doRollback(languageId, env, operator) {
    const key = languageId + ":" + env;
    const prev = state.bindingPrev && state.bindingPrev[key];
    const cur = getBind(languageId, env);
    if (!prev || !cur) {
      showToast("该环境没有可回滚的上一版本");
      return false;
    }
    ensureBindings(languageId);
    state.bindings[languageId][env] = {
      admin_prompt_version_id: prev.admin_prompt_version_id,
      published_at: new Date().toISOString(),
      published_by: operator,
    };
    if (!state.releaseHistory) state.releaseHistory = [];
    state.releaseHistory.unshift({
      id: "rh-" + Date.now(),
      language_id: languageId,
      environment: env,
      action: "rollback",
      from_version: cur.admin_prompt_version_id,
      to_version: prev.admin_prompt_version_id,
      operator,
      created_at: new Date().toISOString(),
    });
    return true;
  }

  function showConfigSnapModal(v) {
    const wrap = document.createElement("div");
    const blocks = SLOTS.map(
      (k) =>
        "<p><strong>" +
        esc(state.slotLabels[k] || k) +
        "</strong></p><pre class=\"snap-pre\">" +
        esc((v.blocks || {})[k] || "") +
        "</pre>"
    ).join("");
    wrap.innerHTML =
      '<div class="modal modal-wide">' +
      "<h3>已入库 Prompt · " +
      esc(v.version_label) +
      "</h3>" +
      '<p class="sub">' +
      esc(v.changelog || "") +
      "</p>" +
      blocks +
      '<div class="modal-ft"><button type="button" class="btn" data-x>关闭</button></div></div>';
    mountModal(wrap);
    wrap.querySelector("[data-x]").onclick = () => closeModal(wrap);
  }

  function showConfigReportModal(v) {
    if (!v.eval_report_id) {
      showToast("该版本无关联评测报告");
      return;
    }
    const rep =
      (state.evalReports && state.evalReports[v.eval_report_id]) ||
      (v.eval_task_id && getTask(v.eval_task_id) && state.reports
        ? state.reports[
            getTask(v.eval_task_id).report_id
          ]
        : null);
    const tpl = state.evalReportUrlTemplate || "";
    const url = tpl
      ? tpl
          .replace("{report_id}", encodeURIComponent(v.eval_report_id))
          .replace("{task_id}", encodeURIComponent(v.eval_task_id || ""))
      : null;
    const wrap = document.createElement("div");
    const body = rep
      ? "<p><strong>" +
        esc(rep.title || "评测报告") +
        "</strong>" +
        (rep.verdict
          ? ' <span class="badge badge-usable">' + esc(rep.verdict) + "</span>"
          : rep.gate_result
            ? ' <span class="badge badge-' +
              esc(rep.gate_result) +
              '">' +
              esc(state.gateLabels[rep.gate_result] || rep.gate_result) +
              "</span>"
            : "") +
        "</p><p>" +
        esc(rep.summary) +
        "</p>" +
        (rep.highlights
          ? "<ul class=\"gate-rules-list\">" +
            rep.highlights.map((h) => "<li>" + esc(h) + "</li>").join("") +
            "</ul>"
          : rep.dimensions
            ? "<ul class=\"gate-rules-list\">" +
              rep.dimensions
                .map(
                  (d) =>
                    "<li>" +
                    esc(d.name) +
                    "：平台=" +
                    d.score0 +
                    " 人工=" +
                    d.score1 +
                    "</li>"
                )
                .join("") +
              "</ul>"
            : "")
      : '<p class="sub mono">report ' + esc(v.eval_report_id) + "</p>";
    wrap.innerHTML =
      '<div class="modal modal-wide">' +
      "<h3>评测报告 · " +
      esc(v.version_label) +
      "</h3>" +
      body +
      '<div class="modal-ft">' +
      (url
        ? '<a class="btn btn-primary" href="' +
          esc(url) +
          '" target="_blank" rel="noopener">外链（占位）</a>'
        : "") +
      '<button type="button" class="btn" data-x>关闭</button></div></div>';
    mountModal(wrap);
    wrap.querySelector("[data-x]").onclick = () => closeModal(wrap);
  }

  function showAddGateRuleModal(langId) {
    const templates = state.gateRuleTemplates || [
      {
        label: "全剧整体 · 均分差（平台−人工）",
        operator: "≥",
      },
      { label: "落后维度个数", operator: "≤" },
      { label: "裁判共识（score0≥score1）", operator: "≥" },
      { label: "工程违规率", operator: "≤" },
    ];
    const wrap = document.createElement("div");
    const opts = templates
      .map(
        (t, i) =>
          '<option value="' +
          i +
          '">' +
          esc(t.label) +
          " " +
          esc(t.operator) +
          "</option>"
      )
      .join("");
    wrap.innerHTML =
      '<div class="modal modal-form">' +
      "<h3>添加可用规则</h3>" +
      '<div class="form-field"><label>规则类型</label>' +
      '<select id="g-type" class="lang-select">' +
      opts +
      "</select></div>" +
      '<div class="form-field"><label for="g-th">阈值</label>' +
      '<input id="g-th" type="text" placeholder="按语种填写，如无默认" /></div>' +
      '<div class="modal-ft">' +
      '<button type="button" class="btn" data-x>取消</button>' +
      '<button type="button" class="btn btn-primary" data-ok>添加</button></div></div>';
    mountModal(wrap, { focusSelector: "#g-th" });
    wrap.querySelector("[data-x]").onclick = () => closeModal(wrap);
    wrap.querySelector("[data-ok]").onclick = () => {
      const idx = parseInt($("#g-type", wrap).value, 10);
      const tpl = templates[idx];
      if (!tpl) return;
      const th = $("#g-th", wrap).value.trim();
      getGateRules(langId).push({
        rule_id: "R-" + Date.now(),
        label: tpl.label,
        operator: tpl.operator,
        threshold: th,
        enabled: true,
      });
      closeModal(wrap);
      render();
      showToast("已添加可用规则");
    };
  }

  function showNewLangModal() {
    const defs = state.newLangFormDefaults || {
      source_lang: "zh",
      target_lang: "",
    };
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="modal modal-form modal-wide modal-dialog">' +
      "<h3>新建语种</h3>" +
      '<p class="sub">语对从配置列表选择（开发/联调时由接口或配置中心下发）</p>' +
      '<div class="form-field"><label for="f-source">源语言</label>' +
      buildLangSelect("f-source", defs.source_lang, false) +
      "</div>" +
      '<div class="form-field"><label for="f-target">目标语言</label>' +
      buildLangSelect("f-target", defs.target_lang, true) +
      '<p class="form-preview" id="f-preview"></p></div>' +
      '<div class="form-field"><label for="f-owner">负责人</label>' +
      '<input type="text" id="f-owner" placeholder="可选" /></div>' +
      '<div class="form-field"><label for="f-remark">备注</label>' +
      '<input type="text" id="f-remark" placeholder="可选" /></div>' +
      '<div class="modal-ft">' +
      '<button type="button" class="btn" data-x>取消</button>' +
      '<button type="button" class="btn btn-primary" data-ok>创建</button></div></div>';
    mountModal(wrap, { focusSelector: "#f-target" });
    wrap.querySelector("[data-x]").onclick = () => closeModal(wrap);
    const syncPreview = () => {
      const source = $("#f-source", wrap).value;
      const target = $("#f-target", wrap).value;
      const el = $("#f-preview", wrap);
      if (!el) return;
      el.textContent =
        source && target
          ? "将创建：「" + pairName(source, target) + "」"
          : source
            ? "请选择目标语言"
            : "";
    };
    $("#f-source", wrap)?.addEventListener("change", syncPreview);
    $("#f-target", wrap)?.addEventListener("change", syncPreview);
    syncPreview();

    wrap.querySelector("[data-ok]").onclick = () => {
      const source = $("#f-source", wrap).value;
      const target = $("#f-target", wrap).value;
      if (!source || !target) {
        showToast("请选择源语言和目标语言");
        return;
      }
      if (source === target) {
        showToast("源语言与目标语言不能相同");
        return;
      }
      const id = "lang_" + target + "_" + source;
      if (getLang(id)) {
        showToast("该语对已存在");
        return;
      }
      state.languages.push({
        language_id: id,
        source_lang: source,
        target_lang: target,
        owner: $("#f-owner", wrap).value.trim() || "—",
        remark: $("#f-remark", wrap).value.trim() || "",
        status: "none",
        created_at: new Date().toISOString(),
      });
      if (!state.gateRules[id]) state.gateRules[id] = [];
      ensureBindings(id);
      closeModal(wrap);
      location.hash =
        route.module === "iter" ? hrefIterLang(id) : hrefConfigLang(id);
      render();
    };
  }

  function createDraft(langId) {
    const n = getPrompts(langId).length + 1;
    const id = "epv-" + Date.now();
    const prev = getPrompts(langId)[0];
    const blocks = prev
      ? JSON.parse(JSON.stringify(prev.blocks || {}))
      : { system: "", name_mapping: "", engineering: "" };
    blocks.system = platformSystemPrompt(langId);
    state.promptVersions.push({
      eval_prompt_version_id: id,
      language_id: langId,
      version_label: "v" + n,
      state: "draft",
      changelog: "新建语种规则版本",
      updated_at: new Date().toISOString(),
      blocks: blocks,
      last_task_id: null,
      gate_result: null,
      admin_prompt_version_id: null,
    });
    showPromptModal(langId, id, { isNewDraft: true });
  }

  function showPromptModal(langId, pvId, opts) {
    const p = getPrompt(pvId);
    if (!p) return;
    const isNewDraft = !!(opts && opts.isNewDraft);
    let modalSavedOnce = false;
    modalPvId = pvId;
    activeSlot = "name_mapping";
    ensureSystemBlock(p, langId);
    let lastCommitted = {
      blocks: JSON.parse(JSON.stringify(p.blocks || {})),
      changelog: p.changelog,
      updated_at: p.updated_at,
    };
    let draftBlocks = JSON.parse(JSON.stringify(p.blocks || {}));
    draftBlocks.system = platformSystemPrompt(langId);
    let draftChangelog = p.changelog || "";

    const wrap = document.createElement("div");
    wrap.setAttribute("data-prompt-modal", "1");
    let promptModalMounted = false;

    function flushDraftFromUi() {
      const pv = getPrompt(modalPvId);
      if (!pv) return;
      const ta = wrap.querySelector("[data-slot-content]");
      if (ta && slotIsEditable(activeSlot, pv)) {
        draftBlocks[activeSlot] = ta.value;
      }
      const cl = wrap.querySelector("#f-changelog");
      if (cl && pv.state !== "submitted") draftChangelog = cl.value.trim();
    }

    function commitDraftToVersion() {
      const pv = getPrompt(modalPvId);
      if (!pv || pv.state === "submitted") return false;
      flushDraftFromUi();
      pv.blocks = JSON.parse(JSON.stringify(draftBlocks));
      ensureSystemBlock(pv, langId);
      draftBlocks.system = pv.blocks.system;
      pv.changelog = draftChangelog;
      pv.updated_at = new Date().toISOString();
      lastCommitted = {
        blocks: JSON.parse(JSON.stringify(pv.blocks)),
        changelog: pv.changelog,
        updated_at: pv.updated_at,
      };
      modalSavedOnce = true;
      return true;
    }

    function paint() {
      const pv = getPrompt(modalPvId);
      if (!pv) return;
      const versionLocked = pv.state === "submitted";
      const canSubmit = isUsable(pv);
      draftBlocks.system = platformSystemPrompt(langId);
      const slotContent =
        activeSlot === "system"
          ? draftBlocks.system
          : draftBlocks[activeSlot] || "";
      const slotEditable = slotIsEditable(activeSlot, pv);
      const savedHint = modalSavedOnce
        ? "已保存 " + fmtDate(pv.updated_at)
        : pv.updated_at
          ? "未保存的修改 · 上次保存 " + fmtDate(pv.updated_at)
          : "尚未保存";
      const editorHtml =
        '<div class="slot-editor-pane">' +
        (activeSlot === "system"
          ? '<pre class="slot-editor-view">' + esc(slotContent) + "</pre>"
          : '<div class="block-editor"><textarea data-slot-content' +
            (slotEditable ? "" : " disabled") +
            ">" +
            esc(slotContent) +
            "</textarea></div>") +
        "</div>";

      wrap.innerHTML =
        '<div class="modal modal-wide">' +
        "<h3>语种规则版本 · " +
        esc(pv.version_label) +
        " " +
        promptStatusBadge(pv) +
        "</h3>" +
        '<div class="form-field"><label for="f-changelog">changelog <span class="sub">（可选）</span></label>' +
        '<input type="text" id="f-changelog" value="' +
        esc(draftChangelog) +
        '"' +
        (versionLocked ? " disabled" : "") +
        ' placeholder="可选：简述本版改动" /></div>' +
        '<p class="tool-hint"><code>system</code> 为平台内置，<strong>仅可查看</strong>；专家在 <code>name_mapping</code> / <code>engineering</code> 中撰写语种规则</p>' +
        '<div class="slot-tabs">' +
        SLOTS.map(
          (s) =>
            '<button type="button" data-slot="' +
            s +
            '"' +
            (activeSlot === s ? ' class="active"' : "") +
            ">" +
            esc(state.slotLabels[s]) +
            (s === "system" ? ' <span class="tab-tag">只读</span>' : "") +
            "</button>"
        ).join("") +
        "</div>" +
        '<p class="sub">' +
        esc(state.slotHints[activeSlot]) +
        "</p>" +
        editorHtml +
        '<p class="save-hint" data-save-hint>' +
        esc(savedHint) +
        "</p>" +
        '<div class="modal-ft">' +
        (versionLocked
          ? ""
          : '<button type="button" class="btn" data-save>保存</button>') +
        '<button type="button" class="btn btn-primary" data-submit' +
        (canSubmit ? "" : " disabled") +
        ">提交可应用</button>" +
        '<button type="button" class="btn" data-x>关闭</button></div></div>';

      wrap.querySelector("[data-x]").onclick = () => closePromptModal(true, true);
      wrap.querySelectorAll("[data-slot]").forEach((btn) => {
        btn.onclick = () => {
          if (!versionLocked) flushDraftFromUi();
          activeSlot = btn.dataset.slot;
          paint();
        };
      });
      const saveBtn = wrap.querySelector("[data-save]");
      if (saveBtn) {
        saveBtn.onclick = () => {
          if (commitDraftToVersion()) {
            closePromptModal(true, false);
          }
        };
      }
      const sub = wrap.querySelector("[data-submit]");
      if (sub) {
        sub.onclick = () => {
          if (!commitDraftToVersion()) return;
          render();
          closePromptModal(false, true);
          showSubmitModal(langId, pvId);
        };
      }
    }

    function closePromptModal(refresh, discard) {
      const pv = getPrompt(modalPvId);
      if (discard && pv) {
        if (isNewDraft && !modalSavedOnce) {
          state.promptVersions = state.promptVersions.filter(
            (x) => x.eval_prompt_version_id !== pv.eval_prompt_version_id
          );
        } else {
          pv.blocks = JSON.parse(JSON.stringify(lastCommitted.blocks));
          pv.changelog = lastCommitted.changelog;
          pv.updated_at = lastCommitted.updated_at;
        }
      }
      modalPvId = null;
      closeModal(wrap);
      if (refresh) render();
    }

    paint();
    if (!promptModalMounted) {
      document.body.appendChild(wrap);
      mountModal(wrap, {
        onEscape: () => closePromptModal(true, true),
      });
      promptModalMounted = true;
    }
  }

  function saveModalSlot() {
    if (!modalPvId) return;
    const p = getPrompt(modalPvId);
    const wrap = document.querySelector("[data-prompt-modal='1']");
    const ta = wrap && wrap.querySelector("[data-slot-content]");
    if (!p || !ta || !slotIsEditable(activeSlot, p)) return;
    if (!p.blocks) p.blocks = {};
    p.blocks[activeSlot] = ta.value;
  }

  function savePromptAll() {
    if (!modalPvId) return false;
    const p = getPrompt(modalPvId);
    const wrap = document.querySelector("[data-prompt-modal='1']");
    if (!p || !wrap || p.state === "submitted") return false;
    saveModalSlot();
    ensureSystemBlock(p, p.language_id);
    const cl = $("#f-changelog", wrap);
    if (cl) p.changelog = cl.value.trim();
    p.updated_at = new Date().toISOString();
    const hint = wrap.querySelector("[data-save-hint]");
    if (hint) hint.textContent = "已保存 " + fmtDate(p.updated_at);
    return true;
  }

  function showNewTaskModal(langId) {
    const prompts = getPrompts(langId).filter(
      (p) => promptDisplayStatus(p).key !== "running"
    );
    if (!prompts.length) {
      showToast(
        "没有可选的语种规则版本（「评测中」的不可选；请先新建或等待任务结束）"
      );
      return;
    }
    const dramas = state.pilotDramas || [];
    const defs = state.taskFormDefaults || { episode_range: "前 3 集" };

    const wrap = document.createElement("div");
    const versionItems = prompts.map((p) => ({
      value: p.eval_prompt_version_id,
      label: p.version_label,
      sub: promptDisplayStatus(p).label,
    }));
    const dramaItems = dramas.map((d) => ({
      value: d,
      label: d,
    }));

    wrap.innerHTML =
      '<div class="modal modal-form modal-wide">' +
      "<h3>创建评测任务</h3>" +
      '<div class="form-field"><label>语种规则版本</label>' +
      '<p class="sub">点选 1～2 个（单版本评测或双版本对比；评测中的不展示）</p>' +
      pickListHtml("version", versionItems, { max: 2 }) +
      "</div>" +
      '<div class="form-field"><label>试点剧</label>' +
      '<p class="sub">点选切换，至少 1 部</p>' +
      pickListHtml("drama", dramaItems) +
      "</div>" +
      '<div class="form-field"><label for="t-range">评测集数</label>' +
      '<select id="t-range" class="lang-select">' +
      '<option value="前 3 集"' +
      (defs.episode_range === "前 3 集" ? " selected" : "") +
      ">前 3 集</option>" +
      '<option value="前 5 集">前 5 集</option>' +
      '<option value="全剧">全剧</option></select></div>' +
      '<div class="modal-ft">' +
      '<button type="button" class="btn" data-x>取消</button>' +
      '<button type="button" class="btn btn-primary" data-ok>创建评测任务</button></div></div>';
    mountModal(wrap);
    bindPickList(wrap);
    wrap.querySelector("[data-x]").onclick = () => closeModal(wrap);
    wrap.querySelector("[data-ok]").onclick = () => {
      const pvIds = getPickValues(wrap, "version");
      const pvs = pvIds.map((id) => getPrompt(id)).filter(Boolean);
      const selected = getPickValues(wrap, "drama");
      if (!pvs.length) {
        showToast("请至少选择 1 个语种规则版本");
        return;
      }
      if (pvs.length > 2) {
        showToast("最多选择 2 个语种规则版本");
        return;
      }
      if (!selected.length) {
        showToast("请至少选择一部试点剧");
        return;
      }
      const range = $("#t-range", wrap).value;
      const labels = pvs.map((p) => p.version_label);
      const taskId = "task-" + Date.now();
      state.evalTasks.unshift({
        task_id: taskId,
        language_id: langId,
        eval_prompt_version_ids: pvIds,
        version_labels: labels,
        eval_prompt_version_id: pvIds[pvIds.length - 1],
        version_label: labels.length > 1 ? labels.join(" vs ") : labels[0],
        report_kind: labels.length > 1 ? "compare" : "analysis",
        dramas: selected,
        episode_range: range,
        status: "running",
        created_at: new Date().toISOString(),
        finished_at: null,
        report_id: null,
        gate_result: null,
      });
      pvs.forEach((pv) => {
        pv.last_task_id = taskId;
      });
      closeModal(wrap);
      render();
      showToast(
        "评测任务已创建 · " +
          (labels.length > 1 ? labels.join(" vs ") : labels[0]) +
          " · 运行中"
      );
    };
  }

  function showReportModal(taskId) {
    const t = getTask(taskId);
    if (!t) return;
    const rep = t.report_id && state.reports[t.report_id];
    const kind = taskReportKind(t);
    const kindLabel = taskReportLabel(t);

    const dims = rep
      ? rep.dimensions
          .map(
            (d) =>
              "<li>" +
              esc(d.name) +
              "：平台=" +
              d.score0 +
              " 人工=" +
              d.score1 +
              (d.win ? " ✓" : "") +
              "</li>"
          )
          .join("")
      : "";
    const compareBlock =
      rep && kind === "compare" && rep.compare_summary
        ? '<p><strong>版本对比</strong></p><p>' +
          esc(rep.compare_summary) +
          "</p>" +
          (rep.compare_dimensions
            ? "<ul class=\"gate-rules-list\">" +
              rep.compare_dimensions
                .map(
                  (d) =>
                    "<li>" +
                    esc(d.name) +
                    "：" +
                    esc(d.verdict || "") +
                    "</li>"
                )
                .join("") +
              "</ul>"
            : "")
        : "";

    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="modal modal-wide modal-dialog">' +
      "<h3>" +
      esc(kindLabel) +
      " · " +
      esc(taskVersionDisplay(t)) +
      "</h3>" +
      '<p class="sub">' +
      esc(t.dramas.join("、")) +
      " · " +
      esc(t.episode_range) +
      " · 结论由专家阅读后人工标可用</p>" +
      (rep
        ? "<p>" +
          esc(rep.summary) +
          "</p>" +
          compareBlock +
          '<p><strong>维度（平台 vs 人工）</strong></p><ul class="gate-rules-list">' +
          dims +
          "</ul>"
        : '<p class="empty">报告生成中</p>') +
      '<div class="modal-ft"><button type="button" class="btn" data-x>关闭</button></div></div>';
    mountModal(wrap);
    wrap.querySelector("[data-x]").onclick = () => closeModal(wrap);
  }

  function showSubmitModal(langId, pvId) {
    const l = getLang(langId);
    const p = getPrompt(pvId);
    const t = p && p.last_task_id ? getTask(p.last_task_id) : null;
    if (!l) return;
    const rep = t && t.report_id ? state.reports[t.report_id] : null;
    if (!isUsable(p)) {
      showToast("请先由专家标为「可用」后再提交");
      return;
    }

    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="modal modal-dialog">' +
      "<h3>提交可应用</h3>" +
      "<p>版本 <strong>" +
      esc(p.version_label) +
      "</strong> → 发布管理模块自动入库</p>" +
      "<ul class=\"gate-rules-list\"><li>语种：" +
      esc(pairName(l.source_lang, l.target_lang)) +
      "</li><li>状态：" +
      esc(promptDisplayStatus(p).label) +
      "</li></ul>" +
      (rep ? "<p class=\"sub\">" + esc(rep.summary) + "</p>" : "") +
      '<div class="modal-ft">' +
      '<button type="button" class="btn" data-x>取消</button>' +
      '<button type="button" class="btn btn-primary" data-ok>确认提交</button></div></div>';
    mountModal(wrap);
    wrap.querySelector("[data-x]").onclick = () => closeModal(wrap);
    wrap.querySelector("[data-ok]").onclick = () => {
      const apvId = "apv-" + Date.now();
      const t = p.last_task_id ? getTask(p.last_task_id) : null;
      if (!state.configVersions) state.configVersions = [];
      const dup = state.configVersions.some(
        (v) => v.eval_prompt_version_id === pvId
      );
      if (!dup) {
        state.configVersions.push({
          admin_prompt_version_id: apvId,
          language_id: langId,
          version_label: p.version_label,
          source: "eval_submit",
          changelog: p.changelog || "译评提交可应用",
          submitted_at: new Date().toISOString(),
          blocks: JSON.parse(JSON.stringify(p.blocks || {})),
          eval_task_id: t ? t.task_id : null,
          eval_report_id: t ? t.report_id : null,
          gate_result: p.gate_result || (t && t.gate_result) || "pass",
          eval_prompt_version_id: pvId,
        });
      }
      p.state = "submitted";
      p.admin_prompt_version_id = apvId;
      closeModal(wrap);
      location.hash = hrefConfigLang(langId);
      render();
      showToast("已提交可应用 · 请到发布管理查看已入库版本");
    };
  }

  window.addEventListener("hashchange", render);
  document.addEventListener("DOMContentLoaded", () => {
    if (normalizeHash()) return;
    const h = location.hash;
    if (h.includes("/prompts/") || h.includes("/tasks/")) {
      const m = h.match(/#\/(?:iter|config)\/lang\/([^/]+)/) || h.match(/#\/lang\/([^/]+)/);
      if (m) location.replace("#/iter/lang/" + m[1]);
      return;
    }
    render();
  });
})();
