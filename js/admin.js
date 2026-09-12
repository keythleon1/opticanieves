/**
 * CENTRO ÓPTICO NIEVES - CONTROLADOR MAESTRO DEL PANEL ADMINISTRATIVO
 * Versión 3.0 Widescreen - Cero Emojis - 100% Funcional
 */

// =============================================================================
// ESTADO GLOBAL DE LA APLICACIÓN
// =============================================================================
const AppState = {
    tabActual: 'dashboard',
    sedeFiltro: 'todas',
    pacienteFichaActual: null,
    pacienteEditingId: null,
    fromWizardNewPatient: false,
    wizard: {
        paciente: null,
        montura: { desc: '', precio: 0 },
        cristales: {
            tipo: 'Monofocal',
            material: 'CR-39 Orgánico',
            tratamientos: [],
            notas: '',
            precio: 0,
            rx: {
                od: { sph: '', cyl: '', axis: '', add: '', av: '' },
                os: { sph: '', cyl: '', axis: '', add: '', av: '' },
                dp: '',
                alt: ''
            }
        },
        consulta: {
            tipo: 'Refracción Integral y Fondo de Ojo',
            precio: 0
        },
        descuento: 0,
        pagos: [],
        reciboGeneradoId: null
    },
    reciboActual: null,
    recipeActual: null,
    informeActual: null,
    whatsapp: {
        paciente: null,
        plantillaSeleccionada: 'lentes_listos'
    }
};

// =============================================================================
// INICIALIZACIÓN AL CARGAR EL DOM
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!window.OpticaStorage) {
        console.error('OpticaStorage no está disponible.');
        return;
    }

    // Limpieza y auto-reparación preventiva de duplicados
    autoLimpiarPacientesDuplicados();

    initNavigation();
    initGlobalSedeSelector();
    initTasaSelector();
    initSearchInputs();
    initWizardCatalog();
    initEventForms();

    const config = window.OpticaStorage.getConfig();
    actualizarDisplayTasa(config.tasa_usd_ves, config.tasa_fecha);
    actualizarBadgesContadores();

    renderCurrentTab();
});

function autoLimpiarPacientesDuplicados() {
    try {
        if (!window.OpticaStorage || !window.OpticaStorage.getPacientes) return;
        const list = window.OpticaStorage.getPacientes();
        if (!list || list.length <= 1) return;

        const seen = new Map();
        let hayDuplicados = false;

        for (const p of list) {
            const cleanCedula = (p.cedula || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const key = cleanCedula || p.id;
            if (!seen.has(key)) {
                seen.set(key, p);
            } else {
                hayDuplicados = true;
                seen.set(key, { ...seen.get(key), ...p });
            }
        }

        if (hayDuplicados) {
            const uniqueList = Array.from(seen.values());
            window.OpticaStorage.savePacientes(uniqueList);
        }
    } catch (e) {
        console.warn('Error en autoLimpiarPacientesDuplicados', e);
    }
}

// =============================================================================
// SISTEMA DE NOTIFICACIONES TOAST (CERO EMOJIS)
// =============================================================================
window.showAdminToast = function(mensaje, tipo = 'success') {
    const toastBox = document.getElementById('adminToastBox');
    if (!toastBox) return;

    let iconClass = 'fa-circle-check';
    let borderColor = '#10B981';

    if (tipo === 'warning') {
        iconClass = 'fa-triangle-exclamation';
        borderColor = '#F59E0B';
    } else if (tipo === 'error') {
        iconClass = 'fa-circle-xmark';
        borderColor = '#EF4444';
    } else if (tipo === 'info') {
        iconClass = 'fa-circle-info';
        borderColor = '#3B82F6';
    }

    const toast = document.createElement('div');
    toast.className = 'admin-toast-item';
    toast.style.borderLeft = `4px solid ${borderColor}`;
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}" style="color: ${borderColor}; font-size: 1.15rem;"></i>
        <div style="flex: 1; font-size: 0.88rem; color: #0F172A; font-weight: 500;">
            ${mensaje}
        </div>
        <button type="button" style="background: none; border: none; color: #94A3B8; cursor: pointer;" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    // Fix: ensure toast container is visible
    toastBox.style.display = 'flex';

    toastBox.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-8px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3800);
};

// =============================================================================
// HELPERS UNIVERSALES DE MODAL
// (Resuelven el problema de modales con style="display:none" + classList.add)
// =============================================================================
function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('active'));
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    // Wait for CSS transition before hiding
    setTimeout(() => {
        if (!modal.classList.contains('active')) {
            modal.style.display = 'none';
        }
    }, 250);
}

// Make them global
window.openModal = openModal;
window.closeModal = closeModal;


// =============================================================================
// NAVEGACIÓN Y PESTAÑAS WIDESCREEN
// =============================================================================
function initNavigation() {
    const navItems = document.querySelectorAll('.admin-nav-item[data-tab]');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');
            window.switchAdminTab(tabName);
        });
    });

    const menuToggle = document.getElementById('btnMenuToggle');
    const sidebar = document.getElementById('adminSidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open-mobile');
        });
    }
}

window.switchAdminTab = function(tabName) {
    AppState.tabActual = tabName;

    document.querySelectorAll('.admin-nav-item').forEach(el => {
        if (el.getAttribute('data-tab') === tabName) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    document.querySelectorAll('.tab-view').forEach(view => {
        view.classList.remove('active');
    });

    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) {
        targetView.classList.add('active');
    }

    const titles = {
        'dashboard': { title: 'Dashboard Ejecutivo', sub: 'Visión general de óptica, ventas y flujo de pacientes' },
        'pacientes360': { title: 'Expediente Pacientes 360', sub: 'Base de datos clínica, refracción OD/OS y antecedentes' },
        'venta-wizard': { title: 'Venta & Presupuesto Asistido', sub: 'Monturas, cristales con tratamientos y cobro multimoneda' },
        'recibos': { title: 'Recibos Oficiales de Óptica', sub: 'Emisión, control de pagos, abonos y garantías' },
        'laboratorio': { title: 'Taller & Laboratorio Óptico', sub: 'Control de fases de biselado, tallado y entrega de lentes' },
        'recipes': { title: 'Récipes Oftalmológicos', sub: 'Emisión e impresión de récipes en formato Hoja Dual' },
        'informes': { title: 'Informes Médicos Clínicos', sub: 'Evaluaciones oftalmológicas formales con biomicroscopía y PIO' },
        'whatsapp': { title: 'Centro de Mensajería WhatsApp', sub: 'Simulador de smartphone con plantillas por intervalos de control' },
        'caja': { title: 'Caja Diaria & Arqueo', sub: 'Control de efectivo USD, Pago Móvil, Punto de Venta y Zelle' },
        'citas': { title: 'Agenda de Citas Clínicas', sub: 'Control de consultas visuales y citas agendadas' },
        'configuracion': { title: 'Configuración & Tasa BCV', sub: 'Gestión de sedes, médicos tratantes y tasa oficial del día' }
    };

    const info = titles[tabName] || { title: 'Panel Administrativo', sub: 'Centro Óptico Nieves' };
    const tEl = document.getElementById('topbarTitle');
    const sEl = document.getElementById('topbarSubtitle');
    if (tEl) tEl.innerText = info.title;
    if (sEl) sEl.innerText = info.sub;

    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) sidebar.classList.remove('open-mobile');

    renderCurrentTab();
};

function renderCurrentTab() {
    actualizarBadgesContadores();

    switch (AppState.tabActual) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'pacientes360':
            renderPacientesTable();
            break;
        case 'venta-wizard':
            if (!AppState.wizard.paciente) {
                window.volverWizardPaso1();
            }
            break;
        case 'recibos':
            renderRecibosTable();
            break;
        case 'laboratorio':
            renderLaboratorioKanban();
            break;
        case 'recipes':
            renderRecipesTable();
            break;
        case 'informes':
            renderInformesTable();
            break;
        case 'whatsapp':
            renderWhatsAppCenter();
            break;
        case 'caja':
            renderCaja();
            break;
        case 'citas':
            renderCitasTable();
            break;
        case 'configuracion':
            cargarConfiguracionInputs();
            break;
    }
}

function actualizarBadgesContadores() {
    const pacientes = window.OpticaStorage.getPacientes();
    const recibos = window.OpticaStorage.getRecibos();
    const labOrders = window.OpticaStorage.getOrdenesLaboratorio();
    const recipes = window.OpticaStorage.getRecipes();
    const informes = window.OpticaStorage.getInformes();
    const citas = window.OpticaStorage.getCitas();

    const setBadge = (id, count) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = count;
        if (count > 0) {
            el.classList.add('has-badge');
            el.classList.remove('zero-badge');
            el.style.display = 'inline-flex';
        } else {
            el.classList.add('zero-badge');
            el.classList.remove('has-badge');
            el.style.display = 'none'; // No saturar la barra con ceros
        }
    };

    setBadge('navCountPacientes', pacientes.length);
    setBadge('navCountRecibos', recibos.length);
    const activosLab = labOrders.filter(o => o.fase !== 'FASE_4').length;
    setBadge('navCountLaboratorio', activosLab);
    setBadge('navCountRecipes', recipes.length);
    setBadge('navCountInformes', informes.length);
    const pendientesCitas = citas.filter(c => c.estado === 'PENDIENTE').length;
    setBadge('navCountCitas', pendientesCitas);
}

// =============================================================================
// SELECTOR DE SEDE GLOBAL Y TASA BCV
// =============================================================================
function initGlobalSedeSelector() {
    const select = document.getElementById('globalSedeSelect');
    if (select) {
        select.addEventListener('change', (e) => {
            AppState.sedeFiltro = e.target.value;
            renderCurrentTab();
        });
    }
}

function initTasaSelector() {
    const config = window.OpticaStorage.getConfig();
    actualizarDisplayTasa(config.tasa_usd_ves, config.tasa_fecha);

    const btnEditar = document.getElementById('btnEditarTasa');
    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            const conf = window.OpticaStorage.getConfig();
            const inpTasa = document.getElementById('inputTasaModal');
            const inpFecha = document.getElementById('inputFechaTasaModal');
            if (inpTasa) inpTasa.value = conf.tasa_usd_ves;
            if (inpFecha) inpFecha.value = conf.tasa_fecha || '';
            openModal('modalEditarTasa');
        });
    }
}

function actualizarDisplayTasa(tasa, fecha) {
    const topbarVal = document.getElementById('topbarTasaVal');
    if (topbarVal) {
        topbarVal.innerText = `${parseFloat(tasa).toFixed(2)} Bs/$`;
    }
    const cfgDisp = document.getElementById('cfgFechaValorDisplay');
    if (cfgDisp && fecha) {
        cfgDisp.innerText = fecha;
    }
    const cajaDisp = document.getElementById('cajaTasaDisplay');
    if (cajaDisp) {
        cajaDisp.innerText = `${parseFloat(tasa).toFixed(2)} Bs/$`;
    }
}

window.cerrarModalTasa = function() {
    closeModal('modalEditarTasa');
};

window.guardarTasaModal = function() {
    const inpTasa = document.getElementById('inputTasaModal');
    const inpFecha = document.getElementById('inputFechaTasaModal');
    const nuevaTasa = parseFloat(inpTasa?.value);
    const nuevaFecha = inpFecha?.value?.trim() || 'Martes, 15 Septiembre 2026';

    if (nuevaTasa && nuevaTasa > 0) {
        window.OpticaStorage.updateTasaCambio(nuevaTasa, nuevaFecha);
        actualizarDisplayTasa(nuevaTasa, nuevaFecha);
        window.cerrarModalTasa();
        renderCurrentTab();
        showAdminToast(`Tasa BCV actualizada a ${nuevaTasa.toFixed(2)} Bs/$`);
    } else {
        showAdminToast('Por favor ingrese un valor de tasa válido.', 'warning');
    }
};

// =============================================================================
// MÓDULO 1: DASHBOARD EJECUTIVO
// =============================================================================
function renderDashboard() {
    const stats = window.OpticaStorage.getDashboardStats();
    const config = window.OpticaStorage.getConfig();
    const tasa = config.tasa_usd_ves || 842.21;

    const elPacientes = document.getElementById('kpiTotalPacientes');
    const elVentasUsd = document.getElementById('kpiVentasHoy');
    const elVentasBs = document.getElementById('kpiVentasHoyBs');
    const elEnLab = document.getElementById('kpiEnLaboratorio');
    const elListos = document.getElementById('kpiListosRetiro');
    const elPorCobrar = document.getElementById('kpiCuentasPorCobrar');
    const elCitas = document.getElementById('kpiCitasHoy');

    if (elPacientes) elPacientes.innerText = stats.total_pacientes;
    if (elVentasUsd) elVentasUsd.innerText = `$${stats.ventas_hoy_usd.toFixed(2)}`;
    if (elVentasBs) {
        const bs = stats.ventas_hoy_usd * tasa;
        elVentasBs.innerText = `${bs.toLocaleString('es-VE', { maximumFractionDigits: 2 })} Bs`;
    }
    if (elEnLab) elEnLab.innerText = stats.ordenes_en_taller;
    if (elListos) elListos.innerText = stats.ordenes_listas_retiro;
    if (elPorCobrar) elPorCobrar.innerText = `$${stats.cuentas_por_cobrar_usd.toFixed(2)}`;
    if (elCitas) elCitas.innerText = stats.citas_pendientes_hoy;

    const ultimosBox = document.getElementById('dashUltimosRecibosBox');
    if (ultimosBox) {
        const recibos = window.OpticaStorage.getRecibos(AppState.sedeFiltro);
        if (recibos.length === 0) {
            ultimosBox.innerHTML = `
                <div class="empty-state-card" style="padding: 2.5rem 1rem;">
                    <i class="fa-solid fa-receipt" style="font-size: 2.5rem; color: #CBD5E1; margin-bottom: 0.75rem;"></i>
                    <p style="color: #64748B; font-weight: 500;">No hay recibos registrados aún en el sistema.</p>
                </div>
            `;
        } else {
            const ultimos = recibos.slice(0, 5);
            ultimosBox.innerHTML = `
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Correlativo</th>
                                <th>Paciente</th>
                                <th>Sede</th>
                                <th>Total ($)</th>
                                <th>Estado</th>
                                <th style="text-align: right;">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ultimos.map(r => `
                                <tr>
                                    <td><strong style="color: #2563EB;">${r.correlativo || r.id}</strong></td>
                                    <td><strong>${r.paciente_nombre}</strong><br><small class="text-muted">${r.paciente_cedula}</small></td>
                                    <td><span class="badge-tag badge-blue">${r.sede}</span></td>
                                    <td><strong class="text-emerald">$${parseFloat(r.total_usd).toFixed(2)}</strong></td>
                                    <td>
                                        <span class="badge-tag ${r.estado === 'PAGADO' ? 'badge-green' : (r.estado === 'ABONADO' ? 'badge-amber' : 'badge-rose')}">
                                            ${r.estado}
                                        </span>
                                    </td>
                                    <td style="text-align: right;">
                                        <button type="button" class="btn btn-xs btn-outline-primary" onclick="abrirModalRecibo('${r.id}')">
                                            <i class="fa-solid fa-eye"></i> Ver
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    }
}

// =============================================================================
// MÓDULO 2: PACIENTES 360 (EXPEDIENTE CLÍNICO & ÓPTICO)
// =============================================================================
function initSearchInputs() {
    const inpP = document.getElementById('inputBuscarPaciente');
    if (inpP) inpP.addEventListener('input', () => renderPacientesTable());

    const selSedeP = document.getElementById('filtroSedePaciente');
    if (selSedeP) selSedeP.addEventListener('change', () => renderPacientesTable());

    const inpR = document.getElementById('inputBuscarRecibo');
    if (inpR) inpR.addEventListener('input', () => renderRecibosTable());

    const selEstR = document.getElementById('filtroEstadoRecibo');
    if (selEstR) selEstR.addEventListener('change', () => renderRecibosTable());

    const selSedeLab = document.getElementById('filtroSedeLab');
    if (selSedeLab) selSedeLab.addEventListener('change', () => renderLaboratorioKanban());

    const inpC = document.getElementById('inputBuscarCita');
    if (inpC) inpC.addEventListener('input', () => renderCitasTable());

    const selSedeC = document.getElementById('filtroSedeCitas');
    if (selSedeC) selSedeC.addEventListener('change', () => renderCitasTable());

    const wizInpP = document.getElementById('wizardBuscarPacienteInput');
    if (wizInpP) wizInpP.addEventListener('input', (e) => buscarPacientesEnWizard(e.target.value));
}

function renderPacientesTable() {
    const q = (document.getElementById('inputBuscarPaciente')?.value || '').toLowerCase().trim();
    const filtroSede = document.getElementById('filtroSedePaciente')?.value || AppState.sedeFiltro;

    let pacientes = window.OpticaStorage.getPacientes(filtroSede !== 'todas' ? filtroSede : null);

    if (q) {
        pacientes = pacientes.filter(p => 
            (p.nombre || '').toLowerCase().includes(q) ||
            (p.apellido || '').toLowerCase().includes(q) ||
            (p.cedula || '').toLowerCase().includes(q) ||
            (p.telefono || '').toLowerCase().includes(q)
        );
    }

    const tbody = document.getElementById('tablaPacientesBody');
    const empty = document.getElementById('pacientesEmptyState');

    if (!tbody) return;

    if (pacientes.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';

    const todosRecibos = window.OpticaStorage.getRecibos();

    tbody.innerHTML = pacientes.map(p => {
        const iniciales = (p.nombre ? p.nombre.charAt(0) : 'P') + (p.apellido ? p.apellido.charAt(0) : '');
        const formulaResumen = p.ultima_formula ? 
            `OD: ${p.ultima_formula.od?.sph || '0.00'} ${p.ultima_formula.od?.cyl || ''} | OS: ${p.ultima_formula.os?.sph || '0.00'} ${p.ultima_formula.os?.cyl || ''}` : 
            'Sin fórmula';

        const recibosPaciente = todosRecibos.filter(r => r.paciente_id === p.id);
        const saldoTotal = recibosPaciente.reduce((acc, r) => acc + (parseFloat(r.saldo_pendiente_usd) || 0), 0);

        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div class="patient-avatar-circle">${iniciales.toUpperCase()}</div>
                        <div>
                            <strong style="color: #0F172A;">${p.nombre} ${p.apellido || ''}</strong>
                            <div class="cell-sub">${p.edad ? p.edad + ' años &bull; ' : ''}${p.sexo === 'F' ? 'Femenino' : 'Masculino'}</div>
                        </div>
                    </div>
                </td>
                <td><strong style="color: #1E293B;">${p.cedula}</strong></td>
                <td>
                    <div>${p.telefono}</div>
                    <small class="cell-sub"><i class="fa-brands fa-whatsapp text-emerald"></i> ${p.telefono_wa || p.telefono}</small>
                </td>
                <td><span class="badge-tag badge-blue">${p.sede}</span></td>
                <td>
                    <span style="font-family: monospace; font-size: 0.8rem; background: #F1F5F9; padding: 3px 8px; border-radius: 6px; color: #1E293B;">
                        ${formulaResumen}
                    </span>
                </td>
                <td>
                    <span class="badge-tag ${saldoTotal > 0 ? 'badge-rose' : 'badge-green'}">
                        ${saldoTotal > 0 ? `Debe $${saldoTotal.toFixed(2)}` : 'Solvente'}
                    </span>
                </td>
                <td style="text-align: right;">
                    <div class="table-actions-row">
                        <button type="button" class="btn btn-xs btn-outline-primary" title="Ficha 360" onclick="abrirFicha360('${p.id}')">
                            <i class="fa-solid fa-id-card-clip"></i> Ficha 360
                        </button>
                        <button type="button" class="btn btn-xs btn-emerald" title="Nueva Venta" onclick="iniciarVentaConPaciente('${p.id}')">
                            <i class="fa-solid fa-cart-plus"></i>
                        </button>
                        <button type="button" class="btn btn-xs btn-outline-secondary" title="WhatsApp" onclick="abrirWhatsAppPacienteDirecto('${p.id}')">
                            <i class="fa-brands fa-whatsapp"></i>
                        </button>
                        <button type="button" class="btn btn-xs btn-outline-secondary" title="Editar" onclick="editarPaciente('${p.id}')">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.abrirFicha360 = function(pacienteId) {
    const p = window.OpticaStorage.getPacienteById(pacienteId);
    if (!p) {
        showAdminToast('Paciente no encontrado.', 'error');
        return;
    }

    AppState.pacienteFichaActual = p;

    const fNombre = document.getElementById('f360Nombre');
    const fCedula = document.getElementById('f360Cedula');
    const fSede = document.getElementById('f360Sede');
    const fTel = document.getElementById('f360Tel');
    const fWa = document.getElementById('f360Wa');
    const fEmail = document.getElementById('f360Email');
    const fEdadSexo = document.getElementById('f360EdadSexo');
    const fNacimiento = document.getElementById('f360Nacimiento');
    const fOcup = document.getElementById('f360Ocupacion');
    const fDir = document.getElementById('f360Direccion');
    const fAntec = document.getElementById('f360Antecedentes');
    const fNotas = document.getElementById('f360Notas');

    if (fNombre) fNombre.innerText = `${p.nombre} ${p.apellido || ''}`.trim();
    if (fCedula) fCedula.innerText = p.cedula;
    if (fSede) fSede.innerText = p.sede || 'Maracay';
    if (fTel) fTel.innerText = p.telefono || '--';
    if (fWa) fWa.innerText = p.whatsapp || p.telefono_wa || p.telefono || '--';
    if (fEmail) fEmail.innerText = p.email || '--';
    const sexoDesc = p.sexo === 'F' ? 'Femenino' : p.sexo === 'M' ? 'Masculino' : (p.sexo || '--');
    if (fEdadSexo) fEdadSexo.innerText = `${p.edad !== undefined && p.edad !== '' ? p.edad + ' años' : '--'} / ${sexoDesc}`;
    if (fNacimiento) fNacimiento.innerText = p.fecha_nacimiento || '--';
    if (fOcup) fOcup.innerText = p.ocupacion || 'No especificada';
    if (fDir) fDir.innerText = p.direccion || 'No especificada';
    if (fAntec) fAntec.innerText = p.antecedentes || 'Sin antecedentes reportados.';
    if (fNotas) fNotas.innerText = p.notas || 'Sin observaciones.';

    const f = p.ultima_formula || {};
    const od = f.od || {};
    const os = f.os || {};

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val || '--';
    };

    setVal('f360OdSph', od.sph);
    setVal('f360OdCyl', od.cyl);
    setVal('f360OdAxis', od.axis);
    setVal('f360OdAdd', od.add);
    setVal('f360OdAv', od.av);

    setVal('f360OsSph', os.sph);
    setVal('f360OsCyl', os.cyl);
    setVal('f360OsAxis', os.axis);
    setVal('f360OsAdd', os.add);
    setVal('f360OsAv', os.av);

    setVal('f360Dp', f.dp);
    setVal('f360Alt', f.alt);
    setVal('f360TipoLente', f.tipo_lente || 'Monofocal');
    setVal('f360Material', f.material || 'CR-39 Orgánico');

    // Use getFicha360 (correct name) with fallback to getHistorialCompletoPaciente
    const expedienteFn = window.OpticaStorage.getFicha360
        ? window.OpticaStorage.getFicha360.bind(window.OpticaStorage)
        : window.OpticaStorage.getHistorialCompletoPaciente
            ? window.OpticaStorage.getHistorialCompletoPaciente.bind(window.OpticaStorage)
            : null;
    const expediente = expedienteFn ? expedienteFn(pacienteId) : {
        paciente: p, recibos: [], laboratorio: [], recipes: [], informes: [], citas: []
    };

    const recList = document.getElementById('f360RecibosList');
    const recCount = document.getElementById('f360CountRecibos');
    if (recCount) recCount.innerText = expediente.recibos.length;
    if (recList) {
        if (expediente.recibos.length === 0) {
            recList.innerHTML = '<p class="text-muted" style="padding: 1rem 0;">No tiene recibos ni compras registradas.</p>';
        } else {
            recList.innerHTML = `
                <table class="data-table" style="font-size: 0.85rem;">
                    <thead>
                        <tr>
                            <th>Correlativo</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Saldo</th>
                            <th>Estado</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expediente.recibos.map(r => `
                            <tr>
                                <td><strong>${r.correlativo || r.id}</strong></td>
                                <td>${r.fecha}</td>
                                <td><strong class="text-emerald">$${parseFloat(r.total_usd).toFixed(2)}</strong></td>
                                <td><strong class="${r.saldo_pendiente_usd > 0 ? 'text-rose' : 'text-emerald'}">$${parseFloat(r.saldo_pendiente_usd).toFixed(2)}</strong></td>
                                <td><span class="badge-tag ${r.estado === 'PAGADO' ? 'badge-green' : 'badge-amber'}">${r.estado}</span></td>
                                <td><button type="button" class="btn btn-xs btn-outline-primary" onclick="abrirModalRecibo('${r.id}')">Ver</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    const labList = document.getElementById('f360LabList');
    const labCount = document.getElementById('f360CountLab');
    if (labCount) labCount.innerText = expediente.laboratorio.length;
    if (labList) {
        if (expediente.laboratorio.length === 0) {
            labList.innerHTML = '<p class="text-muted" style="padding: 1rem 0;">No posee órdenes de taller o laboratorio registradas.</p>';
        } else {
            labList.innerHTML = `
                <table class="data-table" style="font-size: 0.85rem;">
                    <thead>
                        <tr>
                            <th>Orden</th>
                            <th>Fecha</th>
                            <th>Trabajo</th>
                            <th>Fase Actual</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expediente.laboratorio.map(o => `
                            <tr>
                                <td><strong>${o.id}</strong></td>
                                <td>${o.fecha_ingreso}</td>
                                <td>${o.montura} &bull; ${o.cristales}</td>
                                <td><span class="badge-tag badge-blue">${o.fase.replace('_', ' ')}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    const rcpList = document.getElementById('f360RecipesList');
    const rcpCount = document.getElementById('f360CountRecipes');
    if (rcpCount) rcpCount.innerText = expediente.recipes.length;
    if (rcpList) {
        if (expediente.recipes.length === 0) {
            rcpList.innerHTML = '<p class="text-muted" style="padding: 1rem 0;">No se le han emitido récipes oftalmológicos aún.</p>';
        } else {
            rcpList.innerHTML = `
                <table class="data-table" style="font-size: 0.85rem;">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Fecha</th>
                            <th>Médico</th>
                            <th>Tratamientos</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expediente.recipes.map(rc => `
                            <tr>
                                <td><strong>${rc.id}</strong></td>
                                <td>${rc.fecha}</td>
                                <td>${rc.medico_nombre}</td>
                                <td>${(rc.medicamentos || []).length} medicamento(s)</td>
                                <td><button type="button" class="btn btn-xs btn-outline-primary" onclick="abrirModalRecipe('${rc.id}')">Ver Hoja Dual</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    const btnVenta = document.getElementById('btnF360NuevaVenta');
    if (btnVenta) {
        btnVenta.onclick = () => {
            window.cerrarModalFicha360();
            window.iniciarVentaConPaciente(p.id);
        };
    }

    const btnWa = document.getElementById('btnF360WhatsApp');
    if (btnWa) {
        btnWa.onclick = () => {
            window.cerrarModalFicha360();
            window.abrirWhatsAppPacienteDirecto(p.id);
        };
    }

    window.cambiarSubtab360('optica');
    openModal('modalFicha360');
};

window.cerrarModalFicha360 = function() {
    closeModal('modalFicha360');
};

window.editarPacienteDesde360 = function() {
    if (AppState.pacienteFichaActual) {
        const id = AppState.pacienteFichaActual.id;
        window.cerrarModalFicha360();
        window.editarPaciente(id);
    }
};

window.cambiarSubtab360 = function(subtabId) {
    // Normalize ID - handle both 'optica' and 'f360-optica' formats
    const normalized = subtabId.startsWith('f360-') ? subtabId : `f360-${subtabId}`;

    document.querySelectorAll('.subtab-btn').forEach(btn => btn.classList.remove('active'));
    // Handle both .subtab-pane and .subtab-content selectors
    document.querySelectorAll('.subtab-pane, .subtab-content').forEach(p => {
        p.classList.remove('active');
        if (p.style) p.style.display = 'none';
    });

    const btn = document.querySelector(`.subtab-btn[onclick*="${normalized}"], .subtab-btn[onclick*="${subtabId}"]`);
    const pane = document.getElementById(`subtab-${normalized}`) || document.getElementById(`subtab-${subtabId}`);

    if (btn) btn.classList.add('active');
    if (pane) {
        pane.classList.add('active');
        pane.style.display = '';
    }
};

window.abrirModalNuevoPaciente = function(fromWizard = false) {
    AppState.pacienteEditingId = null;
    AppState.fromWizardNewPatient = fromWizard;

    const form = document.getElementById('formRegistroPaciente');
    if (form) form.reset();

    const title = document.getElementById('modalPacienteTitle');
    if (title) title.innerHTML = '<i class="fa-solid fa-user-plus"></i> Nuevo Registro de Paciente';

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    setVal('pacienteCedulaPrefix', 'V-');
    setVal('pacienteCedulaNum', '');
    setVal('pacienteNombreInput', '');
    setVal('pacienteTelefonoInput', '');
    setVal('pacienteWhatsappInput', '');
    setVal('pacienteEmailInput', '');
    setVal('pacienteNacimientoInput', '');
    setVal('pacienteEdadInput', '');
    setVal('pacienteSexoSelect', 'M');
    setVal('pacienteOcupacionInput', '');
    setVal('pacienteDireccionInput', '');

    openModal('modalFormPaciente');
};

window.cerrarModalFormPaciente = function() {
    closeModal('modalFormPaciente');
    AppState.pacienteEditingId = null;
    AppState.fromWizardNewPatient = false;
};

window.calcularEdadDesdeNacimiento = function() {
    const fechaInput = document.getElementById('pacienteNacimientoInput');
    const edadInput = document.getElementById('pacienteEdadInput');
    if (!fechaInput || !edadInput) return;

    const val = (fechaInput.value || '').trim();
    if (!val) return;

    let year = null, month = null, day = null;

    if (val.includes('-')) {
        const parts = val.split('-');
        if (parts.length === 3) {
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
            day = parseInt(parts[2], 10);
        }
    } else if (val.includes('/')) {
        const parts = val.split('/');
        if (parts.length === 3) {
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
            year = parseInt(parts[2], 10);
        }
    }

    if (isNaN(year) || isNaN(month) || isNaN(day)) return;
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) return;
    if (month < 1 || month > 12 || day < 1 || day > 31) return;

    const dob = new Date(year, month - 1, day);
    if (isNaN(dob.getTime())) return;

    const hoy = new Date();
    let edad = hoy.getFullYear() - dob.getFullYear();
    const mesDiff = hoy.getMonth() - dob.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < dob.getDate())) {
        edad--;
    }

    if (edad >= 0 && edad <= 125) {
        edadInput.value = edad;
        edadInput.style.transition = 'background-color 0.25s ease';
        edadInput.style.backgroundColor = '#EFF6FF';
        setTimeout(() => {
            if (edadInput) edadInput.style.backgroundColor = '';
        }, 300);
    }
};

window.autoCopiarTelefonoAWhatsapp = function() {
    const telInput = document.getElementById('pacienteTelefonoInput');
    const waInput = document.getElementById('pacienteWhatsappInput');
    if (!telInput || !waInput) return;
    if (!waInput.value.trim() && telInput.value.trim()) {
        waInput.value = telInput.value.trim();
    }
};

window.editarPaciente = function(pacienteId) {
    const p = window.OpticaStorage.getPacienteById(pacienteId);
    if (!p) return;

    AppState.pacienteEditingId = pacienteId;
    AppState.fromWizardNewPatient = false;

    const title = document.getElementById('modalPacienteTitle');
    if (title) title.innerHTML = '<i class="fa-solid fa-user-pen"></i> Actualizar Ficha de Paciente';

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    let prefix = 'V-';
    let num = p.cedula || '';
    if (num.includes('-')) {
        const parts = num.split('-');
        prefix = parts[0] + '-';
        num = parts.slice(1).join('-');
    }

    const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.trim();

    setVal('pacienteCedulaPrefix', prefix);
    setVal('pacienteCedulaNum', num);
    setVal('pacienteNombreInput', nombreCompleto);
    setVal('pacienteTelefonoInput', p.telefono || '');
    setVal('pacienteWhatsappInput', p.whatsapp || p.telefono_wa || p.telefono || '');
    setVal('pacienteEmailInput', p.email || '');
    setVal('pacienteNacimientoInput', p.fecha_nacimiento || '');
    setVal('pacienteEdadInput', p.edad !== undefined && p.edad !== null ? p.edad : '');
    setVal('pacienteSexoSelect', p.sexo || 'M');
    setVal('pacienteOcupacionInput', p.ocupacion || '');
    setVal('pacienteDireccionInput', p.direccion || '');

    openModal('modalFormPaciente');
};

window.guardarFormPaciente = function(e) {
    if (e) e.preventDefault();

    // Bloqueo estricto contra doble envío simultáneo
    if (window.guardarFormPaciente._isSaving) {
        return;
    }
    window.guardarFormPaciente._isSaving = true;
    setTimeout(() => { window.guardarFormPaciente._isSaving = false; }, 800);

    const prefix = document.getElementById('pacienteCedulaPrefix')?.value || 'V-';
    const num = (document.getElementById('pacienteCedulaNum')?.value || '').trim();
    const nombreCompleto = (document.getElementById('pacienteNombreInput')?.value || '').trim();
    const telefono = (document.getElementById('pacienteTelefonoInput')?.value || '').trim();
    const whatsapp = (document.getElementById('pacienteWhatsappInput')?.value || '').trim() || telefono;
    const email = (document.getElementById('pacienteEmailInput')?.value || '').trim();
    const nacimiento = (document.getElementById('pacienteNacimientoInput')?.value || '').trim();
    const edad = parseInt(document.getElementById('pacienteEdadInput')?.value) || '';
    const sexo = document.getElementById('pacienteSexoSelect')?.value || 'M';
    const ocupacion = (document.getElementById('pacienteOcupacionInput')?.value || '').trim();
    const direccion = (document.getElementById('pacienteDireccionInput')?.value || '').trim();

    if (!num) {
        showAdminToast('Por favor ingrese el número de cédula.', 'warning');
        return;
    }
    if (!nombreCompleto) {
        showAdminToast('Por favor ingrese el nombre del paciente.', 'warning');
        return;
    }
    if (!telefono) {
        showAdminToast('Por favor ingrese el número de teléfono.', 'warning');
        return;
    }

    // Split nombreCompleto into nombre and apellido
    let nombre = nombreCompleto;
    let apellido = '';
    const nameParts = nombreCompleto.split(/\s+/);
    if (nameParts.length === 2) {
        nombre = nameParts[0];
        apellido = nameParts[1];
    } else if (nameParts.length >= 3) {
        nombre = nameParts.slice(0, 2).join(' ');
        apellido = nameParts.slice(2).join(' ');
    }

    const cedula = `${prefix}${num}`;
    const cleanWa = whatsapp.replace(/\D/g, '');
    const telefono_wa = cleanWa || telefono.replace(/\D/g, '');

    let existingPatient = null;
    if (AppState.pacienteEditingId) {
        existingPatient = window.OpticaStorage.getPacienteById(AppState.pacienteEditingId);
    }

    const pacienteData = {
        ...(existingPatient || {}),
        cedula,
        nombre,
        apellido,
        telefono,
        whatsapp,
        telefono_wa,
        email,
        fecha_nacimiento: nacimiento,
        edad,
        sexo,
        ocupacion,
        direccion,
        sede: existingPatient?.sede || (AppState.sedeFiltro !== 'todas' ? AppState.sedeFiltro : 'Maracay')
    };

    if (AppState.pacienteEditingId) {
        pacienteData.id = AppState.pacienteEditingId;
    }

    let pacienteGuardado = null;

    if (AppState.pacienteEditingId) {
        if (window.OpticaStorage.actualizarPaciente) {
            pacienteGuardado = window.OpticaStorage.actualizarPaciente(AppState.pacienteEditingId, pacienteData);
        } else {
            pacienteGuardado = window.OpticaStorage.crearOActualizarPaciente(pacienteData);
        }
        showAdminToast(`Datos de ${nombre} actualizados con éxito.`);
    } else {
        if (window.OpticaStorage.crearOActualizarPaciente) {
            pacienteGuardado = window.OpticaStorage.crearOActualizarPaciente(pacienteData);
        } else if (window.OpticaStorage.registrarPaciente) {
            pacienteGuardado = window.OpticaStorage.registrarPaciente(pacienteData);
        }
        showAdminToast(`Paciente ${nombre} registrado con éxito.`);
    }

    window.cerrarModalFormPaciente();
    renderPacientesTable();
    actualizarBadgesContadores();

    if (AppState.fromWizardNewPatient && pacienteGuardado) {
        window.switchAdminTab('venta-wizard');
        window.seleccionarPacienteEnWizard(pacienteGuardado);
        window.avanzarWizardPaso2();
    }
};

function initEventForms() {
    const fPac = document.getElementById('formRegistroPaciente');
    if (fPac) {
        fPac.onsubmit = window.guardarFormPaciente;
    }

    const fRec = document.getElementById('formEmisionRecipe');
    if (fRec) fRec.onsubmit = window.guardarFormRecipe;

    const fInf = document.getElementById('formRedactarInforme');
    if (fInf) fInf.onsubmit = window.guardarFormInforme;

    const fAbo = document.getElementById('formRegistrarAbono');
    if (fAbo) fAbo.onsubmit = window.procesarAbonoRecibo;

    // Vinculación reactiva para cálculo instantáneo de edad al ingresar fecha de nacimiento
    const inpNac = document.getElementById('pacienteNacimientoInput');
    if (inpNac) {
        ['input', 'change', 'blur', 'keyup'].forEach(evt => {
            inpNac.addEventListener(evt, window.calcularEdadDesdeNacimiento);
        });
    }
}

// =============================================================================
// MÓDULO 3: VENTA & RECIBO WIZARD EN 3 PASOS
// =============================================================================
function initWizardCatalog() {
    const catalogo = [
        { nombre: "Montura Acetato Premium Classic", precio: 45 },
        { nombre: "Montura Titanio Flexible Pro", precio: 65 },
        { nombre: "Montura Metálica Semi al Aire", precio: 40 },
        { nombre: "Montura Deportiva TR-90 Ultra", precio: 50 },
        { nombre: "Montura Kids Antigolpes Flex", precio: 35 },
        { nombre: "Montura Carey Redonda Vintage", precio: 45 }
    ];

    const tagsRow = document.getElementById('catalogTagsRow');
    if (tagsRow) {
        tagsRow.innerHTML = catalogo.map(m => `
            <button type="button" class="catalog-tag" onclick="seleccionarMonturaCatalogo('${m.nombre}', ${m.precio})">
                <i class="fa-solid fa-glasses"></i> ${m.nombre} ($${m.precio})
            </button>
        `).join('');
    }
}

window.seleccionarMonturaCatalogo = function(nombre, precio) {
    const inpD = document.getElementById('wizMonturaDesc');
    const inpP = document.getElementById('wizMonturaPrecio');
    if (inpD) inpD.value = nombre;
    if (inpP) inpP.value = precio;
    window.recalcularTotalesWizard();
};

window.iniciarVentaConPaciente = function(pacienteId) {
    const p = window.OpticaStorage.getPacienteById(pacienteId);
    if (!p) return;

    window.switchAdminTab('venta-wizard');
    window.seleccionarPacienteEnWizard(p);
    window.avanzarWizardPaso2();
};

function buscarPacientesEnWizard(q) {
    const container = document.getElementById('wizardResultadosBusquedaPacientes');
    if (!container) return;

    if (!q || q.length < 2) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    const pacientes = window.OpticaStorage.getPacientes();
    const matches = pacientes.filter(p => 
        (p.nombre || '').toLowerCase().includes(q.toLowerCase()) ||
        (p.apellido || '').toLowerCase().includes(q.toLowerCase()) ||
        (p.cedula || '').toLowerCase().includes(q.toLowerCase())
    );

    if (matches.length === 0) {
        container.innerHTML = `
            <div style="padding: 1rem; color: #64748B; font-size: 0.85rem;">
                No se encontraron pacientes con ese criterio.
                <button type="button" class="btn btn-xs btn-outline-primary" style="margin-top: 0.5rem; display: block;" onclick="abrirModalNuevoPaciente(true)">
                    <i class="fa-solid fa-user-plus"></i> Registrar como Nuevo Paciente
                </button>
            </div>
        `;
        container.style.display = 'block';
        return;
    }

    container.innerHTML = matches.map(p => `
        <div class="wizard-patient-item" onclick="seleccionarPacienteEnWizardById('${p.id}')">
            <strong>${p.nombre} ${p.apellido || ''}</strong>
            <span style="color: #64748B; font-size: 0.8rem;"> &bull; ${p.cedula} &bull; Sede: ${p.sede}</span>
        </div>
    `).join('');
    container.style.display = 'block';
}

window.seleccionarPacienteEnWizardById = function(pacienteId) {
    const p = window.OpticaStorage.getPacienteById(pacienteId);
    if (p) window.seleccionarPacienteEnWizard(p);
};

window.seleccionarPacienteEnWizard = function(paciente) {
    if (!paciente) return;
    AppState.wizard.paciente = paciente;

    const card = document.getElementById('wizardPacienteSeleccionadoCard');
    const nom = document.getElementById('wizardNombrePaciente');
    const ced = document.getElementById('wizardCedulaPaciente');
    const tel = document.getElementById('wizardTelefonoPaciente');
    const sede = document.getElementById('wizardSedePaciente');
    const searchRes = document.getElementById('wizardResultadosBusquedaPacientes');
    const btnAvanzar = document.getElementById('btnAvanzarPaso2');

    if (nom) nom.innerText = `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim() || 'Paciente Seleccionado';
    if (ced) ced.innerText = paciente.cedula || '';
    if (tel) tel.innerText = paciente.telefono || '';
    if (sede) sede.innerText = paciente.sede || 'Maracay';

    if (card) card.style.display = 'block';
    if (searchRes) searchRes.style.display = 'none';
    if (btnAvanzar) {
        btnAvanzar.disabled = false;
        btnAvanzar.removeAttribute('disabled');
    }

    window.copiarFormulaPacienteAWizard();
};

window.deseleccionarPacienteWizard = function() {
    AppState.wizard.paciente = null;
    const card = document.getElementById('wizardPacienteSeleccionadoCard');
    const btnAvanzar = document.getElementById('btnAvanzarPaso2');
    const searchInp = document.getElementById('wizardBuscarPacienteInput');

    if (card) card.style.display = 'none';
    if (btnAvanzar) btnAvanzar.disabled = true;
    if (searchInp) {
        searchInp.value = '';
        searchInp.focus();
    }
};

window.copiarFormulaPacienteAWizard = function() {
    try {
        const p = AppState.wizard.paciente;
        if (!p) return;

        const f = p.ultima_formula || p.formula;
        if (!f) return;

        const od = f.od || {};
        const os = f.os || {};

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== undefined && val !== null && val !== '') el.value = val;
        };

        setVal('wizRxOdSph', od.sph || f.od_esfera);
        setVal('wizRxOdCyl', od.cyl || f.od_cilindro);
        setVal('wizRxOdAxis', od.axis || f.od_eje);
        setVal('wizRxOdAdd', od.add || f.od_adicion);
        setVal('wizRxOdAv', od.av || f.od_av);

        setVal('wizRxOsSph', os.sph || f.os_esfera);
        setVal('wizRxOsCyl', os.cyl || f.os_cilindro);
        setVal('wizRxOsAxis', os.axis || f.os_eje);
        setVal('wizRxOsAdd', os.add || f.os_adicion);
        setVal('wizRxOsAv', os.av || f.os_av);

        setVal('wizRxDp', f.dp);
        setVal('wizRxAlt', f.alt);
        setVal('wizTipoLente', f.tipo_lente);
    } catch (e) {
        console.warn('copiarFormulaPacienteAWizard error:', e);
    }
};

window.avanzarWizardPaso2 = function() {
    if (!AppState.wizard.paciente) {
        showAdminToast('Por favor seleccione un paciente para continuar.', 'warning');
        return;
    }

    const s1 = document.getElementById('wizardStep1');
    const s2 = document.getElementById('wizardStep2');
    const s3 = document.getElementById('wizardStep3');

    if (s1) { s1.style.display = 'none'; s1.classList.remove('active'); }
    if (s2) { s2.style.display = 'block'; s2.classList.add('active'); }
    if (s3) { s3.style.display = 'none'; s3.classList.remove('active'); }

    const ind1 = document.getElementById('stepIndicator1');
    const ind2 = document.getElementById('stepIndicator2');
    const ind3 = document.getElementById('stepIndicator3');
    const line1 = document.getElementById('stepLine1');
    const line2 = document.getElementById('stepLine2');

    if (ind1) { ind1.classList.remove('active'); ind1.classList.add('completed'); }
    if (line1) { line1.classList.add('active'); }
    if (ind2) { ind2.classList.add('active'); ind2.classList.remove('completed'); }
    if (line2) { line2.classList.remove('active'); }
    if (ind3) { ind3.classList.remove('active', 'completed'); }

    window.recalcularTotalesWizard();
};

window.volverWizardPaso1 = function() {
    const s1 = document.getElementById('wizardStep1');
    const s2 = document.getElementById('wizardStep2');
    const s3 = document.getElementById('wizardStep3');

    if (s1) { s1.style.display = 'block'; s1.classList.add('active'); }
    if (s2) { s2.style.display = 'none'; s2.classList.remove('active'); }
    if (s3) { s3.style.display = 'none'; s3.classList.remove('active'); }

    const ind1 = document.getElementById('stepIndicator1');
    const ind2 = document.getElementById('stepIndicator2');
    const ind3 = document.getElementById('stepIndicator3');
    const line1 = document.getElementById('stepLine1');
    const line2 = document.getElementById('stepLine2');

    if (ind1) { ind1.classList.add('active'); ind1.classList.remove('completed'); }
    if (line1) { line1.classList.remove('active'); }
    if (ind2) { ind2.classList.remove('active', 'completed'); }
    if (line2) { line2.classList.remove('active'); }
    if (ind3) { ind3.classList.remove('active', 'completed'); }
};

window.avanzarWizardPaso3 = function() {
    window.recalcularTotalesWizard();

    const s1 = document.getElementById('wizardStep1');
    const s2 = document.getElementById('wizardStep2');
    const s3 = document.getElementById('wizardStep3');

    if (s1) { s1.style.display = 'none'; s1.classList.remove('active'); }
    if (s2) { s2.style.display = 'none'; s2.classList.remove('active'); }
    if (s3) { s3.style.display = 'block'; s3.classList.add('active'); }

    const ind1 = document.getElementById('stepIndicator1');
    const ind2 = document.getElementById('stepIndicator2');
    const ind3 = document.getElementById('stepIndicator3');
    const line1 = document.getElementById('stepLine1');
    const line2 = document.getElementById('stepLine2');

    if (ind1) { ind1.classList.remove('active'); ind1.classList.add('completed'); }
    if (line1) { line1.classList.add('active'); }
    if (ind2) { ind2.classList.remove('active'); ind2.classList.add('completed'); }
    if (line2) { line2.classList.add('active'); }
    if (ind3) { ind3.classList.add('active'); ind3.classList.remove('completed'); }

    recalcularPagosPaso3();
};

window.volverWizardPaso2 = function() {
    const s1 = document.getElementById('wizardStep1');
    const s2 = document.getElementById('wizardStep2');
    const s3 = document.getElementById('wizardStep3');

    if (s1) { s1.style.display = 'none'; s1.classList.remove('active'); }
    if (s2) { s2.style.display = 'block'; s2.classList.add('active'); }
    if (s3) { s3.style.display = 'none'; s3.classList.remove('active'); }

    const ind1 = document.getElementById('stepIndicator1');
    const ind2 = document.getElementById('stepIndicator2');
    const ind3 = document.getElementById('stepIndicator3');
    const line1 = document.getElementById('stepLine1');
    const line2 = document.getElementById('stepLine2');

    if (ind1) { ind1.classList.remove('active'); ind1.classList.add('completed'); }
    if (line1) { line1.classList.add('active'); }
    if (ind2) { ind2.classList.add('active'); ind2.classList.remove('completed'); }
    if (line2) { line2.classList.remove('active'); }
    if (ind3) { ind3.classList.remove('active', 'completed'); }
};

window.actualizarPrecioConsultaWizard = function() {
    const sel = document.getElementById('wizConsultaTipo');
    const inp = document.getElementById('wizConsultaPrecio');
    if (!sel || !inp) return;

    if (sel.value === 'Sin Consulta (Solo Montura / Cristales)') {
        inp.value = 0;
    } else if (sel.value === 'Control y Fondo de Ojo de Cortesía') {
        inp.value = 0;
    } else if (inp.value == 0) {
        inp.value = 15;
    }

    window.recalcularTotalesWizard();
};

window.recalcularTotalesWizard = function() {
    const pMontura = parseFloat(document.getElementById('wizMonturaPrecio')?.value) || 0;
    const pCristales = parseFloat(document.getElementById('wizCristalesPrecio')?.value) || 0;
    const pConsulta = parseFloat(document.getElementById('wizConsultaPrecio')?.value) || 0;
    const pDesc = parseFloat(document.getElementById('wizDescuentoUsd')?.value) || 0;

    const subtotalUsd = pMontura + pCristales + pConsulta;
    const totalUsd = Math.max(0, subtotalUsd - pDesc);

    const config = window.OpticaStorage.getConfig();
    const tasa = config.tasa_usd_ves || 842.21;
    const totalVes = totalUsd * tasa;

    const elMontura = document.getElementById('sumMonturaVal');
    const elCristales = document.getElementById('sumCristalesVal');
    const elConsulta = document.getElementById('sumConsultaVal');
    const elTotalUsd = document.getElementById('sumTotalUsd');
    const elTotalVes = document.getElementById('sumTotalVes');

    if (elMontura) elMontura.innerText = `$${pMontura.toFixed(2)}`;
    if (elCristales) elCristales.innerText = `$${pCristales.toFixed(2)}`;
    if (elConsulta) elConsulta.innerText = `$${pConsulta.toFixed(2)}`;
    if (elTotalUsd) elTotalUsd.innerText = `$${totalUsd.toFixed(2)}`;
    if (elTotalVes) elTotalVes.innerText = `${totalVes.toLocaleString('es-VE', { maximumFractionDigits: 2 })} Bs`;

    AppState.wizard.montura = {
        desc: document.getElementById('wizMonturaDesc')?.value || 'Montura Estándar',
        precio: pMontura
    };

    AppState.wizard.cristales = {
        tipo: document.getElementById('wizTipoLente')?.value || 'Monofocal',
        material: document.getElementById('wizMaterialCristal')?.value || 'CR-39 Orgánico',
        tratamientos: obtenerTratamientosSeleccionados(),
        notas: document.getElementById('wizCristalesNotas')?.value || '',
        precio: pCristales,
        rx: {
            od: {
                sph: document.getElementById('wizRxOdSph')?.value || '0.00',
                cyl: document.getElementById('wizRxOdCyl')?.value || '',
                axis: document.getElementById('wizRxOdAxis')?.value || '',
                add: document.getElementById('wizRxOdAdd')?.value || '',
                av: document.getElementById('wizRxOdAv')?.value || '20/20'
            },
            os: {
                sph: document.getElementById('wizRxOsSph')?.value || '0.00',
                cyl: document.getElementById('wizRxOsCyl')?.value || '',
                axis: document.getElementById('wizRxOsAxis')?.value || '',
                add: document.getElementById('wizRxOsAdd')?.value || '',
                av: document.getElementById('wizRxOsAv')?.value || '20/20'
            },
            dp: document.getElementById('wizRxDp')?.value || '62',
            alt: document.getElementById('wizRxAlt')?.value || ''
        }
    };

    AppState.wizard.consulta = {
        tipo: document.getElementById('wizConsultaTipo')?.value || 'Consulta General',
        precio: pConsulta
    };

    AppState.wizard.descuento = pDesc;
    recalcularPagosPaso3();
};

function obtenerTratamientosSeleccionados() {
    const list = [];
    if (document.getElementById('wizTratAntirreflejo')?.checked) list.push('Antirreflejo (AR)');
    if (document.getElementById('wizTratFiltroAzul')?.checked) list.push('Filtro Azul (Blue Block)');
    if (document.getElementById('wizTratFotocromatico')?.checked) list.push('Fotocromático Transitions');
    if (document.getElementById('wizTratAntirayas')?.checked) list.push('Tratamiento Antirayas');
    return list;
}

window.cambiarMetodoPagoWizard = function() {
    const metodo = document.getElementById('pagoMetodoSelect')?.value || 'efectivo_usd';
    const label = document.getElementById('pagoMontoLabel');
    const config = window.OpticaStorage.getConfig();
    const tasa = config.tasa_usd_ves || 842.21;

    if (label) {
        if (metodo.includes('ves') || metodo.includes('pago_movil') || metodo.includes('punto')) {
            label.innerHTML = `Monto en Bolívares (Tasa: ${tasa.toFixed(2)} Bs/$):`;
        } else {
            label.innerHTML = `Monto en Dólares ($ USD):`;
        }
    }
};

window.agregarPagoWizard = function() {
    const metodo = document.getElementById('pagoMetodoSelect')?.value || 'efectivo_usd';
    const montoRaw = parseFloat(document.getElementById('pagoMontoInput')?.value);
    const ref = (document.getElementById('pagoRefInput')?.value || '').trim();
    const config = window.OpticaStorage.getConfig();
    const tasa = config.tasa_usd_ves || 842.21;

    if (!montoRaw || montoRaw <= 0) {
        showAdminToast('Por favor ingrese un monto válido.', 'warning');
        return;
    }

    let montoUsd = 0;
    let montoVes = 0;

    if (metodo.includes('ves') || metodo.includes('pago_movil') || metodo.includes('punto')) {
        montoVes = montoRaw;
        montoUsd = montoRaw / tasa;
    } else {
        montoUsd = montoRaw;
        montoVes = montoRaw * tasa;
    }

    AppState.wizard.pagos.push({
        metodo,
        monto_usd: Math.round(montoUsd * 100) / 100,
        monto_ves: Math.round(montoVes * 100) / 100,
        referencia: ref || 'Taquilla',
        fecha: new Date().toLocaleDateString('es-VE')
    });

    const inpM = document.getElementById('pagoMontoInput');
    const inpR = document.getElementById('pagoRefInput');
    if (inpM) inpM.value = '';
    if (inpR) inpR.value = '';

    recalcularPagosPaso3();
};

window.quitarPagoWizard = function(idx) {
    AppState.wizard.pagos.splice(idx, 1);
    recalcularPagosPaso3();
};

function recalcularPagosPaso3() {
    const pMontura = AppState.wizard.montura.precio;
    const pCristales = AppState.wizard.cristales.precio;
    const pConsulta = AppState.wizard.consulta.precio;
    const desc = AppState.wizard.descuento;

    const totalUsd = Math.max(0, pMontura + pCristales + pConsulta - desc);
    const config = window.OpticaStorage.getConfig();
    const tasa = config.tasa_usd_ves || 842.21;
    const totalVes = totalUsd * tasa;

    const totalPagadoUsd = AppState.wizard.pagos.reduce((acc, p) => acc + p.monto_usd, 0);
    const saldoPendienteUsd = Math.max(0, totalUsd - totalPagadoUsd);

    const elTotUsd = document.getElementById('payOverviewTotalUsd');
    const elTotVes = document.getElementById('payOverviewTotalVes');
    const elPagUsd = document.getElementById('payOverviewPagadoUsd');
    const elSalUsd = document.getElementById('payOverviewSaldoUsd');

    if (elTotUsd) elTotUsd.innerText = `$${totalUsd.toFixed(2)}`;
    if (elTotVes) elTotVes.innerText = `${totalVes.toLocaleString('es-VE', { maximumFractionDigits: 2 })} Bs`;
    if (elPagUsd) elPagUsd.innerText = `$${totalPagadoUsd.toFixed(2)}`;
    if (elSalUsd) {
        elSalUsd.innerText = `$${saldoPendienteUsd.toFixed(2)}`;
        elSalUsd.style.color = saldoPendienteUsd > 0 ? '#EF4444' : '#10B981';
    }

    const tbody = document.getElementById('wizardPagosTableBody');
    if (tbody) {
        if (AppState.wizard.pagos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94A3B8; padding: 1.25rem;">No se han agregado pagos aún.</td></tr>`;
        } else {
            tbody.innerHTML = AppState.wizard.pagos.map((p, idx) => `
                <tr>
                    <td><strong>${p.metodo.replace(/_/g, ' ').toUpperCase()}</strong></td>
                    <td class="text-emerald"><strong>$${p.monto_usd.toFixed(2)}</strong></td>
                    <td>${p.monto_ves.toLocaleString('es-VE')} Bs</td>
                    <td><span class="cell-sub">${p.referencia}</span></td>
                    <td style="text-align: right;">
                        <button type="button" class="btn btn-xs btn-outline-danger" onclick="quitarPagoWizard(${idx})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

window.completarVentaYGenerarRecibo = function() {
    if (!AppState.wizard.paciente) {
        showAdminToast('No hay un paciente seleccionado.', 'error');
        return;
    }

    const pMontura = AppState.wizard.montura.precio;
    const pCristales = AppState.wizard.cristales.precio;
    const pConsulta = AppState.wizard.consulta.precio;
    const desc = AppState.wizard.descuento;

    const subtotalUsd = pMontura + pCristales + pConsulta;
    const totalUsd = Math.max(0, subtotalUsd - desc);

    if (totalUsd <= 0 && AppState.wizard.pagos.length === 0) {
        showAdminToast('El monto de la venta debe ser mayor a 0.', 'warning');
        return;
    }

    const config = window.OpticaStorage.getConfig();
    const tasa = config.tasa_usd_ves || 842.21;
    const totalVes = totalUsd * tasa;

    const pagadoUsd = AppState.wizard.pagos.reduce((acc, p) => acc + p.monto_usd, 0);
    const saldoPendienteUsd = Math.max(0, totalUsd - pagadoUsd);

    let estado = 'PAGADO';
    if (saldoPendienteUsd > 0.05) {
        estado = pagadoUsd > 0 ? 'ABONADO' : 'PENDIENTE';
    }

    const items = [];
    if (pMontura > 0) {
        items.push({
            tipo: 'MONTURA',
            descripcion: AppState.wizard.montura.desc,
            cantidad: 1,
            precio_unitario_usd: pMontura,
            total_usd: pMontura
        });
    }

    if (pCristales > 0) {
        items.push({
            tipo: 'CRISTALES',
            descripcion: `Cristales ${AppState.wizard.cristales.tipo} (${AppState.wizard.cristales.material})`,
            tratamientos: AppState.wizard.cristales.tratamientos,
            cantidad: 1,
            precio_unitario_usd: pCristales,
            total_usd: pCristales,
            rx: AppState.wizard.cristales.rx
        });
    }

    if (pConsulta > 0) {
        items.push({
            tipo: 'CONSULTA',
            descripcion: AppState.wizard.consulta.tipo,
            cantidad: 1,
            precio_unitario_usd: pConsulta,
            total_usd: pConsulta
        });
    }

    const ventaData = {
        paciente_id: AppState.wizard.paciente.id,
        paciente_nombre: `${AppState.wizard.paciente.nombre} ${AppState.wizard.paciente.apellido || ''}`,
        paciente_cedula: AppState.wizard.paciente.cedula,
        sede: AppState.wizard.paciente.sede || 'Maracay',
        subtotal_usd: subtotalUsd,
        descuento_usd: desc,
        total_usd: totalUsd,
        total_ves: totalVes,
        tasa_aplicada: tasa,
        pagado_usd: pagadoUsd,
        saldo_pendiente_usd: saldoPendienteUsd,
        estado: estado,
        items: items,
        pagos: AppState.wizard.pagos
    };

    // Call the correct storage method (crearVentaYRecibo), with fallback alias registrarVenta
    const storageFn = window.OpticaStorage.crearVentaYRecibo
        ? window.OpticaStorage.crearVentaYRecibo.bind(window.OpticaStorage)
        : window.OpticaStorage.registrarVenta.bind(window.OpticaStorage);

    const ventaPayload = {
        paciente_id: AppState.wizard.paciente.id,
        paciente_nombre: `${AppState.wizard.paciente.nombre} ${AppState.wizard.paciente.apellido || ''}`.trim(),
        paciente_cedula: AppState.wizard.paciente.cedula,
        paciente_telefono: AppState.wizard.paciente.telefono || '--',
        sede: AppState.wizard.paciente.sede || 'Maracay',
        subtotal_usd: subtotalUsd,
        descuento_usd: desc,
        tasa_cambio: tasa,
        items: items,
        pagos: AppState.wizard.pagos.map(p => ({
            metodo: p.metodo,
            monto: p.monto_usd,
            moneda: 'USD',
            monto_usd: p.monto_usd,
            monto_ves: p.monto_ves,
            referencia: p.referencia || 'Taquilla'
        })),
        formula_prescripcion: AppState.wizard.cristales.rx,
        notas: AppState.wizard.cristales.notas || ''
    };

    const reciboCreado = storageFn(ventaPayload);

    if (!reciboCreado) {
        showAdminToast('Error al generar el recibo. Verifique los datos.', 'error');
        return;
    }

    // Update patient formula if lenses were purchased
    if (pCristales > 0 && AppState.wizard.cristales.rx) {
        const updateFn = window.OpticaStorage.actualizarPaciente
            ? window.OpticaStorage.actualizarPaciente.bind(window.OpticaStorage)
            : null;
        if (updateFn) {
            updateFn(AppState.wizard.paciente.id, { ultima_formula: AppState.wizard.cristales.rx });
        } else {
            // Fallback: use crearOActualizarPaciente
            window.OpticaStorage.crearOActualizarPaciente({
                ...AppState.wizard.paciente,
                ultima_formula: AppState.wizard.cristales.rx
            });
        }
    }

    resetWizardState();
    actualizarBadgesContadores();

    window.abrirModalRecibo(reciboCreado.id);
    showAdminToast(`Venta procesada y Recibo Oficial ${reciboCreado.correlativo} generado.`);
};

function resetWizardState() {
    AppState.wizard = {
        paciente: null,
        montura: { desc: '', precio: 0 },
        cristales: {
            tipo: 'Monofocal',
            material: 'CR-39 Orgánico',
            tratamientos: [],
            notas: '',
            precio: 0,
            rx: {
                od: { sph: '', cyl: '', axis: '', add: '', av: '' },
                os: { sph: '', cyl: '', axis: '', add: '', av: '' },
                dp: '',
                alt: ''
            }
        },
        consulta: { tipo: 'Refracción Integral y Fondo de Ojo', precio: 0 },
        descuento: 0,
        pagos: [],
        reciboGeneradoId: null
    };

    window.deseleccionarPacienteWizard();
    window.volverWizardPaso1();

    const inpMDesc = document.getElementById('wizMonturaDesc');
    const inpMPrec = document.getElementById('wizMonturaPrecio');
    const inpCPrec = document.getElementById('wizCristalesPrecio');
    const inpDesc = document.getElementById('wizDescuentoUsd');

    if (inpMDesc) inpMDesc.value = '';
    if (inpMPrec) inpMPrec.value = 0;
    if (inpCPrec) inpCPrec.value = 0;
    if (inpDesc) inpDesc.value = 0;
}

// =============================================================================
// MÓDULO 4: RECIBOS OFICIALES & CONTROL DE PAGOS
// =============================================================================
function renderRecibosTable() {
    const q = (document.getElementById('inputBuscarRecibo')?.value || '').toLowerCase().trim();
    const filtroEst = document.getElementById('filtroEstadoRecibo')?.value || 'TODOS';

    let recibos = window.OpticaStorage.getRecibos(AppState.sedeFiltro);

    if (filtroEst !== 'TODOS') {
        recibos = recibos.filter(r => r.estado === filtroEst);
    }

    if (q) {
        recibos = recibos.filter(r => 
            (r.correlativo || r.id).toLowerCase().includes(q) ||
            (r.paciente_nombre || '').toLowerCase().includes(q) ||
            (r.paciente_cedula || '').toLowerCase().includes(q)
        );
    }

    const tbody = document.getElementById('tablaRecibosBody');
    const empty = document.getElementById('recibosEmptyState');

    if (!tbody) return;

    if (recibos.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';

    tbody.innerHTML = recibos.map(r => `
        <tr>
            <td><strong style="color: #2563EB;">${r.correlativo || r.id}</strong></td>
            <td><strong>${r.paciente_nombre}</strong><br><small class="text-muted">${r.paciente_cedula}</small></td>
            <td><span class="badge-tag badge-blue">${r.sede}</span></td>
            <td><span class="cell-sub">${r.fecha}</span></td>
            <td><strong class="text-emerald">$${parseFloat(r.total_usd).toFixed(2)}</strong></td>
            <td>${parseFloat(r.total_ves).toLocaleString('es-VE')} Bs</td>
            <td>
                <strong class="${r.saldo_pendiente_usd > 0 ? 'text-rose' : 'text-emerald'}">
                    $${parseFloat(r.saldo_pendiente_usd).toFixed(2)}
                </strong>
            </td>
            <td>
                <span class="badge-tag ${r.estado === 'PAGADO' ? 'badge-green' : (r.estado === 'ABONADO' ? 'badge-amber' : 'badge-rose')}">
                    ${r.estado}
                </span>
            </td>
            <td style="text-align: right;">
                <div class="table-actions-row">
                    <button type="button" class="btn btn-xs btn-outline-primary" title="Ver e Imprimir" onclick="abrirModalRecibo('${r.id}')">
                        <i class="fa-solid fa-file-invoice"></i> Ver
                    </button>
                    ${r.saldo_pendiente_usd > 0 ? `
                        <button type="button" class="btn btn-xs btn-emerald" title="Registrar Abono" onclick="abrirModalRegistrarAbono('${r.id}')">
                            <i class="fa-solid fa-hand-holding-dollar"></i> Abonar
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

window.abrirModalRecibo = function(reciboId) {
    const r = window.OpticaStorage.getReciboById(reciboId);
    if (!r) {
        showAdminToast('Recibo no encontrado.', 'error');
        return;
    }

    AppState.reciboActual = r;
    const config = window.OpticaStorage.getConfig();

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val !== undefined && val !== null ? val : '--';
    };

    setVal('rcCorrelativo', r.correlativo || r.id);
    setVal('rcFechaEmision', r.fecha);
    setVal('rcRif', config.optica_rif);

    const sedeObj = config.sedes[(r.sede || '').toLowerCase()] || config.sedes.maracay;
    setVal('rcSedeDireccion', sedeObj.lugar + ', ' + sedeObj.ciudad);
    setVal('rcSedeTelefono', sedeObj.telefono);

    setVal('rcPacienteNombre', r.paciente_nombre);
    setVal('rcPacienteCedula', r.paciente_cedula);
    setVal('rcPacienteTelefono', r.paciente_telefono || '--');
    setVal('rcPacienteSede', r.sede);

    const badgeEst = document.getElementById('rcEstadoBadge');
    if (badgeEst) {
        badgeEst.innerText = r.estado;
        badgeEst.className = `badge-tag ${r.estado === 'PAGADO' ? 'badge-green' : (r.estado === 'ABONADO' ? 'badge-amber' : 'badge-rose')}`;
    }

    const tbodyItems = document.getElementById('rcItemsTableBody');
    if (tbodyItems) {
        tbodyItems.innerHTML = (r.items || []).map(it => `
            <tr>
                <td><strong>${it.descripcion}</strong>${it.tratamientos ? `<br><small class="text-muted">${it.tratamientos.join(', ')}</small>` : ''}</td>
                <td style="text-align: center;">${it.cantidad}</td>
                <td style="text-align: right;">$${parseFloat(it.precio_unitario_usd).toFixed(2)}</td>
                <td style="text-align: right;"><strong>$${parseFloat(it.total_usd).toFixed(2)}</strong></td>
            </tr>
        `).join('');
    }

    const rxBox = document.getElementById('rcRxContainer');
    const cristItem = (r.items || []).find(i => i.rx);
    if (rxBox) {
        if (cristItem && cristItem.rx) {
            rxBox.style.display = 'block';
            const od = cristItem.rx.od || {};
            const os = cristItem.rx.os || {};

            setVal('rcRxOdSph', od.sph);
            setVal('rcRxOdCyl', od.cyl);
            setVal('rcRxOdAxis', od.axis);
            setVal('rcRxOdAdd', od.add);
            setVal('rcRxOdAv', od.av);

            setVal('rcRxOsSph', os.sph);
            setVal('rcRxOsCyl', os.cyl);
            setVal('rcRxOsAxis', os.axis);
            setVal('rcRxOsAdd', os.add);
            setVal('rcRxOsAv', os.av);

            const subDetails = document.getElementById('rcRxSubdetails');
            if (subDetails) {
                subDetails.innerText = `DP: ${cristItem.rx.dp || '--'} mm &bull; Altura Focal: ${cristItem.rx.alt || '--'} mm`;
            }
        } else {
            rxBox.style.display = 'none';
        }
    }

    setVal('rcSubtotal', `$${parseFloat(r.subtotal_usd).toFixed(2)}`);
    setVal('rcTotalUsd', `$${parseFloat(r.total_usd).toFixed(2)}`);
    setVal('rcTasaAplicada', `${parseFloat(r.tasa_aplicada).toFixed(2)} Bs/$`);
    setVal('rcTotalVes', `${parseFloat(r.total_ves).toLocaleString('es-VE', { maximumFractionDigits: 2 })} Bs`);

    const elDescLine = document.getElementById('rcDescuentoLine');
    if (elDescLine) {
        if (r.descuento_usd > 0) {
            elDescLine.style.display = 'flex';
            setVal('rcDescuento', `-$${parseFloat(r.descuento_usd).toFixed(2)}`);
        } else {
            elDescLine.style.display = 'none';
        }
    }

    const elSaldoLine = document.getElementById('rcSaldoPendienteLine');
    if (elSaldoLine) {
        if (r.saldo_pendiente_usd > 0) {
            elSaldoLine.style.display = 'flex';
            setVal('rcSaldoPendiente', `$${parseFloat(r.saldo_pendiente_usd).toFixed(2)}`);
        } else {
            elSaldoLine.style.display = 'none';
        }
    }

    const pagosList = document.getElementById('rcPagosList');
    if (pagosList) {
        pagosList.innerHTML = (r.pagos || []).map(p => `
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.25rem; color: #334155;">
                <span><strong>${p.metodo.replace(/_/g, ' ').toUpperCase()}</strong> (${p.referencia || 'Taquilla'}):</span>
                <span>$${parseFloat(p.monto_usd).toFixed(2)} / ${parseFloat(p.monto_ves).toLocaleString('es-VE')} Bs</span>
            </div>
        `).join('');
    }

    setVal('rcGarantiaDias', config.garantia_dias);

    const btnWa = document.getElementById('btnRcEnviarWhatsApp');
    if (btnWa) {
        btnWa.onclick = () => {
            window.cerrarModalRecibo();
            window.switchAdminTab('whatsapp');
            const pObj = window.OpticaStorage.getPacienteById(r.paciente_id);
            if (pObj) {
                window.seleccionarPlantillaWA('lentes_listos');
                const sel = document.getElementById('waDestinatarioSelect');
                if (sel) sel.value = pObj.id;
                actualizarDestinatarioWhatsApp();
            }
        };
    }

    openModal('modalReciboOficial');
};

window.cerrarModalRecibo = function() {
    closeModal('modalReciboOficial');
};

window.imprimirReciboActual = function() {
    window.print();
};

window.abrirModalRegistrarAbono = function(reciboId) {
    const r = window.OpticaStorage.getReciboById(reciboId);
    if (!r) return;

    const inpId = document.getElementById('abonoReciboIdHidden');
    const lblCod = document.getElementById('abonoReciboCodigo');
    const lblSaldo = document.getElementById('abonoSaldoPendiente');
    const inpMonto = document.getElementById('abonoMontoInput');

    if (inpId) inpId.value = r.id;
    if (lblCod) lblCod.innerText = r.correlativo || r.id;
    if (lblSaldo) lblSaldo.innerText = `$${r.saldo_pendiente_usd.toFixed(2)}`;
    if (inpMonto) inpMonto.value = r.saldo_pendiente_usd.toFixed(2);

    window.cambiarMetodoAbono();
    openModal('modalRegistrarAbono');
};

window.cerrarModalAbono = function() {
    closeModal('modalRegistrarAbono');
};

window.cambiarMetodoAbono = function() {
    const metodo = document.getElementById('abonoMetodo')?.value || 'efectivo_usd';
    const lbl = document.getElementById('abonoMontoLabel');
    const config = window.OpticaStorage.getConfig();
    const tasa = config.tasa_usd_ves || 842.21;

    if (lbl) {
        if (metodo.includes('ves') || metodo.includes('pago_movil') || metodo.includes('punto')) {
            lbl.innerHTML = `Monto en Bolívares (Tasa: ${tasa.toFixed(2)} Bs/$):`;
        } else {
            lbl.innerHTML = `Monto en Dólares ($ USD):`;
        }
    }
};

window.procesarAbonoRecibo = function(e) {
    if (e) e.preventDefault();

    const reciboId = document.getElementById('abonoReciboIdHidden')?.value;
    const metodo = document.getElementById('abonoMetodo')?.value || 'efectivo_usd';
    const montoRaw = parseFloat(document.getElementById('abonoMontoInput')?.value);
    const ref = (document.getElementById('abonoRefInput')?.value || '').trim();

    if (!montoRaw || montoRaw <= 0) {
        showAdminToast('Por favor ingrese un monto de abono válido.', 'warning');
        return;
    }

    const config = window.OpticaStorage.getConfig();
    const tasa = config.tasa_usd_ves || 842.21;

    let montoUsd = 0;
    let montoVes = 0;

    if (metodo.includes('ves') || metodo.includes('pago_movil') || metodo.includes('punto')) {
        montoVes = montoRaw;
        montoUsd = montoRaw / tasa;
    } else {
        montoUsd = montoRaw;
        montoVes = montoRaw * tasa;
    }

    window.OpticaStorage.registrarAbonoRecibo(reciboId, {
        metodo,
        monto_usd: Math.round(montoUsd * 100) / 100,
        monto_ves: Math.round(montoVes * 100) / 100,
        referencia: ref || 'Abono Taquilla'
    });

    const r = window.OpticaStorage.getReciboById(reciboId);
    window.OpticaStorage.registrarMovimientoCaja({
        tipo: 'INGRESO',
        concepto: `Abono Recibo ${r.correlativo} - ${r.paciente_nombre}`,
        monto_usd: montoUsd,
        monto_ves: montoVes,
        metodo: metodo,
        referencia: ref || 'Abono',
        sede: r.sede
    });

    window.cerrarModalAbono();
    renderRecibosTable();
    actualizarBadgesContadores();
    showAdminToast(`Abono de $${montoUsd.toFixed(2)} procesado con éxito.`);
};

// =============================================================================
// MÓDULO 5: TALLER & LABORATORIO ÓPTICO (KANBAN 4 FASES)
// =============================================================================
function renderLaboratorioKanban() {
    const filtroSede = document.getElementById('filtroSedeLab')?.value || AppState.sedeFiltro;
    const ordenes = window.OpticaStorage.getOrdenesLaboratorio(filtroSede !== 'todas' ? filtroSede : null);

    const f1 = ordenes.filter(o => o.fase === 'FASE_1');
    const f2 = ordenes.filter(o => o.fase === 'FASE_2');
    const f3 = ordenes.filter(o => o.fase === 'FASE_3');
    const f4 = ordenes.filter(o => o.fase === 'FASE_4');

    const c1 = document.getElementById('countFase1');
    const c2 = document.getElementById('countFase2');
    const c3 = document.getElementById('countFase3');
    const c4 = document.getElementById('countFase4');

    if (c1) c1.innerText = f1.length;
    if (c2) c2.innerText = f2.length;
    if (c3) c3.innerText = f3.length;
    if (c4) c4.innerText = f4.length;

    const renderCol = (containerId, list, siguienteFase) => {
        const box = document.getElementById(containerId);
        if (!box) return;

        if (list.length === 0) {
            box.innerHTML = `<div style="text-align: center; color: #94A3B8; font-size: 0.8rem; padding: 2rem 0;">Sin órdenes en esta etapa</div>`;
            return;
        }

        box.innerHTML = list.map(o => `
            <div class="kanban-card">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <strong style="color: #2563EB; font-size: 0.82rem;">${o.id}</strong>
                    <span class="badge-tag badge-blue">${o.sede}</span>
                </div>
                <div style="font-weight: 600; color: #0F172A; margin-bottom: 0.25rem;">${o.paciente_nombre}</div>
                <div style="font-size: 0.8rem; color: #475569; margin-bottom: 0.5rem;">
                    <i class="fa-solid fa-glasses"></i> ${o.montura}<br>
                    <i class="fa-solid fa-gem"></i> ${o.cristales}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #E2E8F0; padding-top: 0.5rem;">
                    <small class="cell-sub"><i class="fa-regular fa-clock"></i> ${o.fecha_ingreso}</small>
                    ${siguienteFase ? `
                        <button type="button" class="btn btn-xs btn-outline-primary" onclick="avanzarFaseLaboratorio('${o.id}', '${siguienteFase}')">
                            Avanzar <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    ` : `
                        <button type="button" class="btn btn-xs btn-emerald" onclick="notificarLentesListosWA('${o.paciente_id}', '${o.id}')">
                            <i class="fa-brands fa-whatsapp"></i> Notificar
                        </button>
                    `}
                </div>
            </div>
        `).join('');
    };

    renderCol('kanbanFase1', f1, 'FASE_2');
    renderCol('kanbanFase2', f2, 'FASE_3');
    renderCol('kanbanFase3', f3, 'FASE_4');
    renderCol('kanbanFase4', f4, null);
}

window.avanzarFaseLaboratorio = function(ordenId, nuevaFase) {
    window.OpticaStorage.actualizarFaseLaboratorio(ordenId, nuevaFase, 'Avanzado desde panel Kanban.');
    renderLaboratorioKanban();
    actualizarBadgesContadores();
    showAdminToast(`Orden de laboratorio ${ordenId} movida a ${nuevaFase.replace('_', ' ')}.`);
};

window.notificarLentesListosWA = function(pacienteId, ordenId) {
    window.switchAdminTab('whatsapp');
    window.seleccionarPlantillaWA('lentes_listos');
    const sel = document.getElementById('waDestinatarioSelect');
    if (sel && pacienteId) {
        sel.value = pacienteId;
        actualizarDestinatarioWhatsApp();
    }
};

// =============================================================================
// MÓDULO 6: RÉCIPES OFTALMOLÓGICOS (HOJA DUAL: LENTES + GOTAS)
// =============================================================================
function renderRecipesTable() {
    const recipes = window.OpticaStorage.getRecipes();
    const tbody = document.getElementById('tablaRecipesBody');
    const empty = document.getElementById('recipesEmptyState');

    if (!tbody) return;

    if (recipes.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';

    tbody.innerHTML = recipes.map(r => `
        <tr>
            <td><strong style="color: #2563EB;">${r.id}</strong></td>
            <td><strong>${r.paciente_nombre}</strong><br><small class="text-muted">${r.paciente_cedula}</small></td>
            <td><span class="badge-tag badge-blue">${r.sede}</span></td>
            <td>${r.fecha}</td>
            <td>${r.medico_nombre}</td>
            <td>${(r.medicamentos || []).length} medicamento(s)</td>
            <td style="text-align: right;">
                <div class="table-actions-row">
                    <button type="button" class="btn btn-xs btn-outline-primary" onclick="abrirModalRecipe('${r.id}')">
                        <i class="fa-solid fa-eye"></i> Ver Hoja Dual
                    </button>
                    <button type="button" class="btn btn-xs btn-outline-secondary" onclick="imprimirRecipeDesdeTabla('${r.id}')">
                        <i class="fa-solid fa-print"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.abrirModalNuevoRecipe = function(pacienteId = null) {
    const sel = document.getElementById('recipePacienteSelect');
    if (!sel) return;

    const pacientes = window.OpticaStorage.getPacientes();
    sel.innerHTML = '<option value="">-- Seleccione el Paciente --</option>' + 
        pacientes.map(p => `<option value="${p.id}">${p.nombre} ${p.apellido || ''} (${p.cedula})</option>`).join('');

    if (pacienteId) {
        sel.value = pacienteId;
        window.cargarDatosPacienteEnRecipe(pacienteId);
    }

    openModal('modalFormRecipe');
};

window.cerrarModalFormRecipe = function() {
    closeModal('modalFormRecipe');
};

window.cerrarModalNuevoRecipe = window.cerrarModalFormRecipe;

window.cargarDatosPacienteEnRecipe = function(pacienteId = null) {
    if (!pacienteId) {
        pacienteId = document.getElementById('recipePacienteSelect')?.value;
    }
    if (!pacienteId) return;

    const p = window.OpticaStorage.getPacienteById(pacienteId);
    if (!p) return;

    if (p.ultima_formula && p.ultima_formula.tipo_lente) {
        const inpTipo = document.getElementById('recipeTipoLenteInput');
        if (inpTipo) inpTipo.value = p.ultima_formula.tipo_lente;
    }

    showAdminToast(`Datos y fórmula de ${p.nombre} vinculados al récipe.`, 'info');
};

window.agregarFilaMedicamentoRecipe = function() {
    const container = document.getElementById('recipeMedsFormContainer');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'recipe-med-input-row';
    div.style.display = 'flex';
    div.style.gap = '0.75rem';
    div.style.alignItems = 'center';

    div.innerHTML = `
        <input type="text" class="form-control flex-2 med-nombre" placeholder="Medicamento / Gotas (Ej: Ciprofloxacina 0.3%)" required>
        <input type="text" class="form-control flex-2 med-dosis" placeholder="Dosis (Ej: 1 gota c/8 horas por 7 días)">
        <button type="button" class="btn btn-xs btn-outline-danger" onclick="eliminarFilaMedicamentoRecipe(this)">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;

    container.appendChild(div);
};

window.eliminarFilaMedicamentoRecipe = function(btn) {
    const row = btn.closest('.recipe-med-input-row') || btn.closest('.recipe-med-row');
    if (row) row.remove();
};

window.guardarFormRecipe = function(e) {
    if (e) e.preventDefault();

    const pacienteId = document.getElementById('recipePacienteSelect')?.value;
    if (!pacienteId) {
        showAdminToast('Debe seleccionar un paciente para el récipe.', 'warning');
        return;
    }

    const p = window.OpticaStorage.getPacienteById(pacienteId);
    if (!p) return;

    const tipoLente = document.getElementById('recipeTipoLenteInput')?.value || 'Monofocal';
    const tratamientos = (document.getElementById('recipeTratamientosInput')?.value || '').split('+').map(s => s.trim()).filter(Boolean);
    const indicaciones = document.getElementById('recipeIndicacionesInput')?.value || 'Control visual en 1 año.';

    const medRows = document.querySelectorAll('#recipeMedsFormContainer .recipe-med-input-row, #recipeMedsFormContainer .recipe-med-row');
    const medicamentos = [];
    medRows.forEach(row => {
        const nom = row.querySelector('.med-nombre')?.value?.trim();
        const dos = row.querySelector('.med-dosis')?.value?.trim();
        if (nom) {
            medicamentos.push({ nombre: nom, dosis: dos, indicacion: dos });
        }
    });

    const nuevoRecipe = window.OpticaStorage.crearRecipe({
        paciente_id: p.id,
        paciente_nombre: `${p.nombre} ${p.apellido || ''}`,
        paciente_cedula: p.cedula,
        paciente_edad: p.edad,
        sede: p.sede,
        formula: p.ultima_formula || {},
        tipo_lente: tipoLente,
        tratamientos: tratamientos.length > 0 ? tratamientos : ['Antirreflejo', 'Filtro Azul'],
        medicamentos: medicamentos,
        indicaciones_generales: indicaciones
    });

    window.cerrarModalFormRecipe();
    renderRecipesTable();
    actualizarBadgesContadores();

    window.abrirModalRecipe(nuevoRecipe.id);
    showAdminToast(`Récipe Oftalmológico ${nuevoRecipe.id} emitido correctamente.`);
};

window.abrirModalRecipe = function(recipeId) {
    const rc = window.OpticaStorage.getRecipeById(recipeId);
    if (!rc) {
        showAdminToast('Récipe no encontrado.', 'error');
        return;
    }

    AppState.recipeActual = rc;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val !== undefined && val !== null ? val : '--';
    };

    setVal('rcpNombreA', rc.paciente_nombre);
    setVal('rcpCedulaA', rc.paciente_cedula);
    setVal('rcpFechaA', rc.fecha);
    setVal('rcpMedicoA', rc.medico_nombre);
    setVal('rcpColegioA', rc.medico_colegio);

    const f = rc.formula || {};
    const od = f.od || {};
    const os = f.os || {};

    setVal('rcpOdSph', od.sph);
    setVal('rcpOdCyl', od.cyl);
    setVal('rcpOdAxis', od.axis);
    setVal('rcpOdAdd', od.add);
    setVal('rcpOdAv', od.av);

    setVal('rcpOsSph', os.sph);
    setVal('rcpOsCyl', os.cyl);
    setVal('rcpOsAxis', os.axis);
    setVal('rcpOsAdd', os.add);
    setVal('rcpOsAv', os.av);

    setVal('rcpDp', f.dp);
    setVal('rcpAlt', f.alt);
    setVal('rcpTipoLente', rc.tipo_lente);
    setVal('rcpTratamientos', (rc.tratamientos || []).join(', ') || 'Estándar');

    setVal('rcpNombreB', rc.paciente_nombre);
    setVal('rcpCedulaB', rc.paciente_cedula);
    setVal('rcpFechaB', rc.fecha);
    setVal('rcpMedicoB', rc.medico_nombre);
    setVal('rcpColegioB', rc.medico_colegio);

    const medsList = document.getElementById('rcpMedsList');
    if (medsList) {
        if (!rc.medicamentos || rc.medicamentos.length === 0) {
            medsList.innerHTML = '<p class="text-muted" style="padding: 1rem 0;">Sin prescripción farmacológica en esta consulta.</p>';
        } else {
            medsList.innerHTML = rc.medicamentos.map((m, idx) => `
                <div style="margin-bottom: 1.25rem; border-left: 3px solid #3B82F6; padding-left: 0.75rem;">
                    <div style="font-weight: 700; color: #0F172A; font-size: 0.95rem;">
                        ${idx + 1}. ${m.nombre} <span style="font-size: 0.85rem; font-weight: normal; color: #64748B;">(${m.dosis || 'Gotas'})</span>
                    </div>
                    <div style="font-size: 0.88rem; color: #334155; margin-top: 0.25rem;">
                        <strong>Rp:</strong> ${m.indicacion || m.dosis}
                    </div>
                </div>
            `).join('');
        }
    }

    setVal('rcpIndicacionesGenerales', rc.indicaciones_generales);

    openModal('modalRecipeOficial');
};

window.cerrarModalRecipe = function() {
    closeModal('modalRecipeOficial');
};

window.imprimirRecipeActual = function() {
    window.print();
};

window.imprimirRecipeDesdeTabla = function(recipeId) {
    window.abrirModalRecipe(recipeId);
    setTimeout(() => window.print(), 300);
};

// =============================================================================
// MÓDULO 7: INFORMES MÉDICOS CLÍNICOS FORMALES
// =============================================================================
function renderInformesTable() {
    const informes = window.OpticaStorage.getInformes();
    const tbody = document.getElementById('tablaInformesBody');
    const empty = document.getElementById('informesEmptyState');

    if (!tbody) return;

    if (informes.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';

    tbody.innerHTML = informes.map(i => `
        <tr>
            <td><strong style="color: #2563EB;">${i.id}</strong></td>
            <td><strong>${i.paciente_nombre}</strong><br><small class="text-muted">${i.paciente_cedula}</small></td>
            <td><span class="badge-tag badge-blue">${i.sede}</span></td>
            <td>${i.fecha}</td>
            <td>${i.diagnostico}</td>
            <td>${i.medico_nombre}</td>
            <td style="text-align: right;">
                <div class="table-actions-row">
                    <button type="button" class="btn btn-xs btn-outline-primary" onclick="abrirModalInforme('${i.id}')">
                        <i class="fa-solid fa-file-lines"></i> Ver Informe
                    </button>
                    <button type="button" class="btn btn-xs btn-outline-secondary" onclick="imprimirInformeDesdeTabla('${i.id}')">
                        <i class="fa-solid fa-print"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.abrirModalNuevoInforme = function(pacienteId = null) {
    const sel = document.getElementById('informePacienteSelect');
    if (!sel) return;

    const pacientes = window.OpticaStorage.getPacientes();
    sel.innerHTML = '<option value="">-- Seleccione un Paciente Registrado --</option>' + 
        pacientes.map(p => `<option value="${p.id}">${p.nombre} ${p.apellido || ''} (${p.cedula})</option>`).join('');

    if (pacienteId) {
        sel.value = pacienteId;
        window.cargarDatosPacienteEnInforme(pacienteId);
    }

    openModal('modalFormInforme');
};

window.cerrarModalFormInforme = function() {
    closeModal('modalFormInforme');
};

window.cerrarModalNuevoInforme = window.cerrarModalFormInforme;

window.cargarDatosPacienteEnInforme = function(pacienteId = null) {
    if (!pacienteId) {
        pacienteId = document.getElementById('informePacienteSelect')?.value;
    }
    if (!pacienteId) return;

    const p = window.OpticaStorage.getPacienteById(pacienteId);
    if (!p) return;

    const f = p.ultima_formula || {};
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    setVal('infFormAvOd', f.od?.av || '20/20 cc');
    setVal('infFormAvOs', f.os?.av || '20/20 cc');
};

window.guardarFormInforme = function(e) {
    if (e) e.preventDefault();

    const pacienteId = document.getElementById('informePacienteSelect')?.value;
    if (!pacienteId) {
        showAdminToast('Debe seleccionar un paciente para el informe.', 'warning');
        return;
    }

    const p = window.OpticaStorage.getPacienteById(pacienteId);
    if (!p) return;

    const enf = document.getElementById('infFormEnfermedad')?.value || 'Evaluación oftalmológica general.';
    const avOd = document.getElementById('infFormAvOd')?.value || '20/20 cc';
    const avOs = document.getElementById('infFormAvOs')?.value || '20/20 cc';
    const bio = document.getElementById('infFormBiomicroscopia')?.value || 'Párpados y córnea sin lesiones activas.';
    const pio = document.getElementById('infFormPio')?.value || 'OD: 14 mmHg / OS: 15 mmHg';
    const fondo = document.getElementById('infFormFondoOjo')?.value || 'Papila y mácula normales.';
    const diag = document.getElementById('infFormDiagnostico')?.value || 'Vicio de refracción.';
    const plan = document.getElementById('infFormPlan')?.value || 'Uso continuo de corrección óptica. Control en 1 año.';

    const nuevoInf = window.OpticaStorage.crearInforme({
        paciente_id: p.id,
        paciente_nombre: `${p.nombre} ${p.apellido || ''}`,
        paciente_cedula: p.cedula,
        paciente_edad: p.edad,
        paciente_sexo: p.sexo || 'M',
        sede: p.sede,
        enfermedad_actual: enf,
        antecedentes: p.antecedentes || 'Sin antecedentes reportados',
        agudeza_visual_od: avOd,
        agudeza_visual_os: avOs,
        biomicroscopia: bio,
        presion_intraocular: pio,
        fondo_ojo: fondo,
        diagnostico: diag,
        plan_conducta: plan
    });

    window.cerrarModalFormInforme();
    renderInformesTable();
    actualizarBadgesContadores();

    window.abrirModalInforme(nuevoInf.id);
    showAdminToast(`Informe Médico ${nuevoInf.id} emitido con éxito.`);
};

window.abrirModalInforme = function(informeId) {
    const inf = window.OpticaStorage.getInformeById(informeId);
    if (!inf) {
        showAdminToast('Informe no encontrado.', 'error');
        return;
    }

    AppState.informeActual = inf;
    const config = window.OpticaStorage.getConfig();

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val !== undefined && val !== null ? val : '--';
    };

    setVal('infCodigo', inf.id);
    setVal('infFecha', inf.fecha);
    setVal('infRif', config.optica_rif);
    setVal('infSede', inf.sede);

    setVal('infNombre', inf.paciente_nombre);
    setVal('infCedula', inf.paciente_cedula);
    setVal('infEdadSexo', `${inf.paciente_edad || '--'} años / Sexo: ${inf.paciente_sexo || 'M'}`);
    setVal('infEnfermedadActual', inf.enfermedad_actual);
    setVal('infAntecedentes', inf.antecedentes);

    setVal('infAvOd', inf.agudeza_visual_od);
    setVal('infAvOs', inf.agudeza_visual_os);
    setVal('infBiomicroscopia', inf.biomicroscopia);
    setVal('infPio', inf.presion_intraocular);
    setVal('infFondoOjo', inf.fondo_ojo);
    setVal('infDiagnostico', inf.diagnostico);
    setVal('infPlan', inf.plan_conducta);

    setVal('infMedicoDirector', inf.medico_nombre);
    setVal('infMedicoColegio', inf.medico_colegio);

    openModal('modalInformeOficial');
};

window.cerrarModalInforme = function() {
    closeModal('modalInformeOficial');
};

window.imprimirInformeActual = function() {
    window.print();
};

window.imprimirInformeDesdeTabla = function(informeId) {
    window.abrirModalInforme(informeId);
    setTimeout(() => window.print(), 300);
};

// =============================================================================
// MÓDULO 8: CENTRO DE WHATSAPP CON SMARTPHONE MOCKUP
// =============================================================================
function renderWhatsAppCenter() {
    const sel = document.getElementById('waDestinatarioSelect');
    if (!sel) return;

    const pacientes = window.OpticaStorage.getPacientes();
    const currentVal = sel.value;

    sel.innerHTML = '<option value="">-- Seleccionar Paciente Destinatario --</option>' + 
        pacientes.map(p => `<option value="${p.id}">${p.nombre} ${p.apellido || ''} (${p.cedula}) - ${p.telefono}</option>`).join('');

    if (currentVal) {
        sel.value = currentVal;
    } else if (pacientes.length > 0) {
        sel.value = pacientes[0].id;
    }

    actualizarDestinatarioWhatsApp();
}

window.actualizarDestinatarioWhatsApp = function() {
    const sel = document.getElementById('waDestinatarioSelect');
    const pacienteId = sel?.value;
    const p = window.OpticaStorage.getPacienteById(pacienteId);

    AppState.whatsapp.paciente = p;

    const phNombre = document.getElementById('waPhoneNombre');
    const phAvatar = document.getElementById('waPhoneAvatar');

    if (p) {
        const iniciales = (p.nombre ? p.nombre.charAt(0) : 'P') + (p.apellido ? p.apellido.charAt(0) : '');
        if (phNombre) phNombre.innerText = `${p.nombre} ${p.apellido || ''}`;
        if (phAvatar) phAvatar.innerText = iniciales.toUpperCase();
    } else {
        if (phNombre) phNombre.innerText = 'Paciente (Vista Previa)';
        if (phAvatar) phAvatar.innerText = 'WA';
    }

    window.seleccionarPlantillaWA(AppState.whatsapp.plantillaSeleccionada || 'lentes_listos');
};

window.seleccionarPlantillaWA = function(tipo) {
    AppState.whatsapp.plantillaSeleccionada = tipo;

    // Fix: HTML uses .interval-pill-btn with data-tmpl attribute
    document.querySelectorAll('.interval-pill-btn, .wa-template-btn').forEach(b => {
        const tmpl = b.getAttribute('data-tmpl') || '';
        if (tmpl === tipo || (b.getAttribute('onclick') || '').includes(tipo)) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    const plantillas = {
        'lentes_listos': "Estimado(a) {nombre}, le saludamos desde Centro Óptico Nieves. Le informamos con agrado que sus lentes ya se encuentran listos para ser retirados en nuestra sede de {sede}. Puede pasar en nuestro horario habitual de atención. ¡Esperamos su visita!",
        'cita': "Estimado(a) {nombre}, le recordamos su cita pautada en Centro Óptico Nieves, sede {sede}. Por favor confírmenos su asistencia respondiendo a este mensaje para garantizar su turno con el especialista.",
        'control_7m': "Hola {nombre}, le saludamos de Centro Óptico Nieves. Ya han transcurrido 7 meses desde la entrega de sus lentes. Le invitamos a pasar por nuestra sede de {sede} para realizar un mantenimiento y ajuste preventivo de sus monturas totalmente gratis.",
        'control_8m': "Estimado(a) {nombre}, en Centro Óptico Nieves nos preocupamos por su salud visual. Al cumplirse 8 meses con sus cristales actuales, le recomendamos una rápida revisión de confort visual en nuestra sede de {sede}.",
        'control_anual': "Estimado(a) {nombre}, ha pasado 1 año desde su última evaluación oftalmológica en Centro Óptico Nieves. Para garantizar una visión óptima y cuidar su salud ocular, le recomendamos agendar su consulta de control anual en nuestra sede de {sede}."
    };

    let baseText = plantillas[tipo] || plantillas['lentes_listos'];
    const p = AppState.whatsapp.paciente;

    if (p) {
        baseText = baseText
            .replace(/{nombre}/g, `${p.nombre} ${p.apellido || ''}`.trim())
            .replace(/{cedula}/g, p.cedula || '')
            .replace(/{sede}/g, p.sede || 'Maracay')
            .replace(/{telefono}/g, p.telefono || '');
    }

    const editor = document.getElementById('waMensajeEditor');
    if (editor) {
        editor.value = baseText;
    }

    actualizarPantallaSmartphone();
};

window.actualizarPantallaSmartphone = function() {
    const editor = document.getElementById('waMensajeEditor');
    const bubble = document.getElementById('waPhoneBubbleText');
    const time = document.getElementById('waPhoneTimestamp');

    const txt = editor?.value || '';
    if (bubble) {
        bubble.innerHTML = txt.replace(/\n/g, '<br>');
    }

    if (time) {
        const now = new Date();
        const hrs = now.getHours();
        const mins = String(now.getMinutes()).padStart(2, '0');
        const ampm = hrs >= 12 ? 'pm' : 'am';
        const formattedHrs = hrs % 12 || 12;
        time.innerText = `${formattedHrs}:${mins} ${ampm}`;
    }
};

window.insertarVariableWA = function(tag) {
    const editor = document.getElementById('waMensajeEditor');
    if (!editor) return;

    const start = editor.selectionStart || editor.value.length;
    const end = editor.selectionEnd || editor.value.length;
    const val = editor.value;

    editor.value = val.substring(0, start) + `{${tag}}` + val.substring(end);
    editor.focus();
    actualizarPantallaSmartphone();
};

window.dispararEnvioWhatsApp = function() {
    const p = AppState.whatsapp.paciente;
    const editor = document.getElementById('waMensajeEditor');
    const msg = editor?.value || '';

    if (!p) {
        showAdminToast('Debe seleccionar un paciente destinatario.', 'warning');
        return;
    }

    if (!msg.trim()) {
        showAdminToast('El mensaje no puede estar vacío.', 'warning');
        return;
    }

    let phone = (p.telefono_wa || p.telefono || '').replace(/\D/g, '');
    if (!phone) {
        showAdminToast('El paciente no posee un número de teléfono registrado.', 'error');
        return;
    }

    if (phone.startsWith('04')) {
        phone = '58' + phone.substring(1);
    } else if (phone.startsWith('4')) {
        phone = '58' + phone;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    showAdminToast(`Ventana de WhatsApp abierta para ${p.nombre}.`);
};

window.abrirWhatsAppPacienteDirecto = function(pacienteId) {
    window.switchAdminTab('whatsapp');
    const sel = document.getElementById('waDestinatarioSelect');
    if (sel) {
        sel.value = pacienteId;
        actualizarDestinatarioWhatsApp();
    }
};

// =============================================================================
// MÓDULO 9: CAJA DIARIA & ARQUEO MULTIMONEDA
// =============================================================================
function renderCaja() {
    const resumen = window.OpticaStorage.getResumenCajaHoy(AppState.sedeFiltro);

    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    setTxt('cajaEfectivoUsd', `$${resumen.efectivo_usd.toFixed(2)}`);
    setTxt('cajaPagoMovilVes', `${resumen.pago_movil_ves.toLocaleString('es-VE')} Bs`);
    setTxt('cajaPuntoVes', `${resumen.punto_venta_ves.toLocaleString('es-VE')} Bs`);
    setTxt('cajaZelleUsd', `$${resumen.zelle_usd.toFixed(2)}`);
    setTxt('cajaBalanceNeto', `$${resumen.balance_neto_usd.toFixed(2)}`);

    const tbody = document.getElementById('tablaCajaBody');
    const empty = document.getElementById('cajaEmptyState');

    if (!tbody) return;

    if (resumen.movimientos_hoy.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';

    tbody.innerHTML = resumen.movimientos_hoy.map(m => `
        <tr>
            <td><span class="cell-sub">${m.fecha.split(' ')[1] || m.fecha}</span></td>
            <td>
                <span class="badge-tag ${m.tipo === 'INGRESO' ? 'badge-green' : 'badge-amber'}">
                    ${m.tipo}
                </span>
            </td>
            <td><strong>${m.concepto}</strong></td>
            <td>${m.metodo.replace(/_/g, ' ').toUpperCase()}</td>
            <td><strong class="${m.tipo === 'INGRESO' ? 'text-emerald' : 'text-rose'}">$${parseFloat(m.monto_usd).toFixed(2)}</strong></td>
            <td>${parseFloat(m.monto_ves).toLocaleString('es-VE')} Bs</td>
            <td><span class="cell-sub">${m.referencia || '--'}</span></td>
            <td><span class="badge-tag badge-blue">${m.sede}</span></td>
        </tr>
    `).join('');
}

window.abrirModalNuevoMovimientoCaja = function() {
    const form = document.getElementById('formMovimientoCaja');
    if (form) form.reset();
    const selSede = document.getElementById('movSedeSelect');
    if (selSede) {
        selSede.value = AppState.sedeFiltro !== 'todas' ? AppState.sedeFiltro : 'Maracay';
    }
    openModal('modalMovimientoCaja');
};

window.cerrarModalMovimientoCaja = function() {
    closeModal('modalMovimientoCaja');
};

window.guardarFormMovimientoCaja = function(e) {
    if (e) e.preventDefault();
    const tipo = document.getElementById('movTipoSelect')?.value || 'EGRESO';
    const concepto = document.getElementById('movConceptoInput')?.value?.trim();
    const montoUsd = parseFloat(document.getElementById('movMontoUsdInput')?.value) || 0;
    const metodo = document.getElementById('movMetodoSelect')?.value || 'efectivo_usd';
    const referencia = document.getElementById('movReferenciaInput')?.value?.trim() || '';
    const sede = document.getElementById('movSedeSelect')?.value || 'Maracay';

    if (!concepto) {
        showAdminToast('Por favor ingrese el concepto del movimiento.', 'warning');
        return;
    }
    if (montoUsd <= 0) {
        showAdminToast('Por favor ingrese un monto válido.', 'warning');
        return;
    }

    const config = window.OpticaStorage.getConfig();
    const tasa = config.tasa_usd_ves || 842.21;
    const montoVes = Math.round(montoUsd * tasa * 100) / 100;

    window.OpticaStorage.registrarMovimientoCaja({
        tipo,
        concepto,
        monto_usd: montoUsd,
        monto_ves: montoVes,
        metodo,
        referencia: referencia || (tipo === 'INGRESO' ? 'Ingreso Manual' : 'Gasto Operativo'),
        sede
    });

    closeModal('modalMovimientoCaja');
    renderCaja();
    actualizarBadgesContadores();
    showAdminToast(`Movimiento (${tipo}) de $${montoUsd.toFixed(2)} registrado correctamente.`);
};

window.imprimirCierreDeCaja = function() {
    window.print();
};

// =============================================================================
// MÓDULO 10: AGENDA DE CITAS CLÍNICAS
// =============================================================================
function renderCitasTable() {
    const q = (document.getElementById('inputBuscarCita')?.value || '').toLowerCase().trim();
    const sede = document.getElementById('filtroSedeCitas')?.value || 'todas';

    let citas = window.OpticaStorage.getCitas();

    if (sede !== 'todas') {
        citas = citas.filter(c => c.sede === sede);
    }

    if (q) {
        citas = citas.filter(c => 
            (c.nombre || '').toLowerCase().includes(q) ||
            (c.cedula || '').toLowerCase().includes(q)
        );
    }

    const tbody = document.getElementById('tablaCitasBody');
    const empty = document.getElementById('citasEmptyState');

    if (!tbody) return;

    if (citas.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';

    tbody.innerHTML = citas.map(c => `
        <tr>
            <td><strong>${c.nombre}</strong></td>
            <td><span class="badge-tag badge-gray">${c.cedula}</span></td>
            <td>${c.telefono}</td>
            <td><span class="badge-tag badge-blue">${c.sede}</span></td>
            <td><strong>${c.fecha}</strong> &bull; ${c.hora}</td>
            <td>${c.motivo}</td>
            <td>
                <span class="badge-tag ${c.estado === 'CONFIRMADA' ? 'badge-green' : (c.estado === 'ATENDIDA' ? 'badge-purple' : 'badge-amber')}">
                    ${c.estado}
                </span>
            </td>
            <td style="text-align: right;">
                <div class="table-actions-row">
                    ${c.estado === 'PENDIENTE' ? `
                        <button type="button" class="btn btn-xs btn-emerald" onclick="cambiarEstadoCita('${c.id}', 'CONFIRMADA')">
                            Confirmar
                        </button>
                    ` : ''}
                    <button type="button" class="btn btn-xs btn-primary" onclick="atenderPacienteDesdeCita('${c.cedula}')">
                        Atender
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.cambiarEstadoCita = function(id, nuevoEstado) {
    window.OpticaStorage.actualizarEstadoCita(id, nuevoEstado);
    renderCitasTable();
    actualizarBadgesContadores();
    showAdminToast(`Estado de cita actualizado a ${nuevoEstado}.`);
};

window.atenderPacienteDesdeCita = function(cedula) {
    const paciente = window.OpticaStorage.getPacienteByCedula(cedula);
    if (paciente) {
        window.iniciarVentaConPaciente(paciente.id);
    } else {
        window.abrirModalNuevoPaciente();
    }
};

window.abrirModalNuevaCita = function() {
    const form = document.getElementById('formAgendarCita');
    if (form) form.reset();
    const selSede = document.getElementById('citaSedeSelect');
    if (selSede) {
        selSede.value = AppState.sedeFiltro !== 'todas' ? AppState.sedeFiltro : 'Maracay';
    }
    const inpFecha = document.getElementById('citaFechaInput');
    if (inpFecha) {
        inpFecha.value = new Date().toISOString().split('T')[0];
    }
    openModal('modalFormCita');
};

window.cerrarModalCita = function() {
    closeModal('modalFormCita');
};

window.guardarFormCita = function(e) {
    if (e) e.preventDefault();
    const nombre = document.getElementById('citaNombreInput')?.value?.trim();
    const cedula = document.getElementById('citaCedulaInput')?.value?.trim();
    const telefono = document.getElementById('citaTelefonoInput')?.value?.trim();
    const sede = document.getElementById('citaSedeSelect')?.value || 'Maracay';
    const fecha = document.getElementById('citaFechaInput')?.value || new Date().toISOString().split('T')[0];
    const hora = document.getElementById('citaHoraInput')?.value || '09:00 AM';
    const motivo = document.getElementById('citaMotivoInput')?.value || 'Examen Visual Integral';

    if (!nombre || !cedula) {
        showAdminToast('Por favor complete los campos obligatorios.', 'warning');
        return;
    }

    window.OpticaStorage.registrarCita({
        nombre,
        cedula,
        telefono,
        sede,
        fecha,
        hora,
        motivo
    });

    closeModal('modalFormCita');
    renderCitasTable();
    actualizarBadgesContadores();
    showAdminToast(`Cita para ${nombre} agendada para el ${fecha} a las ${hora}.`);
};

// =============================================================================
// MÓDULO 11: CONFIGURACIÓN DE SEDES & TASA BCV
// =============================================================================
function cargarConfiguracionInputs() {
    const config = window.OpticaStorage.getConfig();

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    setVal('cfgOpticaNombre', config.optica_nombre);
    setVal('cfgOpticaRif', config.optica_rif);
    setVal('cfgGarantiaDias', config.garantia_dias);
    setVal('cfgTasaInput', config.tasa_usd_ves);
    setVal('cfgMedicoDirector', config.medico_director);
    setVal('cfgMedicoColegio', config.medico_colegio);

    const dispFecha = document.getElementById('cfgFechaValorDisplay');
    if (dispFecha) dispFecha.innerText = config.tasa_fecha || 'Martes, 15 Septiembre 2026';

    if (config.sedes.maracay) {
        setVal('cfgMaracayDir', config.sedes.maracay.lugar + ', ' + config.sedes.maracay.ciudad);
        setVal('cfgMaracayTel', config.sedes.maracay.telefono);
    }

    if (config.sedes.sanjuan) {
        setVal('cfgSanJuanDir', config.sedes.sanjuan.lugar + ', ' + config.sedes.sanjuan.ciudad);
        setVal('cfgSanJuanTel', config.sedes.sanjuan.telefono);
    }
}

window.guardarConfiguracionGeneral = function() {
    const config = window.OpticaStorage.getConfig();

    config.optica_nombre = document.getElementById('cfgOpticaNombre')?.value.trim() || config.optica_nombre;
    config.optica_rif = document.getElementById('cfgOpticaRif')?.value.trim() || config.optica_rif;
    config.garantia_dias = parseInt(document.getElementById('cfgGarantiaDias')?.value) || 30;
    config.medico_director = document.getElementById('cfgMedicoDirector')?.value.trim() || config.medico_director;
    config.medico_colegio = document.getElementById('cfgMedicoColegio')?.value.trim() || config.medico_colegio;

    if (!config.sedes.maracay) config.sedes.maracay = {};
    config.sedes.maracay.lugar = document.getElementById('cfgMaracayDir')?.value.trim() || config.sedes.maracay.lugar;
    config.sedes.maracay.telefono = document.getElementById('cfgMaracayTel')?.value.trim() || config.sedes.maracay.telefono;

    if (!config.sedes.sanjuan) config.sedes.sanjuan = {};
    config.sedes.sanjuan.lugar = document.getElementById('cfgSanJuanDir')?.value.trim() || config.sedes.sanjuan.lugar;
    config.sedes.sanjuan.telefono = document.getElementById('cfgSanJuanTel')?.value.trim() || config.sedes.sanjuan.telefono;

    window.OpticaStorage.saveConfig(config);
    showAdminToast('Configuración general y sedes guardadas correctamente.');
};

window.guardarTasaConfiguracion = function() {
    const tasa = parseFloat(document.getElementById('cfgTasaInput')?.value);
    if (tasa > 0) {
        window.OpticaStorage.updateTasaCambio(tasa, 'Martes, 15 Septiembre 2026');
        actualizarDisplayTasa(tasa, 'Martes, 15 Septiembre 2026');
        renderCurrentTab();
        showAdminToast(`Tasa de cambio del día actualizada a ${tasa.toFixed(2)} Bs/$`);
    } else {
        showAdminToast('Por favor ingrese una tasa válida.', 'warning');
    }
};

window.confirmarReseteoTotal = function() {
    const conf = confirm('¿ESTÁ SEGURO de querer restablecer todo a cero (0 datos)? Se borrarán todos los pacientes, ventas, recibos, órdenes y movimientos de caja.');
    if (conf) {
        window.OpticaStorage.resetDatabase();
        actualizarBadgesContadores();
        renderCurrentTab();
        showAdminToast('Base de datos restablecida a 0 registros.', 'info');
    }
};
