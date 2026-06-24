# 📊 Web Analytics Platform
**Temë Diplome** — Platformë Analytics me Machine Learning për Biznese

## 🎯 Përshkrimi
Platformë web për monitorimin dhe parashikimin e KPI-ve të bizneseve, duke përdorur arkitekturë hibride PostgreSQL + MongoDB dhe modele ML (Prophet + LSTM).

## 🏗️ Arkitektura
```
Frontend (React + Vite)  →  Backend (Node.js + Express)  →  PostgreSQL
                                      ↓                          ↓
                              Flask ML API (Python)         MongoDB
                                      ↓
                            Prophet / LSTM Models
```

## ⚙️ Teknologjitë
| Shtresa | Teknologjia |
|---|---|
| Frontend | React, Vite, Recharts |
| Backend | Node.js, Express |
| Databaza Kryesore | PostgreSQL 18 |
| Databaza NoSQL | MongoDB |
| ML Models | Prophet, LSTM (TensorFlow) |
| Autentifikim | JWT, bcrypt |

## 📋 Kërkesat
- Node.js v20+
- PostgreSQL 18 (port 5433)
- MongoDB (port 27017)
- Python 3.12+ me Anaconda
- npm

## 🚀 Instalimi

### 1. Klono projektin
```bash
git clone https://github.com/USERNAME/analytics-platform.git
cd analytics-platform
```

### 2. Instalo varësitë Node.js
```bash
npm install
cd client && npm install && cd ..
```

### 3. Krijo databazën PostgreSQL
```bash
psql -U postgres -p 5433 -c "CREATE DATABASE web_analytics_platform;"
psql -U postgres -p 5433 -d web_analytics_platform -f database/schema.sql
```

### 4. Konfiguro `.env`
```bash
cp .env.example .env
# Ndrysho kredencialet në .env
```

### 5. Instalo libraritë Python
```bash
cd ml
pip install flask flask-cors pandas numpy psycopg2-binary prophet tensorflow scikit-learn
```

## ▶️ Nisja e Platformës

### Terminal 1 — Flask ML API
```bash
cd ml
python api.py
```

### Terminal 2 — Node.js Backend
```bash
node server.js
```

### Terminal 3 — React Frontend
```bash
cd client
npm run dev
```

Hap shfletuesin te: **http://localhost:5173**

## 👤 Kredencialet Demo
| Username | Fjalëkalimi | Roli |
|---|---|---|
| admin1 | 123456 | Admin (TechCorp) |
| retail_admin | 123456 | Admin (RetailMax) |

## 📊 Funksionalitetet
- ✅ Regjistrim biznesi + Login me JWT
- ✅ Dashboard me KPI-të (Revenue Growth, Inventory Turnover, Forecasts)
- ✅ Filtrimi sipas biznesit + Role-based UI
- ✅ CSV Import për transaksione dhe inventar
- ✅ Profili i biznesit
- ✅ Menaxhimi i punonjësve
- ✅ Parashikime ML (Prophet + LSTM) direkt nga dashboard
- ✅ Activity Logs në MongoDB
- ✅ Auto-refresh çdo 30 sekonda

## 🤖 Rezultatet e Modeleve ML
| Dataset | Model | MAE | RMSE | MAPE |
|---|---|---|---|---|
| Sintetik (10K) | Prophet | $29,094 | $33,322 | 412% |
| Sintetik (10K) | LSTM | $53,350 | $66,465 | 1461% |
| **Rossmann (1M+)** | **Prophet** | **€18,464** | **€20,640** | **16.57%** |
| **Rossmann (1M+)** | **LSTM** | **€4,943** | **€5,756** | **4.38%** |

## 📁 Struktura e Projektit
```
analytics-platform/
├── server.js          # Express backend
├── db/
│   └── mongo.js       # MongoDB lidhja
├── models/
│   ├── ActivityLog.js # MongoDB model
│   └── KpiCache.js    # MongoDB cache
├── ml/
│   ├── api.py         # Flask ML API
│   └── prophet_model.ipynb  # Jupyter Notebook
├── public/            # HTML/JS statik
├── uploads/           # CSV uploads (temp)
└── client/            # React app
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── Users.jsx
        │   ├── Settings.jsx
        │   └── Import.jsx
        └── components/
            ├── RevenueChart.jsx
            ├── InventoryChart.jsx
            ├── ForecastChart.jsx
            └── ForecastPanel.jsx
```

## 👨‍💻 Autori
Temë Diplome — Fakulteti i Shkencave Kompjuterike
