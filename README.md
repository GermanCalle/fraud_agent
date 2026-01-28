# Trace Fraud Detection 🕵️‍♂️

Sistema inteligente de detección y análisis de fraude utilizando agentes de IA.

## 🚀 Despliegue Local (Docker Compose)

La forma más rápida de ejecutar el proyecto localmente es usando Docker Compose.

### Requisitos Previos

- Docker y Docker Compose instalados.
- API Keys de OpenAI y Tavily.

### Pasos

1. **Configurar variables de entorno:**
   Exporta las llaves necesarias en tu terminal o crea un archivo `.env` en la raíz:

   ```bash
   export OPENAI_API_KEY="tu_clave_aqui"
   export TAVILY_API_KEY="tu_clave_aqui"
   ```

2. **Iniciar la aplicación:**

   ```bash
   touch back/fraud_detection.db
   docker compose up -d --build
   docker compose exec backend uv run python -m app.data.loader

   ```

3. **Acceder a los servicios:**
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ☁️ Despliegue en la Nube (Azure)

El proyecto está configurado para desplegarse en **Azure Container Apps** usando Terraform.

### Requisitos Previos

- Azure CLI autenticado (`az login`).
- Terraform instalado.
- Imágenes de Docker subidas a un registro (ej. GHCR).
- GitHub Personal Access Token (PAT) con permisos de lectura de paquetes.

### Pasos

1. **Navegar a la carpeta de despliegue:**

   ```bash
   cd deployment/azure
   ```

2. **Configurar variables:**
   Copia el archivo de ejemplo y rellena tus datos:

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. **Ejecutar Terraform:**

   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

4. **Configurar CORS (Opcional pero recomendado):**
   Una vez desplegado, asegúrate de permitir la URL del frontend en el backend de Azure para habilitar las peticiones entre dominios.

---

## 🛠️ Stack Tecnológico

- **Backend:** Python (FastAPI), SQLModel, LangGraph.
- **Frontend:** React (Next.js), TailwindCSS.
- **Infraestructura:** Terraform, Azure Container Apps.
