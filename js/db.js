// Manejo de IndexedDB para guardar los productos en el dispositivo
const DB_NAME = 'inventarioDB';
const DB_VERSION = 1;
const STORE = 'productos';

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (e.oldVersion < 1) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('nombre', 'nombre', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function ejecutar(modo, accion) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, modo);
    const store = tx.objectStore(STORE);
    const req = accion(store);
    tx.oncomplete = () => resolve(req ? req.result : undefined);
    tx.onerror = () => reject(tx.error);
  });
}

const DB = {
  listar: () => ejecutar('readonly', (s) => s.getAll()),
  agregar: (producto) => ejecutar('readwrite', (s) => s.add(producto)),
  actualizar: (producto) => ejecutar('readwrite', (s) => s.put(producto)),
  eliminar: (id) => ejecutar('readwrite', (s) => s.delete(id))
};
