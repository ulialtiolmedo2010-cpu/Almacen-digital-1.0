const TOTAL_COMPUTADORAS = 30;
let computadoras = [];
let historialDevoluciones = [];
let vistaActual = 'inicio'; // 'inicio' o 'detalle'
let filtroEstado = 'todas'; // 'todas' | 'disponible' | 'prestada'

// Evita que un nombre con símbolos rompa la página
function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

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

  // Cerrar ventanas con Escape o tocando fuera
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal:not(.hidden)").forEach(m => m.classList.add("hidden"));
    }
  });
  document.querySelectorAll(".modal").forEach(m => {
    m.addEventListener("click", (e) => {
      if (e.target === m) m.classList.add("hidden");
    });
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

// Vista inicial: tarjeta del Carrito 1 con Abrir, Prestar todo y Devolver todo
function renderizarVistaInicio() {
  const grid = document.getElementById("grid-carrito");
  grid.innerHTML = '';
  grid.classList.add("is-home");

  document.getElementById("btn-volver-container").classList.add("hidden");
  document.getElementById("search-box-container").classList.add("hidden");
  document.getElementById("filtros-container").classList.add("hidden");

  document.getElementById("titulo-seccion").innerHTML = `<i class="fa-solid fa-boxes-stacked" aria-hidden="true"></i> Selección de carrito`;
  document.getElementById("subtitulo-seccion").innerText = "Abrí el carrito para ver cada computadora, o prestá y devolvé todo junto.";

  const disponiblesCount = computadoras.filter(c => c.estado === 'disponible').length;
  const prestadasCount = computadoras.filter(c => c.estado === 'prestada').length;
  const porcentaje = Math.round((disponiblesCount / TOTAL_COMPUTADORAS) * 100);

  const cardCarrito = document.createElement("article");
  cardCarrito.className = "cart-card";

  cardCarrito.innerHTML = `
    <div class="cart-head">
      <div class="cart-icon" aria-hidden="true"><i class="fa-solid fa-laptop-house"></i></div>
      <div>
        <h3>Carrito principal</h3>
        <p>Carrito N° 1, ${TOTAL_COMPUTADORAS} computadoras</p>
      </div>
    </div>

    <div class="cart-meter">
      <div class="cart-meter-bar" role="img" aria-label="${disponiblesCount} de ${TOTAL_COMPUTADORAS} disponibles" style="--p: ${porcentaje}%"><span></span></div>
      <p><strong>${disponiblesCount}</strong> disponibles y <strong>${prestadasCount}</strong> prestadas</p>
    </div>

    <div class="cart-actions">
      <button type="button" onclick="abrirCarrito1()" class="btn primary">
        <i class="fa-solid fa-folder-open" aria-hidden="true"></i> Ver computadoras
      </button>
      <button type="button" onclick="prestarCarritoCompleto()" class="btn success" ${disponiblesCount === 0 ? 'disabled' : ''}>
        <i class="fa-solid fa-hand-holding" aria-hidden="true"></i> Prestar todo el carrito
      </button>
      <button type="button" onclick="abrirModalDevolucionCarrito()" class="btn warn" ${prestadasCount === 0 ? 'disabled' : ''}>
        <i class="fa-solid fa-arrow-rotate-left" aria-hidden="true"></i> Devolver todo el carrito
      </button>
    </div>
  `;

  grid.appendChild(cardCarrito);
}

// Abre el modal para prestar el carrito completo
function prestarCarritoCompleto() {
  const disponibles = computadoras.filter(c => c.estado === 'disponible');
  if (disponibles.length === 0) {
    alert("No hay computadoras disponibles en el Carrito 1.");
    return;
  }

  document.getElementById("prestamo-id-compu").value = "carrito_completo";
  document.getElementById("modal-prestamo-titulo").innerText = `Carrito N° 1, ${disponibles.length} compus disponibles`;
  document.getElementById("input-alumno").value = '';
  document.getElementById("input-profesor").value = '';
  document.getElementById("input-obs-salida").value = 'Préstamo completo de Carrito 1';

  document.getElementById("modal-prestamo").classList.remove("hidden");
  document.getElementById("input-alumno").focus();
}

// Abre el modal de devolución para el carrito completo
function abrirModalDevolucionCarrito() {
  const prestadas = computadoras.filter(c => c.estado === 'prestada');
  if (prestadas.length === 0) {
    alert("No hay computadoras prestadas actualmente en el Carrito 1.");
    return;
  }

  document.getElementById("dev-id-compu").value = "carrito_completo";
  document.getElementById("modal-devolucion-titulo").innerText = `Carrito N° 1, ${prestadas.length} compus fuera`;
  document.getElementById("dev-alumno").innerText = "Préstamo grupal / Múltiples alumnos";
  document.getElementById("dev-profesor").innerText = prestadas[0].profesor || "Profesor a cargo";
  document.getElementById("dev-tiempo").innerText = "Múltiples tiempos de salida";
  document.getElementById("input-falla").value = '';

  document.getElementById("modal-devolucion").classList.remove("hidden");
}

function abrirCarrito1() {
  vistaActual = 'detalle';
  renderizar();
}

function volverACarritos() {
  vistaActual = 'inicio';
  filtroEstado = 'todas';
  document.getElementById("input-busqueda").value = '';
  renderizar();
}

function cambiarFiltro(valor) {
  filtroEstado = valor;
  renderizar();
}

// Vista detallada: muestra las computadoras del carrito
function renderizarMatriz(filtro = '') {
  const grid = document.getElementById("grid-carrito");
  grid.innerHTML = '';
  grid.classList.remove("is-home");

  document.getElementById("btn-volver-container").classList.remove("hidden");
  document.getElementById("search-box-container").classList.remove("hidden");
  document.getElementById("filtros-container").classList.remove("hidden");

  document.querySelectorAll("#filtros-container .chip").forEach(chip => {
    const activo = chip.dataset.filtro === filtroEstado;
    chip.classList.toggle("is-active", activo);
    chip.setAttribute("aria-pressed", activo);
  });

  document.getElementById("titulo-seccion").innerHTML = `<i class="fa-solid fa-laptop" aria-hidden="true"></i> Computadoras del carrito 1`;
  document.getElementById("subtitulo-seccion").innerText = "Prestá las disponibles o registrá la devolución de las que están afuera.";

  let mostradas = 0;

  computadoras.forEach(compu => {
    const textoBuscado = `${compu.numero} ${compu.alumno} ${compu.profesor}`.toLowerCase();
    if (filtro && !textoBuscado.includes(filtro)) return;
    if (filtroEstado !== 'todas' && compu.estado !== filtroEstado) return;

    mostradas++;
    const esPrestada = compu.estado === 'prestada';

    const card = document.createElement("div");
    card.className = `card-compu ${esPrestada ? 'card-prestada' : 'card-disponible'}`;

    card.innerHTML = `
      <div class="card-top">
        <div class="card-num"><small>Compu</small>${compu.numero}</div>
        <button type="button" onclick="abrirModalQR('${compu.numero}')" class="qr-btn" title="Ver código QR" aria-label="Ver código QR de la compu ${compu.numero}">
          <i class="fa-solid fa-qrcode" aria-hidden="true"></i>
        </button>
      </div>

      ${esPrestada ? `
        <span class="estado out"><i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i> Prestada</span>
        <div class="card-body-prestada">
          <p title="${esc(compu.alumno)}"><i class="fa-solid fa-user" aria-hidden="true"></i> ${esc(compu.alumno)}</p>
          <p title="${esc(compu.profesor)}"><i class="fa-solid fa-user-tie" aria-hidden="true"></i> ${esc(compu.profesor)}</p>
          <div class="timer" id="timer-${compu.id}">${calcularTiempoTranscurrido(compu.horaSalida)}</div>
        </div>
        <button type="button" onclick="abrirModalDevolucion(${compu.id})" class="btn warn btn-card">
          <i class="fa-solid fa-arrow-rotate-left" aria-hidden="true"></i> Devolver
        </button>
      ` : `
        <span class="estado ok"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Disponible</span>
        <button type="button" onclick="abrirModalPrestamo(${compu.id})" class="btn success btn-card">
          <i class="fa-solid fa-hand-holding" aria-hidden="true"></i> Prestar
        </button>
      `}
    `;

    grid.appendChild(card);
  });

  if (mostradas === 0) {
    grid.innerHTML = `<p class="empty">No hay computadoras que coincidan con la búsqueda o el filtro.</p>`;
  }
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
  document.getElementById("input-alumno").focus();
}

function confirmarPrestamo(e) {
  e.preventDefault();
  const rawId = document.getElementById("prestamo-id-compu").value;
  const alumno = document.getElementById("input-alumno").value.trim();
  const profesor = document.getElementById("input-profesor").value.trim();
  const obsSalida = document.getElementById("input-obs-salida").value.trim();
  const ahora = new Date().toISOString();

  if (rawId === "carrito_completo") {
    computadoras.forEach(compu => {
      if (compu.estado === 'disponible') {
        compu.estado = 'prestada';
        compu.alumno = alumno;
        compu.profesor = profesor;
        compu.obsSalida = obsSalida || 'Préstamo completo de Carrito 1';
        compu.horaSalida = ahora;
      }
    });
  } else {
    const id = parseInt(rawId);
    const compu = computadoras.find(c => c.id === id);
    if (compu) {
      compu.estado = 'prestada';
      compu.alumno = alumno;
      compu.profesor = profesor;
      compu.obsSalida = obsSalida;
      compu.horaSalida = ahora;
    }
  }

  guardarEnLocalStorage();
  cerrarModal('modal-prestamo');
  renderizar();
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
  document.getElementById("input-falla").focus();
}

function confirmarDevolucion(e) {
  e.preventDefault();
  const rawId = document.getElementById("dev-id-compu").value;
  const falla = document.getElementById("input-falla").value.trim();
  const fechaHoraDevolucion = new Date().toLocaleString();

  if (rawId === "carrito_completo") {
    const prestadas = computadoras.filter(c => c.estado === 'prestada');
    prestadas.forEach(compu => {
      const tiempoTotal = calcularTiempoTranscurrido(compu.horaSalida);

      historialDevoluciones.unshift({
        numeroCompu: compu.numero,
        alumno: compu.alumno,
        profesor: compu.profesor,
        fechaHora: fechaHoraDevolucion,
        tiempoTotal: tiempoTotal,
        falla: falla || 'Devolución completa de carrito'
      });

      compu.estado = 'disponible';
      compu.alumno = '';
      compu.profesor = '';
      compu.obsSalida = '';
      compu.horaSalida = null;
    });
  } else {
    const id = parseInt(rawId);
    const compu = computadoras.find(c => c.id === id);
    if (compu) {
      const tiempoTotal = calcularTiempoTranscurrido(compu.horaSalida);

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
    }
  }

  guardarEnLocalStorage();
  cerrarModal('modal-devolucion');
  renderizar();
  renderizarHistorial();
}

function renderizarHistorial() {
  const tbody = document.getElementById("tabla-historial");
  tbody.innerHTML = '';

  document.getElementById("historial-count").innerText = `${historialDevoluciones.length} ${historialDevoluciones.length === 1 ? 'registro' : 'registros'}`;

  if (historialDevoluciones.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="vacio">Todavía no hay devoluciones registradas.</td></tr>`;
    return;
  }

  historialDevoluciones.forEach(item => {
    const tr = document.createElement("tr");
    const tieneFalla = item.falla && item.falla !== 'Sin novedades' && item.falla !== 'Devolución completa de carrito';

    tr.innerHTML = `
      <td data-label="Compu"><strong>Compu ${esc(item.numeroCompu)}</strong></td>
      <td data-label="Alumno">${esc(item.alumno)}</td>
      <td data-label="Autorizó" class="muted">${esc(item.profesor)}</td>
      <td data-label="Devuelta" class="muted">${esc(item.fechaHora)}</td>
      <td data-label="Tiempo total" class="tiempo">${esc(item.tiempoTotal)}</td>
      <td data-label="Observaciones">
        ${tieneFalla
          ? `<span class="falla-badge"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> ${esc(item.falla)}</span>`
          : `<span class="sin-fallas">${esc(item.falla || 'Sin fallas')}</span>`}
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
