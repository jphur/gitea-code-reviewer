# reviewer

Asistente de revisión automática para Pull Requests en Gitea usando IA.

## Requisitos

- Node.js 20+
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

3. Ejecuta el servicio:

```bash
pnpm start
```

El servidor escucha en `http://localhost:4000` y expone `POST /review` para webhooks de Gitea.

## Licencia y atribución

Este proyecto se distribuye bajo **BSD 3-Clause License** (ver [LICENSE](LICENSE)).

Puedes usar, modificar y redistribuir el código, pero debes mantener la atribución al proyecto original en el código fuente y/o documentación de distribución.

Referencia sugerida de atribución:

> Basado en el proyecto original **reviewer**.
