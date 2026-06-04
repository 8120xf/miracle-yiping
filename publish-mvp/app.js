(function () {
  "use strict";

  const LANG_NAMES = {
    zh: "中文",
    de: "德语",
    es: "西班牙语",
    pt: "葡萄牙语",
    en: "英语",
    ja: "日语",
    ko: "韩语",
  };

  const SOURCE_LABELS = { manual: "手工录入", eval_submit: "译评提交" };

  const init = window.PUBLISH_MVP_INITIAL || {};
  const state = {
    languages: JSON.parse(JSON.stringify(init.languages || [])),
    prompts: JSON.parse(JSON.stringify(init.prompts || [])),
    currentPublish: JSON.parse(JSON.stringify(init.currentPublish || {})),
    statusLabels: init.statusLabels || {},
    langOptions: init.langOptions || [],
    newLangFormDefaults: init.newLangFormDefaults || {
      source_lang: "zh",
      target_lang: "",
    },
    newLangTargetPlaceholder: init.newLangTargetPlaceholder || "请选择目标语言",
  };

  /** 兼容旧 mock（configVersions + admin_prompt_version_id） */
  (function normalizeLegacyData() {
    if (!state.prompts.length && init.configVersions && init.configVersions.length) {
      const byLang = {};
      init.configVersions.forEach((v) => {
        if (!byLang[v.language_id]) byLang[v.language_id] = [];
        byLang[v.language_id].push(v);
      });
      Object.keys(byLang).forEach((langId) => {
        byLang[langId]
          .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
          .forEach((v, i) => {
            state.prompts.push({
              prompt_id: v.admin_prompt_version_id,
              language_id: v.language_id,
              seq: i + 1,
              source: v.source,
              changelog: v.changelog,
              submitted_at: v.submitted_at,
              prompt_text: v.prompt_text,
            });
          });
      });
    }
    Object.keys(state.currentPublish).forEach((langId) => {
      const b = state.currentPublish[langId];
      if (b && b.admin_prompt_version_id && !b.prompt_id) {
        b.prompt_id = b.admin_prompt_version_id;
      }
    });
  })();

  let route = { view: "list", langId: null };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }
  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function langLabel(code) {
    const o = state.langOptions.find((x) => x.code === code);
    return o ? o.label : LANG_NAMES[code] || code;
  }
  function pairName(src, tgt) {
    return langLabel(src) + " → " + langLabel(tgt);
  }
  function buildLangSelect(id, selectedCode, withPlaceholder) {
    const opts = state.langOptions;
    let html =
      '<select id="' +
      id +
      '" class="lang-select">' +
      (withPlaceholder
        ? '<option value="">' + esc(state.newLangTargetPlaceholder) + "</option>"
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
  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }
  function fmtSeq(seq) {
    return seq == null ? "—" : String(seq);
  }
  function hrefList() {
    return "#/";
  }
  function hrefLang(id) {
    return "#/lang/" + encodeURIComponent(id);
  }

  function parseHash() {
    const h = (location.hash || "#/").replace(/^#/, "");
    const m = /^\/lang\/([^/]+)/.exec(h);
    if (m) {
      route = { view: "detail", langId: decodeURIComponent(m[1]) };
    } else {
      route = { view: "list", langId: null };
    }
  }

  function getLang(id) {
    return state.languages.find((l) => l.language_id === id);
  }
  function getPrompts(langId) {
    return state.prompts
      .filter((p) => p.language_id === langId)
      .sort((a, b) => b.seq - a.seq);
  }
  function getPrompt(pid) {
    return state.prompts.find((p) => p.prompt_id === pid);
  }
  function getCurrent(langId) {
    return state.currentPublish[langId] || null;
  }
  function nextSeq(langId) {
    const items = getPrompts(langId);
    if (!items.length) return 1;
    return Math.max(...items.map((p) => Number(p.seq) || 0)) + 1;
  }

  function render() {
    parseHash();
    const app = $("#app");
    if (!app) return;
    try {
      app.innerHTML =
        route.view === "detail" && route.langId
          ? renderDetail(route.langId)
          : renderList();
      bindEvents();
    } catch (err) {
      console.error(err);
      app.innerHTML =
        '<div class="page"><p class="empty">页面加载失败：' +
        esc(err && err.message ? err.message : String(err)) +
        "</p></div>";
    }
  }

  function renderList() {
    const rows = state.languages
      .map((l) => {
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
          esc(l.owner) +
          '</td><td class="col-actions">' +
          '<button type="button" class="btn btn-sm btn-link" data-act="go-detail" data-id="' +
          esc(l.language_id) +
          '">详情</button></td></tr>'
        );
      })
      .join("");

    return (
      '<div class="page">' +
      '<div class="page-head">' +
      "<div><h1>语种列表</h1>" +
      '<p class="lede">管理各语种的 Prompt 条目（按序号入库），手工录入后发布到<strong>当前环境</strong></p></div>' +
      '<button type="button" class="btn btn-primary" data-act="new-lang">+ 新建语种</button></div>' +
      '<div class="card"><table class="table">' +
      "<thead><tr><th>语种</th><th>语对</th><th>负责人</th><th>操作</th></tr></thead>" +
      "<tbody>" +
      (rows ||
        '<tr><td colspan="4" class="empty">暂无语种</td></tr>') +
      "</tbody></table></div></div>"
    );
  }

  function renderDetail(langId) {
    const l = getLang(langId);
    if (!l) {
      return (
        '<div class="page">' +
        renderBack() +
        '<p class="empty">语种不存在</p></div>'
      );
    }

    const cur = getCurrent(langId);
    const snaps = getPrompts(langId);
    const curPid = cur ? cur.prompt_id : null;
    const rows = snaps
      .map((p) => {
        const isLive = p.prompt_id === curPid;
        const src = SOURCE_LABELS[p.source] || p.source;
        return (
          "<tr" +
          (isLive ? ' class="row-live"' : "") +
          ">" +
          '<td class="col-seq"><strong>' +
          esc(fmtSeq(p.seq)) +
          "</strong>" +
          (isLive ? ' <span class="tag-live">生效中</span>' : "") +
          "</td>" +
          '<td><span class="badge badge-source">' +
          esc(src) +
          "</span></td>" +
          "<td>" +
          esc(p.changelog || "—") +
          "</td>" +
          '<td class="sub">' +
          esc(fmtDate(p.submitted_at)) +
          '</td><td class="col-actions">' +
          '<button type="button" class="btn btn-sm btn-link" data-act="view-prompt" data-pid="' +
          esc(p.prompt_id) +
          '">查看</button>' +
          (isLive
            ? ""
            : ' <button type="button" class="btn btn-sm btn-publish" data-act="publish" data-pid="' +
              esc(p.prompt_id) +
              '">发布</button>') +
          "</td></tr>"
        );
      })
      .join("");

    return (
      '<div class="page page-detail">' +
      renderBack() +
      '<div class="page-head">' +
      "<div><h1>" +
      esc(pairName(l.source_lang, l.target_lang)) +
      "</h1></div>" +
      '<button type="button" class="btn btn-primary" data-act="new-prompt">+ 新增 Prompt</button></div>' +
      '<section class="section">' +
      '<div class="section-head"><h2>Prompt 列表</h2>' +
      '<span class="sub">共 ' +
      snaps.length +
      " 条 · 序号同语种内自动递增</span></div>" +
      '<div class="card">' +
      (snaps.length
        ? '<table class="table"><thead><tr><th>序号</th><th>来源</th><th>备注</th><th>入库时间</th><th>操作</th></tr></thead><tbody>' +
          rows +
          "</tbody></table>"
        : '<p class="empty">暂无 Prompt · 点击「新增 Prompt」手工录入，入库时自动分配序号</p>') +
      "</div></section></div>"
    );
  }

  function renderBack() {
    return (
      '<nav class="back"><a href="' +
      esc(hrefList()) +
      '">← 语种列表</a></nav>'
    );
  }

  function bindEvents() {
    $$("#app tr.clickable[data-go]").forEach((tr) => {
      tr.addEventListener("click", (e) => {
        if (e.target.closest("[data-act=go-detail]")) return;
        location.hash = hrefLang(tr.dataset.go);
      });
    });
    $$("#app [data-act=go-detail]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        location.hash = hrefLang(btn.dataset.id);
      });
    });
    $$("#app [data-act=new-lang]").forEach((btn) => {
      btn.addEventListener("click", () => showNewLangModal());
    });
    $$("#app [data-act=new-prompt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (route.langId) showNewPromptModal(route.langId);
      });
    });
    $$("#app [data-act=view-prompt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = getPrompt(btn.dataset.pid);
        if (p) showPromptModal(p);
      });
    });
    $$("#app [data-act=publish]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (route.langId) publishPrompt(route.langId, btn.dataset.pid);
      });
    });
  }

  function showToast(msg) {
    let el = $(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("is-visible"), 2800);
  }

  function mountModal(inner, opts) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.appendChild(inner);
    document.body.appendChild(backdrop);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal(backdrop);
    });
    const focus = opts && opts.focusSelector && $(opts.focusSelector, inner);
    if (focus) focus.focus();
    return backdrop;
  }
  function closeModal(backdrop) {
    if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  }

  function showPromptModal(p) {
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="modal modal-wide modal-prompt">' +
      "<h3>Prompt · 序号 " +
      esc(fmtSeq(p.seq)) +
      "</h3>" +
      '<p class="sub">' +
      esc(p.changelog || "") +
      " · " +
      esc(SOURCE_LABELS[p.source] || p.source) +
      (p.owner && p.owner !== "—" ? " · 负责人 " + esc(p.owner) : "") +
      "</p>" +
      '<pre class="prompt-pre">' +
      esc(p.prompt_text || "") +
      "</pre>" +
      '<div class="modal-ft"><button type="button" class="btn" data-x>关闭</button></div></div>';
    const backdrop = mountModal(wrap);
    wrap.querySelector("[data-x]").onclick = () => closeModal(backdrop);
  }

  function showNewLangModal() {
    const defs = state.newLangFormDefaults;
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="modal modal-form modal-wide">' +
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
    const backdrop = mountModal(wrap, { focusSelector: "#f-target" });
    wrap.querySelector("[data-x]").onclick = () => closeModal(backdrop);
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
      closeModal(backdrop);
      location.hash = hrefLang(id);
      render();
      showToast("已创建语种");
    };
  }

  function showNewPromptModal(langId) {
    const lang = getLang(langId);
    const defaultOwner =
      lang && lang.owner && lang.owner !== "—" ? lang.owner : "";
    const next = nextSeq(langId);
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="modal modal-form modal-wide modal-prompt">' +
      "<h3>新增 Prompt</h3>" +
      '<p class="sub">入库后分配序号为 <strong>' +
      esc(String(next)) +
      "</strong>，保存后可在列表中发布</p>" +
      '<div class="form-field"><label for="np-owner">负责人</label>' +
      '<input type="text" id="np-owner" value="' +
      esc(defaultOwner) +
      '" placeholder="姓名或工号" /></div>' +
      '<div class="form-field"><label for="np-note">备注（可选）</label>' +
      '<input type="text" id="np-note" placeholder="如：应急基线、PE 粘贴" /></div>' +
      '<div class="form-field"><label for="np-body">Prompt 内容 <em>*</em></label>' +
      '<textarea id="np-body" rows="14" placeholder="粘贴完整 Prompt 文本"></textarea></div>' +
      '<div class="modal-ft">' +
      '<button type="button" class="btn" data-x>取消</button>' +
      '<button type="button" class="btn btn-primary" data-ok>保存并入库</button></div></div>';
    const backdrop = mountModal(wrap, { focusSelector: "#np-body" });
    wrap.querySelector("[data-x]").onclick = () => closeModal(backdrop);
    wrap.querySelector("[data-ok]").onclick = () => {
      const body = $("#np-body", wrap).value.trim();
      if (!body) {
        showToast("请填写 Prompt 内容");
        return;
      }
      const seq = nextSeq(langId);
      const id = "prm-" + Date.now();
      state.prompts.push({
        prompt_id: id,
        language_id: langId,
        seq: seq,
        source: "manual",
        changelog: $("#np-note", wrap).value.trim() || "手工录入",
        owner: $("#np-owner", wrap).value.trim() || "—",
        submitted_at: new Date().toISOString(),
        prompt_text: body,
      });
      closeModal(backdrop);
      render();
      showToast("已入库 · 序号 " + seq);
    };
  }

  function publishPrompt(langId, promptId) {
    const p = getPrompt(promptId);
    if (!p) return;
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="modal modal-dialog">' +
      "<h3>发布到当前环境</h3>" +
      '<p>将序号 <strong>' +
      esc(fmtSeq(p.seq)) +
      "</strong> 设为当前环境生效 Prompt。</p>" +
      '<label for="pub-op">操作人 <em>*</em></label>' +
      '<input type="text" id="pub-op" value="xf" />' +
      '<div class="modal-ft">' +
      '<button type="button" class="btn" data-x>取消</button>' +
      '<button type="button" class="btn btn-primary" data-ok>确认发布</button></div></div>';
    const backdrop = mountModal(wrap, { focusSelector: "#pub-op" });
    wrap.querySelector("[data-x]").onclick = () => closeModal(backdrop);
    wrap.querySelector("[data-ok]").onclick = () => {
      const op = $("#pub-op", wrap).value.trim();
      if (!op) {
        showToast("请填写操作人");
        return;
      }
      state.currentPublish[langId] = {
        prompt_id: promptId,
        published_at: new Date().toISOString(),
        published_by: op,
      };
      const lang = getLang(langId);
      if (lang) lang.status = lang.status === "none" ? "staging" : lang.status;
      closeModal(backdrop);
      render();
      showToast("已发布 · 序号 " + p.seq);
    };
  }

  window.addEventListener("hashchange", render);
  if (!location.hash) location.hash = "#/";
  render();
})();
