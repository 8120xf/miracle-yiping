(function () {
  "use strict";

  const ENVS = ["test", "staging", "production"];
  const LANG_NAME = {
    zh: "中文",
    de: "德语",
    es: "西班牙语",
    pt: "葡萄牙语",
    fr: "法语",
  };

  if (!window.ADMIN_MOCK_INITIAL) {
    document.addEventListener("DOMContentLoaded", () => {
      const el = document.getElementById("app");
      if (el) {
        el.innerHTML =
          '<div class="page empty">未加载 mock-data.js，请用文件夹内 index.html 打开，或运行 <code>python3 -m http.server</code></div>';
      }
    });
    return;
  }

  let state = JSON.parse(JSON.stringify(window.ADMIN_MOCK_INITIAL));
  let route = { page: "list", langId: null };

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
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getLang(id) {
    return state.languages.find((l) => l.language_id === id);
  }
  function getVersions(id) {
    return state.versions.filter((v) => v.language_id === id);
  }
  function getVer(id) {
    return state.versions.find((v) => v.admin_prompt_version_id === id);
  }
  function verLabel(id) {
    const v = getVer(id);
    if (v) return v.version_label;
    if (!id) return "—";
    const m = String(id).match(/(\d+)$/);
    return m ? "#" + m[1] : id;
  }
  function nextVersionLabel(langId) {
    const n = getVersions(langId).length + 1;
    return "v" + n;
  }
  function getBind(langId, env) {
    const b = state.bindings[langId];
    return b && b[env] ? b[env] : null;
  }

  function parseRoute() {
    const p = (location.hash || "#/").slice(1).split("/").filter(Boolean);
    const id = p[1];
    if ((p[0] === "lang" || p[0] === "language") && id) {
      route = { page: "detail", langId: decodeURIComponent(id) };
    } else {
      route = { page: "list", langId: null };
    }
  }

  function goList() {
    location.hash = "#/";
  }
  function goLang(id) {
    location.hash = "#/lang/" + encodeURIComponent(id);
  }

  function pairDisplayName(source, target) {
    const s = LANG_NAME[source] || source;
    const t = LANG_NAME[target] || target;
    return s + " → " + t;
  }

  function render() {
    parseRoute();
    const root = $("#app");
    if (!root) return;
    try {
      root.innerHTML =
        route.page === "list" ? renderList() : renderDetail(route.langId);
      bindEvents();
    } catch (err) {
      root.innerHTML =
        '<div class="page empty">页面渲染错误：' + esc(err.message) + "</div>";
      console.error(err);
    }
  }

  function renderList() {
    const rows = state.languages
      .map((l) => {
        return (
          '<tr class="clickable" data-id="' +
          esc(l.language_id) +
          '">' +
          "<td><strong>" +
          esc(pairDisplayName(l.source_lang, l.target_lang)) +
          "</strong></td>" +
          '<td class="mono">' +
          esc(l.source_lang) +
          " → " +
          esc(l.target_lang) +
          "</td>" +
          '<td><span class="badge badge-' +
          esc(l.status) +
          '">' +
          esc(state.statusLabels[l.status] || "无") +
          "</span></td>" +
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
      "<div><h1>语种管理</h1>" +
      '<p class="lede">点击行或「详情」进入语种页 · 共 ' +
      state.languages.length +
      " 个语种</p></div>" +
      '<button type="button" class="btn btn-primary" data-act="new-lang">+ 新建语种</button>' +
      "</div>" +
      '<div class="card card-list">' +
      '<table class="simple table-list">' +
      "<thead><tr>" +
      "<th>语种</th><th>语对</th><th>Prompt 应用阶段</th><th>负责人</th><th>操作</th>" +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table></div>" +
      '<p class="foot-note">语对由源语言与目标语言组成；环境版本与发布见详情页</p>' +
      "</div>"
    );
  }

  function renderDetail(langId) {
    const l = getLang(langId);
    if (!l) {
      return (
        '<div class="page">' +
        '<a class="back" href="#/">← 返回列表</a>' +
        '<p class="empty">语种不存在：' +
        esc(langId) +
        "</p></div>"
      );
    }

    const overview = ENVS.map((env) => {
      const b = getBind(langId, env);
      if (!b) {
        return (
          '<div class="env-pill">' +
          '<span class="env-pill-label">' +
          esc(state.envLabels[env]) +
          '</span><span class="sub" style="margin-top:auto">未绑定</span></div>'
        );
      }
      return (
        '<div class="env-pill">' +
        '<span class="env-pill-label">' +
        esc(state.envLabels[env]) +
        "</span>" +
        '<span class="env-pill-ver">' +
        esc(verLabel(b.admin_prompt_version_id)) +
        "</span>" +
        '<div class="env-pill-foot">' +
        '<span class="env-pill-row"><span class="k">生效</span>' +
        fmtDate(b.published_at) +
        "</span>" +
        '<span class="env-pill-row"><span class="k">操作人</span>' +
        esc(b.published_by) +
        "</span></div></div>"
      );
    }).join("");

    const publishRows = ENVS.map((env) => {
      const b = getBind(langId, env);
      const curLabel = b ? verLabel(b.admin_prompt_version_id) : "—";
      const curTime = b ? fmtDate(b.published_at) : "—";
      const curOp = b ? esc(b.published_by) : "—";
      const opts = getVersions(langId)
        .map(
          (v) =>
            '<option value="' +
            esc(v.admin_prompt_version_id) +
            '">' +
            esc(v.version_label) +
            "</option>"
        )
        .join("");
      const prev = state.bindingPrev[langId + ":" + env];
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
        (opts || '<option value="">（无可用版本）</option>') +
        "</select>" +
        '<button type="button" class="btn btn-sm btn-primary" data-act="publish" data-env="' +
        env +
        '">发布</button>' +
        '<button type="button" class="btn btn-sm" data-act="rollback" data-env="' +
        env +
        '"' +
        (canRollback ? "" : " disabled") +
        ">回滚</button></div></td></tr>"
      );
    }).join("");

    const snaps = getVersions(langId);
    const snapTable = snaps
      .map((v) => {
        const reportBtn = v.eval_report_id
          ? '<button type="button" class="btn btn-sm" data-act="view-report" data-vid="' +
            esc(v.admin_prompt_version_id) +
            '">评测报告</button>'
          : '<span class="sub">—</span>';
        return (
          "<tr class=\"no-hover\">" +
          "<td><strong>" +
          esc(v.version_label) +
          "</strong></td>" +
          '<td><span class="badge badge-source">' +
          esc(v.source === "eval_submit" ? "译评" : v.source) +
          "</span></td>" +
          "<td class=\"sub\">" +
          fmtDate(v.submitted_at) +
          "</td>" +
          '<td><div class="snap-actions">' +
          '<button type="button" class="btn btn-sm" data-act="view-snap" data-vid="' +
          esc(v.admin_prompt_version_id) +
          '">Prompt</button>' +
          reportBtn +
          "</div></td></tr>"
        );
      })
      .join("");

    const snapSection =
      snaps.length === 0
        ? '<section class="section"><h2 class="section-title">Prompt 版本</h2>' +
          '<p class="empty card" style="padding:20px">暂无版本；译评「提交可应用」后将自动出现在此</p></section>'
        : '<section class="section">' +
          '<h2 class="section-title">Prompt 版本 <span class="sub">（' +
          snaps.length +
          " 个）</span></h2>" +
          '<div class="card"><table class="simple snap-table">' +
          "<thead><tr><th>版本</th><th>来源</th><th>入库时间</th><th>操作</th></tr></thead><tbody>" +
          snapTable +
          "</tbody></table></div></section>";

    const hist = state.releaseHistory
      .filter((h) => h.language_id === langId)
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
          esc(verLabel(h.from_version)) +
          " → " +
          esc(verLabel(h.to_version)) +
          "</td>" +
          "<td>" +
          esc(h.operator) +
          "</td></tr>"
      )
      .join("");

    return (
      '<div class="page">' +
      '<a class="back" href="#/">← 语种列表</a>' +
      '<div class="page-head detail-head">' +
      "<div><h1>" +
      esc(pairDisplayName(l.source_lang, l.target_lang)) +
      ' <span class="badge badge-' +
      esc(l.status) +
      '">' +
      esc(state.statusLabels[l.status] || "无") +
      "</span></h1></div>" +
      "</div>" +
      '<section class="section">' +
      '<h2 class="section-title">三环境概览</h2>' +
      '<div class="env-row">' +
      overview +
      "</div></section>" +
      '<section class="section">' +
      '<h2 class="section-title">环境发布</h2>' +
      '<div class="card"><table class="simple">' +
      "<thead><tr><th>环境</th><th>当前版本</th><th>生效时间</th><th>操作人</th><th>更换并发布 / 回滚</th></tr></thead>" +
      "<tbody>" +
      publishRows +
      "</tbody></table></div></section>" +
      snapSection +
      '<section class="section">' +
      '<h2 class="section-title">发布历史</h2>' +
      '<div class="card">' +
      (hist
        ? '<table class="simple"><thead><tr><th>时间</th><th>环境</th><th>动作</th><th>版本</th><th>操作人</th></tr></thead><tbody>' +
          hist +
          "</tbody></table>"
        : '<p class="empty">暂无记录</p>') +
      "</div></section></div>"
    );
  }

  function bindEvents() {
    $$("#app tr.clickable").forEach((tr) => {
      tr.addEventListener("click", (e) => {
        if (e.target.closest("[data-act=go-detail]")) return;
        goLang(tr.dataset.id);
      });
    });

    $$("#app [data-act=go-detail]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        goLang(btn.dataset.id);
      });
    });

    const newBtn = $("#app [data-act=new-lang]");
    if (newBtn) {
      newBtn.addEventListener("click", () => showNewLangModal());
    }

    $$("#app [data-act=publish]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const env = btn.dataset.env;
        const row = btn.closest("tr");
        const sel = $("select", row);
        const vid = sel && sel.value;
        if (!vid) return alert("请先选择要发布的版本");
        askOperator("发布到 " + state.envLabels[env], (op) => {
          doPublish(route.langId, env, vid, op);
          render();
        });
      });
    });

    $$("#app [data-act=rollback]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (btn.disabled) return;
        askOperator("回滚 · " + state.envLabels[btn.dataset.env], (op) => {
          doRollback(route.langId, btn.dataset.env, op);
          render();
        });
      });
    });

    $$("#app [data-act=view-snap]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const v = getVer(btn.dataset.vid);
        if (v) showSnapModal(v);
      });
    });

    $$("#app [data-act=view-report]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const v = getVer(btn.dataset.vid);
        if (v) showReportModal(v);
      });
    });
  }

  function evalReportUrl(v) {
    const tpl = state.evalReportUrlTemplate || "";
    if (!tpl || !v.eval_report_id) return null;
    return tpl
      .replace("{report_id}", encodeURIComponent(v.eval_report_id))
      .replace("{task_id}", encodeURIComponent(v.eval_task_id || ""));
  }

  function showReportModal(v) {
    if (!v.eval_report_id) {
      alert("该版本无关联评测报告（如手工录入）");
      return;
    }
    const rep =
      (state.evalReports && state.evalReports[v.eval_report_id]) || null;
    const url = evalReportUrl(v);
    const wrap = document.createElement("div");
    wrap.className = "modal-backdrop";
    const body = rep
      ? "<p><strong>" +
        esc(rep.title) +
        '</strong> <span class="badge badge-production">' +
        esc(rep.verdict) +
        "</span></p>" +
        "<p>" +
        esc(rep.summary) +
        "</p>" +
        (rep.highlights
          ? "<ul class=\"report-list\">" +
            rep.highlights.map((h) => "<li>" + esc(h) + "</li>").join("") +
            "</ul>"
          : "")
      : '<p class="sub">报告 ID：<span class="mono">' +
        esc(v.eval_report_id) +
        "</span>（原型未配置摘要）</p>";

    wrap.innerHTML =
      '<div class="modal modal-wide">' +
      "<h3>评测报告 · " +
      esc(v.version_label) +
      "</h3>" +
      '<p class="sub mono">task ' +
      esc(v.eval_task_id || "—") +
      " · report " +
      esc(v.eval_report_id) +
      "</p>" +
      body +
      '<div class="modal-ft">' +
      (url
        ? '<a class="btn btn-primary" href="' +
          esc(url) +
          '" target="_blank" rel="noopener">在译评平台打开</a>'
        : "") +
      '<button type="button" class="btn" data-x>关闭</button></div></div>';
    document.body.appendChild(wrap);
    wrap.querySelector("[data-x]").onclick = () => wrap.remove();
    wrap.addEventListener("click", (e) => {
      if (e.target === wrap) wrap.remove();
    });
  }

  function showSnapModal(v) {
    const wrap = document.createElement("div");
    wrap.className = "modal-backdrop";
    const blocks = ["system", "name_mapping", "engineering"]
      .map(
        (k) =>
          "<p><strong>" +
          k +
          "</strong></p><pre class=\"snap-pre\">" +
          esc((v.blocks || {})[k] || "") +
          "</pre>"
      )
      .join("");
    wrap.innerHTML =
      '<div class="modal modal-wide">' +
      "<h3>Prompt · " +
      esc(v.version_label) +
      "</h3>" +
      '<p class="sub">' +
      esc(v.changelog || "") +
      "</p>" +
      blocks +
      '<div class="modal-ft"><button type="button" class="btn" data-x>关闭</button></div></div>';
    document.body.appendChild(wrap);
    wrap.querySelector("[data-x]").onclick = () => wrap.remove();
    wrap.addEventListener("click", (e) => {
      if (e.target === wrap) wrap.remove();
    });
  }

  function showNewLangModal() {
    const wrap = document.createElement("div");
    wrap.className = "modal-backdrop";
    wrap.innerHTML =
      '<div class="modal modal-form modal-wide">' +
      "<h3>新建语种</h3>" +
      '<div class="form-field"><label for="f-source">源语言 code</label>' +
      '<input type="text" id="f-source" value="zh" placeholder="例如：zh" /></div>' +
      '<div class="form-field"><label for="f-target">目标语言 code</label>' +
      '<input type="text" id="f-target" placeholder="例如：fr、de" />' +
      '<p class="form-preview" id="f-preview"></p></div>' +
      '<div class="form-field"><label for="f-owner">负责人</label>' +
      '<input type="text" id="f-owner" placeholder="可选" /></div>' +
      '<div class="form-field"><label for="f-remark">备注</label>' +
      '<input type="text" id="f-remark" placeholder="可选" /></div>' +
      '<div class="modal-ft">' +
      '<button type="button" class="btn" data-x>取消</button>' +
      '<button type="button" class="btn btn-primary" data-ok>创建</button></div></div>';
    document.body.appendChild(wrap);
    wrap.querySelector("[data-x]").onclick = () => wrap.remove();
    wrap.addEventListener("click", (e) => {
      if (e.target === wrap) wrap.remove();
    });
    const syncPreview = () => {
      const source = ($("#f-source", wrap).value.trim() || "zh").toLowerCase();
      const target = $("#f-target", wrap).value.trim().toLowerCase();
      const el = $("#f-preview", wrap);
      if (!el) return;
      el.textContent =
        source && target
          ? "将创建：「" + pairDisplayName(source, target) + "」（" + source + " → " + target + "）"
          : "";
    };
    $("#f-source", wrap)?.addEventListener("input", syncPreview);
    $("#f-target", wrap)?.addEventListener("input", syncPreview);
    syncPreview();

    wrap.querySelector("[data-ok]").onclick = () => {
      const source = ($("#f-source", wrap).value.trim() || "zh").toLowerCase();
      const target = $("#f-target", wrap).value.trim().toLowerCase();
      if (!source || !target) return alert("请填写源语言和目标语言");
      if (source === target) return alert("源语言与目标语言不能相同");
      const display = pairDisplayName(source, target);
      const id = "lang_" + target + "_" + source;
      if (getLang(id)) return alert("该语对已存在（" + id + "）");
      state.languages.push({
        language_id: id,
        source_lang: source,
        target_lang: target,
        display_name: display,
        status: "none",
        owner: $("#f-owner", wrap).value.trim() || "—",
        remark: $("#f-remark", wrap).value.trim() || "",
        created_at: new Date().toISOString(),
      });
      state.bindings[id] = { test: null, staging: null, production: null };
      wrap.remove();
      goLang(id);
    };
  }

  function askOperator(title, fn, extraHtml) {
    const wrap = document.createElement("div");
    wrap.className = "modal-backdrop";
    wrap.innerHTML =
      '<div class="modal">' +
      "<h3>" +
      esc(title) +
      "</h3>" +
      (extraHtml || "") +
      '<label>操作人姓名或工号 <em>*</em></label>' +
      '<input type="text" id="op" value="xf" />' +
      '<div class="modal-ft">' +
      '<button type="button" class="btn" data-x>取消</button>' +
      '<button type="button" class="btn btn-primary" data-ok>确定</button></div></div>';
    document.body.appendChild(wrap);
    wrap.querySelector("[data-x]").onclick = () => wrap.remove();
    wrap.addEventListener("click", (e) => {
      if (e.target === wrap) wrap.remove();
    });
    wrap.querySelector("[data-ok]").onclick = () => {
      const op = $("#op", wrap).value.trim();
      if (!op) return alert("请填写操作人");
      fn(op);
      wrap.remove();
    };
  }

  function doPublish(languageId, env, versionId, operator) {
    if (!state.bindings[languageId]) {
      state.bindings[languageId] = {
        test: null,
        staging: null,
        production: null,
      };
    }
    const cur = getBind(languageId, env);
    if (cur) state.bindingPrev[languageId + ":" + env] = { ...cur };
    state.bindings[languageId][env] = {
      admin_prompt_version_id: versionId,
      published_at: new Date().toISOString(),
      published_by: operator,
    };
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
    const prev = state.bindingPrev[key];
    const cur = getBind(languageId, env);
    if (!prev || !cur) return alert("该环境没有可回滚的上一版本");
    state.bindings[languageId][env] = {
      admin_prompt_version_id: prev.admin_prompt_version_id,
      published_at: new Date().toISOString(),
      published_by: operator,
    };
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
  }

  window.addEventListener("hashchange", render);
  document.addEventListener("DOMContentLoaded", () => {
    const h = location.hash;
    if (h.indexOf("#/language/") === 0) {
      location.replace("#/lang/" + h.slice("#/language/".length));
      return;
    }
    if (!h || h === "#") location.hash = "#/";
    render();
  });
})();
