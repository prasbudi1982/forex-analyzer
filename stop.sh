#!/bin/bash
echo "🛑 Mematikan Backend..."
pkill -f "uvicorn main:app"
fuser -k 8000/tcp 2>/dev/null

echo "🛑 Mematikan Frontend..."
pkill -f "next dev"
pkill -f "next-server"
fuser -k 3000/tcp 2>/dev/null

echo "✅ Semua server berhasil dimatikan."
