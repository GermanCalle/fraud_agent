# Fraud Detection Frontend 🖥️

Interfaz de usuario moderna para el Sistema de Detección de Fraude Multi-Agente. Permite visualizar el análisis de transacciones, gestionar la cola de revisión humana (HITL) y explorar la trazabilidad de las decisiones tomadas por la IA.

## 🚀 Inicio Rápido

### Requisitos

- Node.js 18+
- Backend en ejecución (por defecto en `http://localhost:8000`)

### Instalación

1. **Instalar dependencias:**

    ```bash
    npm install
    ```

2. **Configurar entorno:**
    Crea un archivo `.env.local` en la raíz de la carpeta `front`:

    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```

3. **Ejecutar en desarrollo:**

    ```bash
    npm run dev
    ```

4. **Abrir en el navegador:**
    Visita [http://localhost:3000](http://localhost:3000)

## ✨ Características Principales

- **Dashboard de Transacciones:** Visualización en tiempo real de las últimas transacciones procesadas y su estado.
- **Análisis Detallado:** Vista profunda de cada transacción incluyendo:
  - Decisión final y nivel de confianza.
  - Explicaciones para el cliente y para auditoría.
  - Grafo de ruta de agentes (quién analizó qué).
  - Señales de fraude detectadas.
- **Human-In-The-Loop (HITL):** Interfaz dedicada para analistas de fraude donde pueden revisar casos marcados como "Challenge" o "Escalate" y tomar una decisión final.
- **Audit Trail:** Línea de tiempo técnica que muestra el razonamiento paso a paso de cada agente involucrado.

## 📁 Estructura del Proyecto

```
front/
├── src/
│   ├── app/             # Rutas y páginas (Next.js App Router)
│   │   ├── hitl/        # Gestión de revisión humana
│   │   └── page.tsx     # Dashboard principal
│   ├── components/      # Componentes de UI reutilizables
│   ├── lib/             # Cliente de API (Axios) y utilidades
│   └── types/           # Definiciones de TypeScript
├── public/              # Activos estáticos
└── tailwind.config.ts   # Configuración de estilos
```

## 🛠️ Stack Tecnológico

- **Next.js 16 (App Router)**
- **TypeScript**
- **Tailwind CSS**: Para un diseño moderno y responsive.
- **Axios**: Cliente HTTP para comunicación con el backend.
- **Lucide React**: Set de iconos.
- **Recharts**: Visualización de datos y métricas.
- **React Markdown**: Renderizado de explicaciones detalladas.

## 🐳 Docker

Si prefieres usar Docker desde la raíz del proyecto:

```bash
docker-compose up -d
```
