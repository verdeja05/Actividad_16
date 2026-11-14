# Registro de cambios (CHANGELOG)

Todos los cambios importantes de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

## [1.1.0] - 2026-11-14

### Agregado
- Búsqueda de productos por nombre.
- Filtro de productos por categoría.
- Edición de productos existentes.
- Alerta de stock bajo (5 unidades o menos) y contador en el resumen.
- Mensajes de confirmación al guardar, editar o eliminar.
- Índice por categoría en IndexedDB (base de datos versión 2) con migración que conserva los datos existentes.

### Corregido
- Se permitía registrar cantidades y precios negativos. Ahora se validan y se muestra un mensaje de error.
- El valor del inventario se calculaba con datos negativos. Ahora solo considera productos válidos y marca los inválidos como "Dato inválido, editar".
- Las conexiones a IndexedDB quedaban abiertas; ahora se cierran después de cada operación.

### Cambiado
- Mejoras de interfaz: subtítulo en el encabezado, barra de búsqueda, etiquetas de estado y diseño adaptable en celular.
- Service Worker actualizado a la versión 1.1.0 (caché `inventario-v1.1.0`).

## [1.1.0-rc.1] - 2026-11-14

### Versión candidata
- Versión de prueba de 1.1.0 para validar las funciones nuevas, la actualización del Service Worker y la conservación de datos antes de liberar.

## [1.0.0] - 2026-11-14

### Agregado
- Registro de productos con nombre, categoría, cantidad y precio unitario.
- Listado de productos guardados en IndexedDB.
- Eliminación de productos.
- Resumen con total de productos, unidades y valor del inventario.
- Indicador de conexión (en línea / sin conexión).
- Web App Manifest e íconos para instalar la aplicación.
- Service Worker con caché versionada y funcionamiento sin conexión.
- Aviso de nueva versión disponible con botón "Actualizar ahora".

[1.1.0]: https://github.com/verdeja05/Actividad_16/compare/v1.0.0...v1.1.0
[1.1.0-rc.1]: https://github.com/verdeja05/Actividad_16/releases/tag/v1.1.0-rc.1
[1.0.0]: https://github.com/verdeja05/Actividad_16/releases/tag/v1.0.0