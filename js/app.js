// Versión de la aplicación (debe coincidir con la de sw.js)
const APP_VERSION = '1.0.0';

const $ = (sel) => document.querySelector(sel);

const form = $('#form-producto');
const lista = $('#lista');
const vacio = $('#vacio');
const estadoRed = $('#estado-red');
const btnInstalar = $('#btn-instalar');
const aviso = $('#aviso-actualizacion');
const btnActualizar = $('#btn-actualizar');

$('#version').textContent = APP_VERSION;

const ICONO_BORRAR = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  <path d="M10 11v6M14 11v6"/>
  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
</svg>`;

const formatoMoneda = (n) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const escapar = (txt) =>
  String(txt).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Mostrar productos ----------
async function render() {
  const productos = await DB.listar();
  lista.innerHTML = '';
  vacio.hidden = productos.length > 0;

  let unidades = 0;
  let valor = 0;

  productos.forEach((p) => {
    unidades += p.cantidad;
    valor += p.cantidad * p.precio;

    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div class="info">
        <strong>${escapar(p.nombre)}</strong>
        <span class="cat">${escapar(p.categoria)}</span>
      </div>
      <div class="datos">
        <span>${p.cantidad} uds.</span>
        <span>${formatoMoneda(p.precio)}</span>
      </div>
      <button class="icono" data-id="${p.id}" aria-label="Eliminar producto" title="Eliminar">${ICONO_BORRAR}</button>`;
    lista.appendChild(li);
  });

  $('#total-productos').textContent = productos.length;
  $('#total-unidades').textContent = unidades;
  $('#valor-total').textContent = formatoMoneda(valor);
}

// ---------- Agregar producto ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const producto = {
    nombre: $('#nombre').value.trim(),
    categoria: $('#categoria').value,
    cantidad: parseInt($('#cantidad').value, 10),
    precio: parseFloat($('#precio').value),
    creado: new Date().toISOString()
  };
  await DB.agregar(producto);
  form.reset();
  render();
});

// ---------- Eliminar producto ----------
lista.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  if (confirm('¿Eliminar este producto?')) {
    await DB.eliminar(Number(btn.dataset.id));
    render();
  }
});

// ---------- Estado de conexión ----------
function actualizarEstadoRed() {
  const enLinea = navigator.onLine;
  estadoRed.textContent = enLinea ? 'En línea' : 'Sin conexión';
  estadoRed.classList.toggle('offline', !enLinea);
}
window.addEventListener('online', actualizarEstadoRed);
window.addEventListener('offline', actualizarEstadoRed);
actualizarEstadoRed();

// ---------- Botón de instalación ----------
let eventoInstalacion = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  eventoInstalacion = e;
  btnInstalar.hidden = false;
});
btnInstalar.addEventListener('click', async () => {
  if (!eventoInstalacion) return;
  eventoInstalacion.prompt();
  await eventoInstalacion.userChoice;
  eventoInstalacion = null;
  btnInstalar.hidden = true;
});

// ---------- Service Worker y aviso de actualización ----------
function mostrarAviso(swEnEspera) {
  aviso.hidden = false;
  btnActualizar.onclick = () => {
    btnActualizar.disabled = true;
    swEnEspera.postMessage({ tipo: 'SKIP_WAITING' });
  };
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('[App] Service Worker registrado. Versión app:', APP_VERSION);

      // Si ya había una versión nueva esperando
      if (reg.waiting && navigator.serviceWorker.controller) {
        mostrarAviso(reg.waiting);
      }

      // Cuando se detecta una versión nueva del Service Worker
      reg.addEventListener('updatefound', () => {
        const nuevo = reg.installing;
        nuevo.addEventListener('statechange', () => {
          if (nuevo.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[App] Nueva versión detectada y lista para activarse');
            mostrarAviso(nuevo);
          }
        });
      });

      // Revisar si hay actualizaciones cada minuto
      setInterval(() => reg.update(), 60000);
    } catch (err) {
      console.error('[App] Error al registrar el Service Worker:', err);
    }
  });

  // Cuando el Service Worker nuevo toma el control, se recarga una sola vez
  // (solo si ya había una versión anterior controlando la página)
  const habiaVersionAnterior = !!navigator.serviceWorker.controller;
  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!habiaVersionAnterior || recargando) return;
    recargando = true;
    window.location.reload();
  });
}

render();
