from langchain_openai import AzureChatOpenAI, ChatOpenAI

from app.core.config import settings


def get_llm(
    model: str = "gpt-4o-mini",
):
    """
    Retorna la instancia del LLM configurado (OpenAI o Azure).
    """

    model = model or settings.OPENAI_MODEL
    if settings.use_azure_openai:
        return AzureChatOpenAI(
            azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_key=settings.AZURE_OPENAI_API_KEY,
        )
    else:
        return ChatOpenAI(
            model=model,
            api_key=settings.OPENAI_API_KEY,
        )
