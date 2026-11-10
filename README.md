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

## Conceptos aplicados

### Tipado end-to-end y contract-first

`src/app/api/contrato.ts` se genera desde el contrato OpenAPI del backend y no se edita a mano:

```bash
npm run contrato   # lee ../roomiesFindBack/contratos/src/main/openapi/roomiesfind-api.yaml
```

`src/app/api/tipos.ts` le da nombres a esos tipos (`Persona`, `Mensaje`, `EventoNavegador`...), y los servicios los usan en cada `HttpClient`. Si el backend cambia un campo, al regenerar el compilador señala cada lugar afectado. Así encontró que el formulario de perfil tenía un tipo que permitía enviar `descripcion: null`, algo que el API no acepta.

Los eventos del WebSocket son una unión discriminada por `tipo`. En un `switch (evento.tipo)`, TypeScript sabe qué campos tiene cada caso.

### Web Worker

El puntaje y las razones de compatibilidad se calculan en `workers/compatibilidad.worker.ts`, fuera del hilo principal. La interfaz nunca se congela.

- **Un solo worker para toda la app** (`services/motor-compatibilidad.service.ts`): se crea la primera vez que hace falta y se reutiliza entre páginas.
- **Mensajes tipados** (`workers/compatibilidad.mensajes.ts`), importados por los dos lados. Cada petición lleva un id, porque puede haber varias en curso.
- **Errores:** si el cálculo falla, el worker responde con un error en vez de dejar la promesa esperando; si el worker se cae, se rechazan las peticiones pendientes y el siguiente intento crea otro.
- **Trade-off:** las reglas del puntaje también están en SQL, porque el servidor necesita ordenar y paginar por puntaje. Están duplicadas a propósito; se verificó con todos los perfiles reales que dan el mismo puntaje, y si cambian hay que cambiarlas en los dos lados.

### Patrones de renderizado

| Patrón | Qué es | ¿Aquí? |
|---|---|---|
| **CSR** (Client-Side Rendering) | El navegador recibe un HTML vacío y Angular dibuja todo | **Sí, es el que se usa.** Casi todo está detrás de una sesión, es personal (compatibilidad, chat) y cambia en tiempo real |
| **SSR** (Server-Side Rendering) | El servidor arma el HTML en cada petición | No. Necesitaría un servidor de Node; además, el token vive en `localStorage` y el servidor no lo vería, así que dibujaría páginas vacías o de otra persona |
| **SSG** (Static Site Generation) | El HTML se arma una vez, al compilar | Encajaría en `/login` y `/registro`, que son iguales para todos. Se intentó con `@angular/platform-server`, pero el prerender de Angular 18 falló con este proyecto y se dejó para después de la entrega |
| **ISR** (Incremental Static Regeneration) | SSG que se regenera cada cierto tiempo | No. Sirve para contenido público que cambia (un catálogo, un blog), y aquí no hay páginas públicas con datos |

**Trade-off de CSR:** la primera carga muestra la página un poco más tarde y es peor para SEO. Aquí no importa, porque la app no busca aparecer en Google y el contenido es privado. A cambio, se despliega como archivos estáticos en Vercel, sin servidor propio.

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
