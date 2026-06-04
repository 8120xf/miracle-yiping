#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"
PORT=8888
URL="http://127.0.0.1:${PORT}/publish-mvp/index.html"

echo "=========================================="
echo "  发布管理 MVP · 本地预览"
echo "  ${URL}"
echo "=========================================="

cd "$ROOT" || exit 1

if lsof -ti :${PORT} >/dev/null 2>&1; then
  open "${URL}"
  exit 0
fi

open "${URL}"
exec python3 -m http.server "${PORT}"
