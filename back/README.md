# Fraud Detection Backend 🛡️

Sistema Multi-Agente para Detección de Fraude en Transacciones Financieras. Este backend utiliza una arquitectura de agentes inteligentes con LangGraph para analizar patrones de fraude, consultar políticas internas y realizar búsquedas de amenazas externas.

## 🚀 Quick Start

### Opción 1: Setup Script (Recomendado)

```bash
chmod +x setup.sh
./setup.sh
```

### Opción 2: Manual

```bash
# Instalar dependencias con uv
uv sync

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus API keys (mínimo OpenAI y Tavily)
nano .env

# Seedear base de datos con datos sintéticos
uv run python -m app.data.loader

# Ejecutar servidor de desarrollo
uv run uvicorn main:app --reload
```

## 📁 Estructura del Proyecto

```
back/
├── app/
│   ├── agents/          # Agentes de LangGraph (Razonamiento Multi-agente)
│   ├── api/             # Endpoints FastAPI
│   ├── core/            # Configuración y seguridad
│   ├── data/            # Datos sintéticos y loaders
│   ├── db/              # Modelos SQLAlchemy y sesión
│   ├── models/          # Modelos Pydantic para validación
│   └── services/        # Servicios de lógica de negocio
├── main.py              # Punto de entrada de la aplicación
├── pyproject.toml       # Gestión de dependencias (uv)
└── Dockerfile           # Configuración para Docker
```

## 🔑 Variables de Entorno Requeridas

Crea un archivo `.env` basado en `.env.example`. El MVP requiere:

- `OPENAI_API_KEY`: Para el razonamiento de los agentes (GPT-4o-mini).
- `TAVILY_API_KEY`: Para la búsqueda de amenazas externas en la web.
- `DATABASE_URL`: Por defecto usa SQLite `sqlite+aiosqlite:///./fraud_detection.db`.

## 📊 API Endpoints

- `GET /`: Información básica del sistema.
- `GET /health`: Estado de salud del sistema.
- `GET /docs`: Documentación interactiva Swagger UI.
- `POST /api/transactions/analyze`: Envía una transacción para análisis profundo por los agentes.
- `GET /api/transactions`: Lista las transacciones procesadas.
- `GET /api/transactions/{id}`: Detalle de una transacción específica.
- `GET /api/transactions/{id}/audit-trails`: Trazabilidad completa de qué agente hizo qué.
- `GET /api/hitl/queue`: Cola de casos marcados para revisión humana (Human-In-The-Loop).
- `POST /api/hitl/{transaction_id}/review`: Resolución de un caso por un analista humano.

## 🧪 Testing & Calidad (No tests for the moment)

```bash
# Ejecutar todos los tests
uv run pytest

# Ver cobertura de tests
uv run pytest --cov=app

# Linting y formateo
uv run ruff check .
```

## 🛠️ Stack Tecnológico

- **Python 3.12**
- **FastAPI**: Framework web asíncrono de alto rendimiento.
- **LangGraph & LangChain**: Orquestación de agentes inteligentes.
- **SQLAlchemy**: ORM asíncrono para gestión de datos.
- **uv**: Gestor de paquetes y entornos ultra-rápido.
- **Tavily**: Motor de búsqueda optimizado para LLMs.
