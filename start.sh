#!/bin/bash
echo "🚀 Menyalakan Backend..."
cd /workspaces/forex-analyzer/backend
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
echo "✅ Backend jalan di port 8000"

echo "🚀 Menyalakan Frontend..."
cd /workspaces/forex-analyzer/frontend
nohup npm run dev > frontend.log 2>&1 &
echo "✅ Frontend jalan di port 3000"

echo "🎉 Selesai! Cek tab PORTS untuk membuka aplikasi."
