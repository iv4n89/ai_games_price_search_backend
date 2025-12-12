# AI Price Games

Este es un proyecto personal desarrollado con [NestJS](https://nestjs.com/) que utiliza la inteligencia artificial de Google Gemini para identificar y tasar videojuegos retro a partir de imágenes.

## Descripción

El objetivo de esta aplicación es facilitar la catalogación y valoración de videojuegos. A través de una API REST, el sistema permite:

1.  **Identificar videojuegos**: Sube una foto de un juego (o varios) y la IA extraerá información clave como el título, la plataforma y una estimación de su estado (suelto, completo, sellado).
2.  **Tasar videojuegos**: Obtén una valoración aproximada del juego basada en su condición y rareza.

## Tecnologías

-   **Framework**: NestJS (Node.js)
-   **IA**: Google Gemini (Vision & Search)
-   **Lenguaje**: TypeScript

## Configuración del Proyecto

1.  Instalar dependencias:

```bash
npm install
```

2.  Configurar variables de entorno:
    Asegúrate de tener una API Key de Google Gemini configurada en tu entorno (por ejemplo, en un archivo `.env` con la variable `GEMINI_API_KEY`).

## Ejecución

```bash
# desarrollo
npm run start

# modo watch
npm run start:dev

# producción
npm run start:prod
```

## Licencia

Este proyecto es de uso personal.
