#!/bin/bash
# 从「AI 译评平台」根目录起服务，避免 /publish-mvp/ 路径 404
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=8888
URL="http://127.0.0.1:${PORT}/publish-mvp/index.html"

echo "=========================================="
echo "  发布管理 MVP · 本地预览"
echo "  浏览器将打开："
echo "  ${URL}"
echo "=========================================="
echo ""
echo "（服务根目录：AI 译评平台）"
echo "按 Ctrl+C 可停止"
echo ""

cd "$ROOT" || exit 1

if lsof -ti :${PORT} >/dev/null 2>&1; then
  echo "端口 ${PORT} 已在运行，直接打开浏览器…"
  open "${URL}"
  exit 0
fi

open "${URL}"
exec python3 -m http.server "${PORT}"
