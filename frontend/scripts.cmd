@echo off
setlocal enabledelayedexpansion

if "%1"=="ui" goto ui
if "%1"=="build" goto build
if "%1"=="start" goto start
if "%1"=="local-openapi" goto local-openapi
if "%1"=="dev-openapi" goto dev-openapi
if "%1"=="prod-openapi" goto prod-openapi

echo Usage: scripts.cmd [command]
echo Commands:
echo   ui              - Run development server
echo   build          - Build the project
echo   start          - Start the project
echo   local-openapi  - Generate OpenAPI types from localhost
echo   dev-openapi    - Generate OpenAPI types from dev API
echo   prod-openapi   - Generate OpenAPI types from prod API
goto :eof

:ui
call npm run dev
goto :eof

:build
call npm run build
goto :eof

:start
call npm run start
goto :eof

:local-openapi
curl -o openapi.json http://localhost:9000/openapi.json
call npx openapi-typescript ./openapi.json -o ./src/lib/api/v1.d.ts
call npx @hey-api/openapi-ts -i ./openapi.json -o ./src/lib/api/openapi -c @hey-api/client-fetch
del ./src/lib/api/openapi/client.gen.ts ./src/lib/api/openapi/index.ts ./src/lib/api/openapi/sdk.gen.ts
goto :eof

