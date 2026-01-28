import logging
import sys

from app.core.config import settings

# Formato de los logs
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


def setup_logging():
    """Configura el sistema de logging para la aplicación."""
    level = logging.DEBUG if settings.DEBUG else logging.INFO

    # Configuración básica
    logging.basicConfig(
        level=level, format=LOG_FORMAT, handlers=[logging.StreamHandler(sys.stdout)]
    )

    # Ajustar niveles para librerías ruidosas
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Retorna un logger con el nombre especificado."""
    return logging.getLogger(name)
