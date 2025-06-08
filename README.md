# Diabetes App

Una aplicación web para gestionar y dar seguimiento a información relacionada con la diabetes. Para uso personal.

Este proyecto fue creado con React + Vite, proporcionando una configuración mínima para trabajar con React, incluyendo HMR y reglas de ESLint.

## Plugins Oficiales

Actualmente, dos plugins oficiales están disponibles:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) usa [Babel](https://babeljs.io/) para Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) usa [SWC](https://swc.rs/) para Fast Refresh

## Características

- Registro de niveles de glucosa
- Seguimiento de medicamentos
- Registro de actividad física
- Planificación de comidas
- Recordatorios personalizables

## Tecnologías Utilizadas

- React.js
- Node.js
- Express
- MongoDB
- TypeScript
- Vite

## Estructura del Proyecto

```
diabetes-app/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── utils/
├── public/
├── tests/
└── docs/
```

## Desarrollo

Para el desarrollo de producción, se recomienda usar TypeScript con reglas de lint conscientes de tipos. Consulta la [plantilla TS](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) para obtener información sobre cómo integrar TypeScript y [`typescript-eslint`](https://typescript-eslint.io) en tu proyecto.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT.
