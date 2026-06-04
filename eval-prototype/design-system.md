# AI 译评工作台 · Design System（原型）

> 对齐 `ui-ux-pro-max`：语义 token、8px 间距、触控 ≥44px、焦点可见。  
> 实现：`eval-prototype/styles.css`

## 产品定位

- **类型**：内部 B2B · Admin / 运营工作台  
- **用户**：语种专家、运营、研发（VPN 内网）  
- **气质**：清晰、克制、信息密度中等，不装饰化  

## 间距（8dp 网格）

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-1` | 4px | 紧凑间隙 |
| `--space-2` | 8px | 组件内 gap、触控间距 |
| `--space-3` | 12px | 表单元、小卡片 padding |
| `--space-4` | 16px | 区块内 padding |
| `--space-5` | 24px | 区块间距、页面 padding |
| `--space-6` | 32px | 大区块分隔 |

## 语义色

| Token | 用途 |
|-------|------|
| `--color-bg` | 页面背景 |
| `--color-surface` | 卡片、面板 |
| `--color-text` / `--color-text-muted` | 正文 / 辅助文案 |
| `--color-primary` (+ hover / subtle) | Prompt 评测主色 |
| `--color-config` (+ hover / subtle) | 发布管理主色 |
| `--color-success` / `--color-danger` / `--color-warning` | 状态语义 |
| `--color-header` | 侧边栏底 |

## 信息架构（两个独立应用）

**左侧边栏** 为一级入口（Prompt 评测 | 人校评阅 | 发布管理），右侧主区为列表/详情，**非**同一详情页 Tab：

| 应用 | 列表 | 详情 |
|------|------|------|
| Prompt 评测 | `#/iter` | `#/iter/lang/{id}` |
| 人校评阅 | `#/review` | 一期仅占位说明页 |
| 发布管理 | `#/config` | `#/config/lang/{id}` |

- 每屏 **一个 `h1`**：列表为「语种管理」，详情为语对名；模块上下文靠侧栏高亮。详情顶栏上方 `← 语种管理` 返回列表。  
- **可用**：版本行 **标为可用 / 不可用**（专家人工）；报告仅分析/对比，不自动改状态。  
- **后续**：**AI 建议使用版本**（报告/列表标签，不替代专家标注）。  
- **人校**：M5 现网；原型暂不展示入口（见 PRD E-5.0）。  
- **跨应用**：仅侧边栏详情态快捷链（详情顶栏不放跨模块链接）。  
- 提交可应用成功后跳转 `#/config/lang/{id}`。

## 组件约定

| 组件 | 规则 |
|------|------|
| **主 CTA** | 每屏至多一个 `btn-primary`：**Prompt 评测**列表=「新建语种」（发布管理列表 **无** 新建）；Prompt 评测详情=「新建语种规则版本」 |
| **行内操作** | `btn` / `btn-sm`，不用 `btn-primary` |
| **破坏性** | 回滚 `btn-danger` + `showConfirmDialog` |
| **反馈** | 校验/提示用 `showToast`（`aria-live="polite"`），不用 `alert()` |
| **对话框** | `mountModal`：`role="dialog"`、`aria-modal`、Esc、焦点陷阱、关闭后还原焦点 |
| **环境** | 配置详情顶栏 `env-strip`；列表不展示三环境长列 |
| **发布历史** | `<details>` 默认折叠 |

## 无障碍自检（原型）

- [ ] 侧栏 / 面包屑 / 主按钮可键盘到达  
- [ ] 状态除颜色外有 badge 文案  
- [ ] 模态 Esc 与 Tab 焦点循环  
- [ ] `prefers-reduced-motion` 已降级动画  
