// Manejo de IndexedDB para guardar los productos en el dispositivo
// v1.1.0: la base sube a la versión 2 y agrega un índice por categoría
// sin borrar los productos que ya existían (migración)
const DB_NAME = 'inventarioDB';
const DB_VERSION = 2;
const STORE = 'productos';

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = req.result;
      let store;

      // Instalación nueva: se crea el almacén desde cero
      if (e.oldVersion < 1) {
        store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('nombre', 'nombre', { unique: false });
      } else {
        // Actualización: se usa el almacén que ya existe, con sus datos
        store = req.transaction.objectStore(STORE);
      }

      // Migración a la versión 2: nuevo índice por categoría
      if (e.oldVersion < 2 && !store.indexNames.contains('categoria')) {
        store.createIndex('categoria', 'categoria', { unique: false });
        console.log('[DB] Migración de la versión', e.oldVersion, 'a la', DB_VERSION, 'completada sin pérdida de datos');
      }
    };

    req.onblocked = () => {
      console.warn('[DB] La actualización de la base está esperando a que se cierren otras pestañas de la app');
    };

    req.onsuccess = () => {
      const db = req.result;
      // Si otra pestaña con una versión más nueva necesita actualizar la base, se libera la conexión
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
}

async function ejecutar(modo, accion) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, modo);
    const store = tx.objectStore(STORE);
    const req = accion(store);
    tx.oncomplete = () => {
      db.close();
      resolve(req ? req.result : undefined);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

const DB = {
  listar: () => ejecutar('readonly', (s) => s.getAll()),
  obtener: (id) => ejecutar('readonly', (s) => s.get(id)),
  agregar: (producto) => ejecutar('readwrite', (s) => s.add(producto)),
  actualizar: (producto) => ejecutar('readwrite', (s) => s.put(producto)),
  eliminar: (id) => ejecutar('readwrite', (s) => s.delete(id))
};