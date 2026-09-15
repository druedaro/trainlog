# Corrección del borrado accidental de imágenes

He detectado el error. En mi anterior paso, añadí las imágenes de Unsplash al contenido del artículo y, acto seguido, pasé un filtro para borrar todas las imágenes en formato markdown del texto. ¡El problema es que borré también las imágenes buenas que acababa de añadir!

## Proposed Changes
1. Mover el filtro de limpieza (`article.content.replace(...)`) para que actúe **antes** de añadir los GIFs de Unsplash. De esta forma, borramos solo las imágenes inventadas por la IA y luego añadimos las reales de forma segura.

No es necesario revisión para este pequeño ajuste lógico, lo corregiré de inmediato.
