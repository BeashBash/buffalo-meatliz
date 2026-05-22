from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    supabase_url: str = "https://dbyykuyzgjfmsdtyrwzb.supabase.co"
    supabase_anon_key: str = ""
    supabase_service_key: str = ""
    database_url: str = ""

    jwt_secret: str = "buffalo-meatliz-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    whatsapp_api_url: str = ""
    whatsapp_api_token: str = ""
    sms_api_url: str = ""
    sms_api_token: str = ""

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
