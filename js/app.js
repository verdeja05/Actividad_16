// Versión de la aplicación (debe coincidir con la de sw.js)
const APP_VERSION = '1.1.0';
const STOCK_MINIMO = 5;

const $ = (sel) => document.querySelector(sel);

const form = $('#form-producto');
const lista = $('#lista');
const vacio = $('#vacio');
const estadoRed = $('#estado-red');
const btnInstalar = $('#btn-instalar');
const aviso = $('#aviso-actualizacion');
const btnActualizar = $('#btn-actualizar');
const btnGuardar = $('#btn-guardar');
const btnCancelar = $('#btn-cancelar');
const tituloForm = $('#titulo-form');
const mensajeError = $('#mensaje-error');
const buscar = $('#buscar');
const filtroCategoria = $('#filtro-categoria');
const toast = $('#toast');

$('#version').textContent = APP_VERSION;

let productos = [];
let editandoId = null;

const ICONO_BORRAR = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  <path d="M10 11v6M14 11v6"/>
  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
</svg>`;

const ICONO_EDITAR = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 20h9"/>
  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>
</svg>`;

const formatoMoneda = (n) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const escapar = (txt) =>
  String(txt).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const esInvalido = (p) => !(p.cantidad >= 0) || !(p.precio >= 0);

// ---------- Mensajes ----------
let temporizadorToast = null;
function mostrarToast(texto) {
  toast.textContent = texto;
  toast.hidden = false;
  clearTimeout(temporizadorToast);
  temporizadorToast = setTimeout(() => { toast.hidden = true; }, 2500);
}

function mostrarError(texto) {
  mensajeError.textContent = texto;
  mensajeError.hidden = !texto;
}

// ---------- Validación (corrección de cantidades y precios negativos) ----------
function validar(p) {
  if (!p.nombre) return 'Escribe el nombre del producto.';
  if (!p.categoria) return 'Selecciona una categoría.';
  if (!Number.isInteger(p.cantidad) || p.cantidad < 0) return 'La cantidad debe ser un número entero mayor o igual a 0.';
  if (Number.isNaN(p.precio) || p.precio < 0) return 'El precio debe ser un número mayor o igual a 0.';
  return '';
}

// ---------- Mostrar productos ----------
async function cargar() {
  productos = await DB.listar();
  render();
}

function render() {
  const texto = buscar.value.trim().toLowerCase();
  const categoria = filtroCategoria.value;

  const filtrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(texto) && (!categoria || p.categoria === categoria)
  );

  lista.innerHTML = '';
  vacio.hidden = filtrados.length > 0;
  vacio.textContent = productos.length === 0
    ? 'Aún no hay productos registrados.'
    : 'No hay productos que coincidan con la búsqueda.';

  filtrados.forEach((p) => {
    const invalido = esInvalido(p);
    const stockBajo = !invalido && p.cantidad <= STOCK_MINIMO;

    const li = document.createElement('li');
    li.className = 'item' + (invalido ? ' item-invalido' : stockBajo ? ' item-bajo' : '');
    li.innerHTML = `
      <div class="info">
        <strong>${escapar(p.nombre)}</strong>
        <div class="etiquetas">
          <span class="cat">${escapar(p.categoria)}</span>
          ${stockBajo ? '<span class="badge badge-bajo">Stock bajo</span>' : ''}
          ${invalido ? '<span class="badge badge-invalido">Dato inválido, editar</span>' : ''}
        </div>
      </div>
      <div class="datos">
        <span>${p.cantidad} uds.</span>
        <span>${formatoMoneda(p.precio)}</span>
      </div>
      <div class="botones-item">
        <button class="icono" data-accion="editar" data-id="${p.id}" aria-label="Editar producto" title="Editar">${ICONO_EDITAR}</button>
        <button class="icono" data-accion="eliminar" data-id="${p.id}" aria-label="Eliminar producto" title="Eliminar">${ICONO_BORRAR}</button>
      </div>`;
    lista.appendChild(li);
  });

  // El resumen solo toma en cuenta productos con datos válidos
  const validos = productos.filter((p) => !esInvalido(p));
  const unidades = validos.reduce((suma, p) => suma + p.cantidad, 0);
  const valor = validos.reduce((suma, p) => suma + p.cantidad * p.precio, 0);
  const bajos = validos.filter((p) => p.cantidad <= STOCK_MINIMO).length;

  $('#total-productos').textContent = productos.length;
  $('#total-unidades').textContent = unidades;
  $('#valor-total').textContent = formatoMoneda(valor);
  $('#total-stock-bajo').textContent = bajos;
}

// ---------- Modo edición ----------
function iniciarEdicion(p) {
  editandoId = p.id;
  $('#nombre').value = p.nombre;
  $('#categoria').value = p.categoria;
  $('#cantidad').value = p.cantidad;
  $('#precio').value = p.precio;
  tituloForm.textContent = 'Editar producto';
  btnGuardar.textContent = 'Guardar cambios';
  btnCancelar.hidden = false;
  mostrarError('');
  form.scrollIntoView({ behavior: 'smooth' });
  $('#nombre').focus();
}

function terminarEdicion() {
  editandoId = null;
  form.reset();
  tituloForm.textContent = 'Agregar producto';
  btnGuardar.textContent = 'Guardar producto';
  btnCancelar.hidden = true;
  mostrarError('');
}

btnCancelar.addEventListener('click', terminarEdicion);

// ---------- Guardar (agregar o editar) ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const producto = {
    nombre: $('#nombre').value.trim(),
    categoria: $('#categoria').value,
    cantidad: Number($('#cantidad').value === '' ? NaN : $('#cantidad').value),
    precio: Number($('#precio').value === '' ? NaN : $('#precio').value)
  };

  const error = validar(producto);
  if (error) {
    mostrarError(error);
    return;
  }

  if (editandoId !== null) {
    const original = productos.find((p) => p.id === editandoId);
    await DB.actualizar({ ...original, ...producto, id: editandoId, modificado: new Date().toISOString() });
    mostrarToast('Producto actualizado');
  } else {
    await DB.agregar({ ...producto, creado: new Date().toISOString() });
    mostrarToast('Producto guardado');
  }

  terminarEdicion();
  cargar();
});

// ---------- Editar / eliminar desde la lista ----------
lista.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-accion]');
  if (!btn) return;
  const id = Number(btn.dataset.id);

  if (btn.dataset.accion === 'editar') {
    const p = productos.find((x) => x.id === id);
    if (p) iniciarEdicion(p);
  }

  if (btn.dataset.accion === 'eliminar' && confirm('¿Eliminar este producto?')) {
    await DB.eliminar(id);
    if (editandoId === id) terminarEdicion();
    mostrarToast('Producto eliminado');
    cargar();
  }
});

// ---------- Búsqueda y filtro ----------
buscar.addEventListener('input', render);
filtroCategoria.addEventListener('change', render);

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

cargar();