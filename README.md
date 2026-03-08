# reviewer

Asistente de revisión automática para Pull Requests en Gitea usando IA.

## Requisitos

- Node.js 24+
- pnpm
- Instancia de Gitea con API habilitada
- Token de Gitea con permisos para leer PRs y crear reviews

## Configuración

1. Instala dependencias:

```bash
pnpm install
```

2. Crea un archivo `.env` con:

```env
GITEA_URL=http://tu-gitea
GITEA_TOKEN=tu_token
GOOGLE_GENERATIVE_AI_API_KEY=secret
```

3. Ejecuta el servicio (en modo producción):

```bash
pnpm start          # compila y ejecuta dist/main.js
```

Durante el desarrollo puedes arrancar con recarga automática:

```bash
pnpm dev            # usa tsx para ejecutar src/main.ts directamente
```

También dispones de un comando de compilación independiente:

```bash
pnpm run build      # genera los ficheros JavaScript en ./dist
```

Hay un script de prueba básico que puedes ampliar más adelante:

```bash
pnpm test           # actualmente imprime un mensaje, añade tus tests aquí
```

El servidor escucha en `http://localhost:4000` y expone `POST /review` para webhooks de Gitea.

### Variables de entorno

Copia `.env.example` a `.env` y completa las variables necesarias:

```bash
cp .env.example .env
# editar .env con tus valores
```

Las claves principales son las siguientes (hay más opciones y algunas tienen
valores por defecto):

- `GITEA_URL` – URL base de tu instancia de Gitea
- `GITEA_TOKEN` – token con permisos de lectura/escritura en PRs
- `BOT_NAME` – nombre de usuario del revisor automático que debe corresponder
  a `requested_reviewer.username` en el webhook (por defecto `AI`).
- `GOOGLE_GENERATIVE_AI_API_KEY` – credenciales para el proveedor de IA
- `PORT` y `ENDPOINT` – dónde escucha el servidor (4000 y 0.0.0.0 por defecto)
- `REQUEST_CHANGES_THRESHOLD` – umbral numérico (por defecto 8) por debajo
  del cual el bot usa el evento `REQUEST_CHANGES` en lugar de `COMMENT`.

```
## Licencia y atribución

Este proyecto se distribuye bajo **BSD 3-Clause License** (ver [LICENSE](LICENSE)).

Puedes usar, modificar y redistribuir el código, pero debes mantener la atribución al proyecto original en el código fuente y/o documentación de distribución.

Referencia sugerida de atribución:

> Basado en el proyecto original **reviewer**.
```
