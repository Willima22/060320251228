@echo off
echo === Iniciando deploy da aplicacao ===

echo.
echo === Verificando Docker ===
docker --version
if %ERRORLEVEL% NEQ 0 (
    echo Docker nao esta instalado ou nao esta rodando!
    echo Por favor, instale o Docker Desktop e tente novamente.
    pause
    exit /b
)

echo.
echo === Construindo a imagem ===
docker compose build

echo.
echo === Iniciando os containers ===
docker compose up -d

echo.
echo === Verificando status ===
docker ps

echo.
echo === Deploy concluido! ===
echo A aplicacao deve estar rodando em http://localhost
echo Para ver os logs, use: docker compose logs -f
echo Para parar a aplicacao, use: docker compose down

pause 