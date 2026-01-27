from langchain_openai import AzureChatOpenAI, ChatOpenAI

from app.core.config import settings


def get_llm(temperature: float | None = None):
    """
    Retorna la instancia del LLM configurado (OpenAI o Azure).
    """
    temp = temperature if temperature is not None else settings.OPENAI_TEMPERATURE

    if settings.use_azure_openai:
        return AzureChatOpenAI(
            azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_key=settings.AZURE_OPENAI_API_KEY,
            temperature=temp,
        )
    else:
        return ChatOpenAI(
            model=settings.OPENAI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            # temperature=temp,
        )
