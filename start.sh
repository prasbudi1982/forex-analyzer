#!/bin/bash

# Warna untuk output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Menyalakan Backend...${NC}"
cd /workspaces/forex-analyzer/backend

# Pastikan file .env ada sebelum di-export
if [ -f .env ]; then
    # Export semua variabel dari .env ke memori terminal
    export $(cat .env | xargs)
    echo "✅ File .env berhasil dimuat."
else
    echo "⚠️  File .env tidak ditemukan. Pastikan sudah dibuat di folder backend."
fi

# Jalankan Uvicorn di latar belakang
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
echo -e "${GREEN}✅ Backend jalan di port 8000${NC}"

echo -e "${GREEN}🚀 Menyalakan Frontend...${NC}"
cd /workspaces/forex-analyzer/frontend

# Jalankan Next.js di latar belakang
nohup npm run dev > frontend.log 2>&1 &
echo -e "${GREEN}✅ Frontend jalan di port 3000${NC}"

echo -e "${GREEN}🎉 Selesai! Cek tab PORTS untuk membuka aplikasi.${NC}"
