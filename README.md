# RoomiesFind: frontend

Aplicación Angular para encontrar con quién compartir hogar en Pasto. Compara hábitos de convivencia como orden, ruido, horarios y presupuesto, y explica con IA por qué dos personas son compatibles.

**Demo:** [roomies-find.vercel.app](https://roomies-find.vercel.app)

El backend, con los microservicios Java y gRPC, está en [roomiesFindBack](https://github.com/luiscajigas/roomiesFindBack).

## Funciones

- Compatibilidad calculada con reglas en un Web Worker.
- Explicación escrita por IA, con lectura en voz alta.
- Interfaz en español e inglés, con tema claro y oscuro.
- Buscador de barrios de Pasto por nombre o comuna.
- Filtros por comuna y orden de compañeros.
- Fotos de perfil que se amplían al hacer clic.

## Ejecutar

Necesitas Node.js y el backend corriendo en `http://localhost:3001/api`.

```bash
npm install
npm start
```

La app queda en `http://localhost:4300`.

## Compilar

```bash
npm run build
```

El resultado queda en `dist/frontend/browser`. La API de producción se configura en `src/environments/environment.prod.ts`.
