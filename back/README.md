# Fraud Detection Backend

Sistema Multi-Agente para Detección de Fraude en Transacciones Financieras.

## 🚀 Quick Start

### Opción 1: Setup Script (Recomendado)

```bash
./setup.sh
```

### Opción 2: Manual

```bash
# Instalar dependencias
uv sync

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus API keys
nano .env

# Seedear base de datos
uv run python -m app.data.loader

# Ejecutar servidor
uv run uvicorn main:app --reload
```

## 📁 Estructura del Proyecto

```
back/
├── app/
│   ├── agents/          # Agentes de LangGraph (Sprint 1-2)
│   ├── api/             # Endpoints FastAPI (Sprint 3)
│   ├── core/            # Configuración
│   ├── data/            # Datos sintéticos y loaders
│   ├── db/              # Modelos SQLAlchemy
│   ├── models/          # Modelos Pydantic
│   └── services/        # Servicios de negocio
├── main.py              # Aplicación FastAPI
├── pyproject.toml       # Dependencias (uv)
└── Dockerfile           # Docker image
```

## 🔑 Variables de Entorno Requeridas

### Mínimo para MVP:
- `OPENAI_API_KEY` - OpenAI API key para GPT-4o-mini
- `TAVILY_API_KEY` - Tavily API key para web search

### Opcional:
- `AZURE_OPENAI_*` - Si usas Azure OpenAI en lugar de OpenAI
- `AZURE_SEARCH_*` - Para vector DB (RAG)
- `REDIS_*` - Para caching
- `LANGCHAIN_*` - Para observabilidad con LangSmith

## 🧪 Testing

```bash
# Ejecutar tests
uv run pytest

# Con coverage
uv run pytest --cov=app tests/

# Linting
uv run ruff check .

# Type checking
uv run mypy app/
```

## 📊 API Endpoints

### Actuales (Sprint 0)
- `GET /` - Info de la aplicación
- `GET /health` - Health check
- `GET /docs` - Swagger UI

### Por implementar (Sprint 3)
- `POST /api/transactions/analyze` - Analizar transacción
- `GET /api/transactions/{id}` - Obtener transacción
- `GET /api/audit/{transaction_id}` - Audit trail
- `GET /api/hitl/queue` - Cola HITL
- `POST /api/hitl/{transaction_id}/review` - Revisar caso HITL

## 🗄️ Base de Datos

SQLite para MVP (archivo `fraud_detection.db`).

### Tablas:
- `transactions` - Transacciones analizadas
- `audit_trail` - Trazabilidad de agentes
- `hitl_queue` - Cola de revisión humana
- `customer_behavior` - Comportamiento histórico de clientes

## 🐳 Docker

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Detener
docker-compose down
```

## 📝 Próximos Pasos (Sprints)

- ✅ Sprint 0: Setup completo
- ⏳ Sprint 1: Implementar 6 agentes core
- ⏳ Sprint 2: Decisión y explicabilidad
- ⏳ Sprint 3: API endpoints completos
- ⏳ Sprint 4: Frontend Next.js
- ⏳ Sprint 5: Deploy a Azure

## 🛠️ Stack Tecnológico

- Python 3.12
- FastAPI + Uvicorn
- LangGraph + LangChain
- OpenAI GPT-4o-mini
- SQLAlchemy (async)
- Azure AI Search (vector DB)
- Tavily (web search)
- uv (package manager)
