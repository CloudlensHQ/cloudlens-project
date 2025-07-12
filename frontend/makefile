ui:
	npm run dev;
build:
	npm run build;
start:
	npm run start;

local-openapi:
	curl -o openapi.json http://localhost:9000/openapi.json; \
	npx openapi-typescript ./openapi.json -o ./src/lib/api/v1.d.ts; \
	npx @hey-api/openapi-ts -i ./openapi.json -o ./src/lib/api/openapi -c @hey-api/client-fetch; \
	rm ./src/lib/api/openapi/client.gen.ts ./src/lib/api/openapi/index.ts ./src/lib/api/openapi/sdk.gen.ts
