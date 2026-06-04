# AI 译评工作台 · 一期（规则评测 + 人校评阅占位 + 发布管理）

## 在线预览（GitHub Pages）

开启 Pages 后使用下列链接（仓库根目录会自动跳转到原型）：

| 模块 | 链接 |
|------|------|
| 首页（跳转） | https://8120xf.github.io/miracle-yiping/ |
| 规则评测 | https://8120xf.github.io/miracle-yiping/eval-prototype/index.html#/iter |
| 人校评阅（占位） | https://8120xf.github.io/miracle-yiping/eval-prototype/index.html#/review |
| 发布管理 | https://8120xf.github.io/miracle-yiping/eval-prototype/index.html#/config |

## 本地预览

```bash
cd eval-prototype
python3 -m http.server 8765
```

浏览器打开：http://localhost:8765/index.html#/iter

## 目录

- `eval-prototype/` — 合并交互原型（Mock）
- `需求文档/` — PRD 与功能清单
- `中德/` — 试点评测参考数据
