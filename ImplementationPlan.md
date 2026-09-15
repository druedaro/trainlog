# Sistema de Cascada para Imágenes de Ejercicios

Vamos a implementar un sistema de respaldo (fallback) agresivo y optimizado para evitar problemas de timeout en Vercel, cumpliendo el objetivo de tener representaciones visuales sin romper la app.

## Proposed Changes

### `api/generateDiscover.ts`
Implementaremos la lógica en la función `fetchExerciseGif`:
1. **Intento 1 (ExerciseDB):** Pedimos la información a la API de `exercisedb` (timeout de 1500ms).
2. **Ping de Validación:** Si `exercisedb` nos da una URL (ej. `static.exercisedb.dev/...`), en lugar de fiarnos ciegamente, el propio backend hará una petición `HEAD` ultrarrápida (timeout de 600ms) a esa imagen. Si no responde o da error, sabemos que la imagen está caída.
3. **Intento 2 (Unsplash Fallback):** Si cualquiera de los pasos anteriores falla o da timeout, capturamos el error silenciosamente y lanzamos una petición a la API de `Unsplash` (timeout de 1500ms) para garantizar una imagen estética.
4. **Fallback final:** Si todo el internet se cae, devolveremos `null` para no romper el artículo.

Como las peticiones se hacen con `Promise.all` en paralelo para todos los ejercicios de un artículo, el tiempo máximo total gastado será de unos `3.6 segundos` en el peor de los casos, encajando perfectamente en los 10 segundos de límite de Vercel (teniendo en cuenta que Groq tarda unos 2 segundos).

## User Review Required

> [!WARNING]
> ¿Estás de acuerdo con este enfoque? Al incluir la petición `HEAD` para validar la imagen de exercisedb evitamos el falso positivo que colgaba tu pantalla, y mantenemos Unsplash como red de seguridad.
