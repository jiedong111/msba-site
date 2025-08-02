from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    openai_api_key: Optional[str] = Field(None, env="OPENAI_API_KEY")
    serper_api_key: Optional[str] = Field(None, env="SERPER_API_KEY")
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:5174"]  # Add both ports
    model_path: str = "./models/"
    
    class Config:
        env_file = ".env"


settings = Settings()