const TOTAL_COMPUTADORAS = 30;
let computadoras = [];
let historialDevoluciones = [];
let vistaActual = 'inicio'; // 'inicio' o 'detalle'

document.addEventListener("DOMContentLoaded", () => {
  cargarDatosLocalStorage();
  renderizar();
  renderizarHistorial();
  
  setInterval(actualizarCronometros, 1000);

  document.getElementById("input-busqueda").addEventListener("input", (e) => {
    if (vistaActual === 'detalle') {
      renderizarMatriz(e.target.value.toLowerCase());
    }
  });
});

function cargarDatosLocalStorage() {
  const compusGuardadas = localStorage.getItem("espacio_digital_compus");
  const historialGuardado = localStorage.getItem("espacio_digital_historial");

  if (compusGuardadas) {
    computadoras = JSON.parse(compusGuardadas);
  } else {
    for (let i = 1; i <= TOTAL_COMPUTADORAS; i++) {
      computadoras.push({
        id: i,
        numero: i < 10 ? `0${i}` : `${i}`,
        estado: 'disponible',
        alumno: '',
        profesor: '',
        obsSalida: '',
        horaSalida: null
      });
    }
    guardarEnLocalStorage();
  }

  if (historialGuardado) {
    historialDevoluciones = JSON.parse(historialGuardado);
  }
}

function guardarEnLocalStorage() {
  localStorage.setItem("espacio_digital_compus", JSON.stringify(computadoras));
  localStorage.setItem("espacio_digital_historial", JSON.stringify(historialDevoluciones));
}

// Router principal de renderizado según la vista actual
function renderizar() {
  actualizarMetricas();
  if (vistaActual === 'inicio') {
    renderizarVistaInicio();
  } else {
    const textoBuscado = document.getElementById("input-busqueda").value.toLowerCase();
    renderizarMatriz(textoBuscado);
  }
}

// Vista inicial: Solo muestra la tarjeta de Carrito 1
function renderizarVistaInicio() {
  const grid = document.getElementById("grid-carrito");
  grid.innerHTML = '';

  document.getElementById("btn-volver-container").classList.add("hidden");
  document.getElementById("search-box-container").classList.add("hidden");

  document.getElementById("titulo-seccion").innerHTML = `<i class="fa-solid fa-boxes-stacked"></i> Selección de Carrito`;
  document.getElementById("subtitulo-seccion").innerText = "Haz clic en el Carrito 1 para abrir la lista de computadoras.";

  const disponiblesCount = computadoras.filter(c => c.estado === 'disponible').length;
  const prestadasCount = computadoras.filter(c => c.estado === 'prestada').length;

  const cardCarrito = document.createElement("div");
  cardCarrito.className = "card-compu card-disponible";
  cardCarrito.style.cursor = "pointer";
  cardCarrito.style.padding = "1.5rem";

  cardCarrito.onclick = abrirCarrito1;

  cardCarrito.innerHTML = `
    <div class="card-top">
      <span class="badge-num disponible">
        Carrito N° 1
      </span>
      <span style="font-size: 0.75rem; color: #94a3b8;">${TOTAL_COMPUTADORAS} Computadoras</span>
    </div>

    <div class="card-body-disponible">
      <i class="fa-solid fa-laptop-house" style="font-size: 2.5rem; color: #818cf8; margin-bottom: 0.5rem;"></i>
      <p style="font-size: 0.85rem; font-weight: bold; color: #f8fafc;">Carrito Principal</p>
      <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem;">
        ${disponiblesCount} disponibles - ${prestadasCount} prestadas
      </p>
    </div>

    <button type="button" class="btn-card btn-prestar">
      <i class="fa-solid fa-folder-open"></i> Abrir Carrito 1
    </button>
  `;

  grid.appendChild(cardCarrito);
}

function abrirCarrito1() {
  vistaActual = 'detalle';
  renderizar();
}

function volverACarritos() {
  vistaActual = 'inicio';
  document.getElementById("input-busqueda").value = '';
  renderizar();
}

// Vista detallada: Muestra las 30 computadoras y respeta la búsqueda
function renderizarMatriz(filtro = '') {
  const grid = document.getElementById("grid-carrito");
  grid.innerHTML = '';

  document.getElementById("btn-volver-container").classList.remove("hidden");
  document.getElementById("search-box-container").classList.remove("hidden");

  document.getElementById("titulo-seccion").innerHTML = `<i class="fa-solid fa-laptop"></i> Estado de Computadoras (Carrito 1)`;
  document.getElementById("subtitulo-seccion").innerText = "Selecciona una computadora verde para prestar o una roja para gestionar su devolución.";

  computadoras.forEach(compu => {
    const textoBuscado = `${compu.numero} ${compu.alumno} ${compu.profesor}`.toLowerCase();
    if (filtro && !textoBuscado.includes(filtro)) return;

    const esPrestada = compu.estado === 'prestada';
    
    const card = document.createElement("div");
    card.className = `card-compu ${esPrestada ? 'card-prestada' : 'card-disponible'}`;

    card.innerHTML = `
      <div class="card-top">
        <span class="badge-num ${esPrestada ? 'prestada' : 'disponible'}">
          Compu ${compu.numero}
        </span>
        <button type="button" onclick="abrirModalQR('${compu.numero}')" class="qr-btn" title="Ver Código QR">
          <i class="fa-solid fa-qrcode"></i>
        </button>
      </div>

      ${esPrestada ? `
        <div class="card-body-prestada">
          <p><i class="fa-solid fa-user text-rose-400"></i> ${compu.alumno}</p>
          <p><i class="fa-solid fa-user-tie"></i> ${compu.profesor}</p>
          <div class="timer" id="timer-${compu.id}">
            ${calcularTiempoTranscurrido(compu.horaSalida)}
          </div>
        </div>
        <button type="button" onclick="abrirModalDevolucion(${compu.id})" class="btn-card btn-devolver">
          <i class="fa-solid fa-arrow-rotate-left"></i> Devolver
        </button>
      ` : `
        <div class="card-body-disponible">
          <i class="fa-solid fa-laptop"></i>
          <p>Guardada en carrito</p>
        </div>
        <button type="button" onclick="abrirModalPrestamo(${compu.id})" class="btn-card btn-prestar">
          <i class="fa-solid fa-hand-holding"></i> Prestar
        </button>
      `}
    `;

    grid.appendChild(card);
  });
}

function actualizarMetricas() {
  const disponibles = computadoras.filter(c => c.estado === 'disponible').length;
  const prestadas = computadoras.filter(c => c.estado === 'prestada').length;

  document.getElementById("stat-disponibles").innerText = disponibles;
  document.getElementById("stat-prestadas").innerText = prestadas;
}

function calcularTiempoTranscurrido(horaSalida) {
  if (!horaSalida) return "00m 00s";
  const inicio = new Date(horaSalida);
  const ahora = new Date();
  const diffMs = ahora - inicio;

  const minutos = Math.floor(diffMs / 60000);
  const segundos = Math.floor((diffMs % 60000) / 1000);

  const minsStr = minutos < 10 ? `0${minutos}` : minutos;
  const segsStr = segundos < 10 ? `0${segundos}` : segundos;

  return `${minsStr}m ${segsStr}s`;
}

function actualizarCronometros() {
  computadoras.forEach(compu => {
    if (compu.estado === 'prestada') {
      const el = document.getElementById(`timer-${compu.id}`);
      if (el) el.innerText = calcularTiempoTranscurrido(compu.horaSalida);
    }
  });
}

function abrirModalPrestamo(id) {
  const compu = computadoras.find(c => c.id === id);
  if (!compu) return;

  document.getElementById("prestamo-id-compu").value = compu.id;
  document.getElementById("modal-prestamo-titulo").innerText = `Computadora N° ${compu.numero}`;
  document.getElementById("input-alumno").value = '';
  document.getElementById("input-profesor").value = '';
  document.getElementById("input-obs-salida").value = '';

  document.getElementById("modal-prestamo").classList.remove("hidden");
}

function confirmarPrestamo(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById("prestamo-id-compu").value);
  const alumno = document.getElementById("input-alumno").value.trim();
  const profesor = document.getElementById("input-profesor").value.trim();
  const obsSalida = document.getElementById("input-obs-salida").value.trim();

  const compu = computadoras.find(c => c.id === id);
  if (compu) {
    compu.estado = 'prestada';
    compu.alumno = alumno;
    compu.profesor = profesor;
    compu.obsSalida = obsSalida;
    compu.horaSalida = new Date().toISOString();

    guardarEnLocalStorage();
    cerrarModal('modal-prestamo');
    renderizar();
  }
}

function abrirModalDevolucion(id) {
  const compu = computadoras.find(c => c.id === id);
  if (!compu) return;

  document.getElementById("dev-id-compu").value = compu.id;
  document.getElementById("modal-devolucion-titulo").innerText = `Devolver Computadora N° ${compu.numero}`;
  document.getElementById("dev-alumno").innerText = compu.alumno;
  document.getElementById("dev-profesor").innerText = compu.profesor;
  document.getElementById("dev-tiempo").innerText = calcularTiempoTranscurrido(compu.horaSalida);
  document.getElementById("input-falla").value = '';

  document.getElementById("modal-devolucion").classList.remove("hidden");
}

function confirmarDevolucion(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById("dev-id-compu").value);
  const falla = document.getElementById("input-falla").value.trim();

  const compu = computadoras.find(c => c.id === id);
  if (compu) {
    const tiempoTotal = calcularTiempoTranscurrido(compu.horaSalida);
    const fechaHoraDevolucion = new Date().toLocaleString();

    historialDevoluciones.unshift({
      numeroCompu: compu.numero,
      alumno: compu.alumno,
      profesor: compu.profesor,
      fechaHora: fechaHoraDevolucion,
      tiempoTotal: tiempoTotal,
      falla: falla || 'Sin novedades'
    });

    compu.estado = 'disponible';
    compu.alumno = '';
    compu.profesor = '';
    compu.obsSalida = '';
    compu.horaSalida = null;

    guardarEnLocalStorage();
    cerrarModal('modal-devolucion');
    renderizar();
    renderizarHistorial();
  }
}

function renderizarHistorial() {
  const tbody = document.getElementById("tabla-historial");
  tbody.innerHTML = '';

  document.getElementById("historial-count").innerText = `${historialDevoluciones.length} registros`;

  if (historialDevoluciones.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 1rem;">No hay devoluciones registradas aún.</td></tr>`;
    return;
  }

  historialDevoluciones.forEach(item => {
    const tr = document.createElement("tr");
    const tieneFalla = item.falla && item.falla !== 'Sin novedades';

    tr.innerHTML = `
      <td><strong>Compu ${item.numeroCompu}</strong></td>
      <td>${item.alumno}</td>
      <td style="color: #94a3b8;">${item.profesor}</td>
      <td style="color: #94a3b8;">${item.fechaHora}</td>
      <td style="font-family: monospace; color: #fbbf24;">${item.tiempoTotal}</td>
      <td>
        ${tieneFalla 
          ? `<span class="falla-badge"><i class="fa-solid fa-triangle-exclamation"></i> ${item.falla}</span>` 
          : `<span class="sin-fallas">Sin fallas</span>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrirModalQR(numeroCompu) {
  document.getElementById("qr-compu-titulo").innerText = `Computadora N° ${numeroCompu}`;
  const contenedorQR = document.getElementById("contenedor-qr");
  contenedorQR.innerHTML = '';

  new QRCode(contenedorQR, {
    text: `EspacioDigital-Compu-${numeroCompu}`,
    width: 130,
    height: 130
  });

  document.getElementById("modal-qr").classList.remove("hidden");
}

function cerrarModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("hidden");
}