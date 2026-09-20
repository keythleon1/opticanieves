/**
 * Capa de Persistencia y Base de Datos Unificada - Centro Óptico Nieves
 * Arquitectura modular sin redundancias, sin emojis, compatible con tasas BCV.
 * 
 * Gestiona:
 * - Pacientes 360 (Expediente Integral Clínico y Óptico)
 * - Ventas y Recibos Oficiales con Correlativo
 * - Órdenes de Laboratorio y Taller (4 Fases)
 * - Récipes Médicos Oftalmológicos (Hoja Dual: Lentes + Gotas/Medicamentos)
 * - Informes Médicos Clínicos Formales
 * - Centro de Notificaciones WhatsApp (Plantillas por Intervalos)
 * - Caja Diaria y Arqueo Multimoneda (USD y Bs)
 * - Agenda de Citas
 * - Configuración Fiscal y Sedes (Maracay y San Juan de los Morros)
 */

const STORAGE_KEYS = {
    PACIENTES: 'optica_nieves_pacientes_v3',
    VENTAS: 'optica_nieves_ventas_v3',
    RECIBOS: 'optica_nieves_recibos_v3',
    LABORATORIO: 'optica_nieves_laboratorio_v3',
    RECIPES: 'optica_nieves_recipes_v3',
    INFORMES: 'optica_nieves_informes_v3',
    CAJA: 'optica_nieves_caja_v3',
    CITAS: 'optica_nieves_citas_v3',
    CONSULTAS: 'optica_nieves_consultas_v3',
    HISTORIAS_OPTOMETRICAS: 'optica_nieves_historias_optometricas_v3',
    FICHAS_CONSULTA: 'optica_nieves_fichas_consulta_v3',
    CONFIG: 'optica_nieves_config_v3',
    MEDICOS: 'optica_nieves_medicos_v3',
    MEDICO_ACTIVO: 'optica_nieves_medico_activo_id',
    INVENTARIO: 'optica_nieves_inventario_v3',
    CATEGORIAS_INVENTARIO: 'optica_nieves_categorias_inv_v3',
    WA_PLANTILLAS_CUSTOM: 'optica_nieves_wa_plantillas_custom_v1',
    WA_RECORDATORIOS: 'optica_nieves_wa_recordatorios_v1'
};

// Médicos predeterminados del sistema: Plantilla limpia por defecto
const DEFAULT_MEDICOS = [
    {
        id: 'med_principal',
        prefijo: 'Dr.',
        nombre: '',
        apellido: '',
        especialidad: 'Oftalmología',
        cedula: '',
        mpps: '',
        colegio: '',
        telefono: '',
        email: ''
    }
];

// Formateador dinámico de fecha en español
function getFechaEspanolActual(dateInput) {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return '';
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

// Configuración oficial con tasa BCV suministrada
const DEFAULT_CONFIG = {
    optica_nombre: "Centro Óptico Nieves",
    optica_lema: "Especialistas en el Cuidado de tus Ojos",
    optica_rif: "J-40968579-9",
    medico_director: "",
    medico_colegio: "",
    tasa_usd_ves: 847.44, // Tasa BCV Oficial
    tasa_fecha: getFechaEspanolActual(),
    garantia_dias: 30,
    sedes: {
        maracay: {
            id: "maracay",
            nombre: "Sede Maracay",
            lugar: "C.C. Las Américas, Nivel 1, Local 42",
            ciudad: "Maracay, Estado Aragua",
            telefono: "+58 412-1234567",
            whatsapp: "584121234567",
            dias_atencion: "Lunes a Sábado: 9:00 AM - 6:00 PM"
        },
        sanjuan: {
            id: "sanjuan",
            nombre: "Sede San Juan de los Morros",
            lugar: "C.C. Galería, Nivel PB, Local 18",
            ciudad: "San Juan de los Morros, Estado Guárico",
            telefono: "+58 414-7654321",
            whatsapp: "584147654321",
            dias_atencion: "Lunes a Viernes: 8:30 AM - 5:00 PM"
        }
    },
    plantillas_wa: {
        appointment_reminder: {
            id: "appointment_reminder",
            title: "Recordatorio de Cita Próxima",
            category: "Citas",
            body: "Hola *{nombre}*, le saludamos de *Centro Óptico Nieves*. Le recordamos su cita oftalmológica pautada para el día *{fecha}* a las *{hora}* en nuestra sede de *{sede}*. Por favor responda *CONFIRMAR* para asegurar su turno.",
            intervalMonths: 0
        },
        lens_ready: {
            id: "lens_ready",
            title: "Lentes Listos para Retiro",
            category: "Taller & Laboratorio",
            body: "Buenas noticias, *{nombre}*. Sus lentes ya pasaron con éxito el control de calidad en nuestro laboratorio y están *LISTOS PARA RETIRAR* en nuestra sede de *{sede}*. Puede pasar en nuestro horario habitual presentando su cédula *{cedula}*.",
            intervalMonths: 0
        },
        lens_renewal_7m: {
            id: "lens_renewal_7m",
            title: "Renovación y Chequeo de Cristales (7 Meses)",
            category: "Mantenimiento & Cristales",
            body: "Estimado(a) *{nombre}*, le saludamos de *Centro Óptico Nieves*. Han transcurrido 7 meses desde la entrega de sus cristales. Le invitamos a una revisión preventiva sin costo para verificar el ajuste de su montura y la agudeza visual en nuestra sede de *{sede}*.",
            intervalMonths: 7
        },
        lens_renewal_8m: {
            id: "lens_renewal_8m",
            title: "Ajuste de Fórmula Óptica (8 Meses)",
            category: "Mantenimiento & Cristales",
            body: "Estimado(a) *{nombre}*, esperamos que se encuentre bien. Han transcurrido 8 meses desde su última formulación de lentes. Le recomendamos una consulta preventiva para verificar la vigencia de su graduación en *Centro Óptico Nieves* ({sede}).",
            intervalMonths: 8
        },
        annual_renewal: {
            id: "annual_renewal",
            title: "Consulta y Control Anual Oftalmológico (1 Año)",
            category: "Chequeo Preventivo",
            body: "Estimado(a) *{nombre}*, en *Centro Óptico Nieves* cuidamos de su salud visual. Ya ha transcurrido 1 año desde su última evaluación oftalmológica completa. Le invitamos a agendar su chequeo anual en nuestra sede de *{sede}* para prevenir afecciones oculares.",
            intervalMonths: 12
        }
    }
};

class OpticaStorageManager {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(STORAGE_KEYS.PACIENTES)) {
            localStorage.setItem(STORAGE_KEYS.PACIENTES, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.VENTAS)) {
            localStorage.setItem(STORAGE_KEYS.VENTAS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.RECIBOS)) {
            localStorage.setItem(STORAGE_KEYS.RECIBOS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.LABORATORIO)) {
            localStorage.setItem(STORAGE_KEYS.LABORATORIO, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.RECIPES)) {
            localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.INFORMES)) {
            localStorage.setItem(STORAGE_KEYS.INFORMES, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.CAJA)) {
            localStorage.setItem(STORAGE_KEYS.CAJA, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.CITAS)) {
            localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.CONSULTAS)) {
            localStorage.setItem(STORAGE_KEYS.CONSULTAS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
            localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
        }
        if (!localStorage.getItem(STORAGE_KEYS.MEDICOS)) {
            localStorage.setItem(STORAGE_KEYS.MEDICOS, JSON.stringify(DEFAULT_MEDICOS));
        }

        // Limpieza y migración de médicos anteriores (eliminar Juan Loreto de pruebas y garantizar Especialista)
        try {
            const medicosRaw = localStorage.getItem(STORAGE_KEYS.MEDICOS);
            let medicosList = medicosRaw ? JSON.parse(medicosRaw) : [];
            if (medicosRaw && (medicosRaw.includes('Loreto') || medicosRaw.includes('med_juan_loreto'))) {
                medicosList = medicosList.filter(m => !m.id?.includes('loreto') && !m.apellido?.includes('Loreto'));
                if (medicosList.length === 0) {
                    medicosList = JSON.parse(JSON.stringify(DEFAULT_MEDICOS));
                }
                localStorage.setItem(STORAGE_KEYS.MEDICOS, JSON.stringify(medicosList));
            }

            // Eliminar menciones de 'Cirugía Ocular' si quedaron en registros existentes
            if (medicosRaw && (medicosRaw.includes('Cirugía Ocular') || medicosRaw.includes('cirugia ocular') || medicosRaw.includes('Cirugía'))) {
                medicosList.forEach(m => {
                    if (m.especialidad) {
                        m.especialidad = m.especialidad.replace(/\s*\/\s*Cirugía\s+Ocular/gi, '').replace(/Cirugía\s+Ocular/gi, '').trim() || 'Oftalmología';
                    }
                });
                localStorage.setItem(STORAGE_KEYS.MEDICOS, JSON.stringify(medicosList));
            }

            // Limpiar placeholder 'Especialista Oftalmólogo' si existe en localStorage
            if (medicosRaw && (medicosRaw.includes('Especialista') || medicosRaw.includes('Oftalmólogo'))) {
                let changed = false;
                medicosList.forEach(m => {
                    if ((m.nombre === 'Especialista' && (m.apellido === 'Oftalmólogo' || m.apellido === 'Oftalmologo')) || 
                        (m.nombre === 'Dr. Especialista' && (m.apellido === 'Oftalmólogo' || m.apellido === 'Oftalmologo'))) {
                        m.nombre = '';
                        m.apellido = '';
                        changed = true;
                    }
                });
                if (changed) {
                    localStorage.setItem(STORAGE_KEYS.MEDICOS, JSON.stringify(medicosList));
                }
            }

            if (!Array.isArray(medicosList) || medicosList.length === 0) {
                localStorage.setItem(STORAGE_KEYS.MEDICOS, JSON.stringify(DEFAULT_MEDICOS));
                localStorage.setItem(STORAGE_KEYS.MEDICO_ACTIVO, 'med_principal');
            } else {
                const curActivo = localStorage.getItem(STORAGE_KEYS.MEDICO_ACTIVO);
                if (!curActivo || curActivo === 'med_juan_loreto' || !medicosList.some(m => m.id === curActivo)) {
                    localStorage.setItem(STORAGE_KEYS.MEDICO_ACTIVO, medicosList[0].id);
                }
            }
        } catch (e) {
            localStorage.setItem(STORAGE_KEYS.MEDICOS, JSON.stringify(DEFAULT_MEDICOS));
            localStorage.setItem(STORAGE_KEYS.MEDICO_ACTIVO, 'med_principal');
        }

        // Limpieza de tasa estática antigua si existía guardada previamente
        try {
            const cfgRaw = localStorage.getItem(STORAGE_KEYS.CONFIG);
            if (cfgRaw) {
                const parsed = JSON.parse(cfgRaw);
                if (parsed) {
                    const f = (parsed.tasa_fecha || '').toLowerCase();
                    if (!parsed.tasa_fecha || f.includes('15') || f.includes('septiembre') || f.includes('sep')) {
                        parsed.tasa_fecha = getFechaEspanolActual();
                        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(parsed));
                    }
                }
            }
        } catch (e) {
            console.warn('Error en migración de fecha tasa:', e);
        }

        // Migración: limpiar catálogo de medicamentos si contiene entradas obsoletas
        try {
            const catRaw = localStorage.getItem('optica_catalogo_medicamentos');
            if (catRaw) {
                const parsed = JSON.parse(catRaw);
                // Si tiene más de 16 entradas (versión vieja con Nafazolina, Dorzolamida, etc.) → resetear
                if (Array.isArray(parsed) && parsed.length > 16) {
                    localStorage.removeItem('optica_catalogo_medicamentos');
                }
            }
        } catch (e) {}
    }

    // =========================================================================
    // CONFIGURACIÓN & TASAS
    // =========================================================================
    getConfig() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
            const cfg = data ? { ...DEFAULT_CONFIG, ...JSON.parse(data) } : { ...DEFAULT_CONFIG };
            if (!cfg.tasa_fecha || (typeof cfg.tasa_fecha === 'string' && (cfg.tasa_fecha.toLowerCase().includes('15') && cfg.tasa_fecha.toLowerCase().includes('sep')))) {
                cfg.tasa_fecha = getFechaEspanolActual();
            }
            return cfg;
        } catch (e) {
            return { ...DEFAULT_CONFIG };
        }
    }

    saveConfig(config) {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    }

    updateTasaCambio(nuevaTasa, fechaTasa = '') {
        const cfg = this.getConfig();
        const num = parseFloat(nuevaTasa);
        if (num > 0) {
            cfg.tasa_usd_ves = num;
            cfg.tasa_fecha = (fechaTasa && fechaTasa.trim()) ? fechaTasa.trim() : getFechaEspanolActual();
            this.saveConfig(cfg);
            return true;
        }
        return false;
    }

    formatearFecha(date) {
        return getFechaEspanolActual(date);
    }

    // =========================================================================
    // PACIENTE 360
    // =========================================================================
    getPacientes(sedeFiltro) {
        try {
            const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.PACIENTES)) || [];
            if (!sedeFiltro || sedeFiltro === 'todas') return list;
            return list.filter(item => item.sede === sedeFiltro);
        } catch (e) {
            return [];
        }
    }

    savePacientes(pacientes) {
        localStorage.setItem(STORAGE_KEYS.PACIENTES, JSON.stringify(pacientes));
    }

    getPacienteById(id) {
        if (!id) return null;
        const list = this.getPacientes();
        return list.find(p => p.id === id) || null;
    }

    getPacienteByCedula(cedula) {
        if (!cedula) return null;
        const clean = cedula.toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const list = this.getPacientes();
        return list.find(p => {
            const c = (p.cedula || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return c === clean || c.endsWith(clean) || clean.endsWith(c);
        }) || null;
    }

    crearOActualizarPaciente(data) {
        const list = this.getPacientes();
        const now = new Date().toISOString();

        if (data.id) {
            const idx = list.findIndex(p => p.id === data.id);
            if (idx !== -1) {
                list[idx] = {
                    ...list[idx],
                    ...data,
                    updated_at: now
                };
                this.savePacientes(list);
                return list[idx];
            }
        }

        // Si ya existe un paciente con la misma cédula, actualizarlo en vez de duplicarlo
        if (data.cedula) {
            const cleanNew = data.cedula.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const existingIdx = list.findIndex(p => {
                const c = (p.cedula || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                return c && c === cleanNew;
            });
            if (existingIdx !== -1) {
                list[existingIdx] = {
                    ...list[existingIdx],
                    ...data,
                    id: list[existingIdx].id,
                    updated_at: now
                };
                this.savePacientes(list);
                return list[existingIdx];
            }
        }

        const newId = 'PAC-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
        const newPaciente = {
            id: newId,
            cedula: data.cedula || '',
            nombre: data.nombre || '',
            apellido: data.apellido || '',
            telefono: data.telefono || '',
            whatsapp: (data.whatsapp || data.telefono || '').replace(/\D/g, ''),
            email: data.email || '',
            sexo: data.sexo || 'M',
            fecha_nacimiento: data.fecha_nacimiento || '',
            edad: data.edad || '',
            ocupacion: data.ocupacion || '',
            direccion: data.direccion || '',
            sede: data.sede || 'Maracay',
            alergias: data.alergias || '',
            antecedentes: data.antecedentes || '',
            notas_clinicas: data.notas_clinicas || '',
            formula: data.formula || {
                od_esfera: '', od_cilindro: '', od_eje: '', od_adicion: '', od_av: '20/20',
                os_esfera: '', os_cilindro: '', os_eje: '', os_adicion: '', os_av: '20/20',
                dp: '', alt: '', tipo_lente: 'Monofocal', material: 'CR-39', tratamientos: []
            },
            created_at: now,
            updated_at: now
        };

        list.unshift(newPaciente);
        this.savePacientes(list);
        return newPaciente;
    }

    getFicha360(pacienteId) {
        const paciente = this.getPacienteById(pacienteId);
        if (!paciente) return null;

        const recibos = this.getRecibos().filter(r => r.paciente_id === pacienteId);
        const laboratorio = this.getOrdenesLaboratorio().filter(o => o.paciente_id === pacienteId);
        const recipes = this.getRecipes().filter(r => r.paciente_id === pacienteId);
        const informes = this.getInformes().filter(i => i.paciente_id === pacienteId);
        const citas = this.getCitas().filter(c => c.paciente_id === pacienteId || (c.cedula && c.cedula === paciente.cedula));
        const consultas = this.getConsultas().filter(c => c.paciente_id === pacienteId || (c.paciente_cedula && c.paciente_cedula === paciente.cedula));

        return {
            paciente,
            recibos,
            laboratorio,
            recipes,
            informes,
            citas,
            consultas,
            total_compras_usd: recibos.reduce((acc, r) => acc + (parseFloat(r.total_usd) || 0), 0),
            saldo_pendiente_usd: recibos.reduce((acc, r) => acc + (parseFloat(r.saldo_pendiente_usd) || 0), 0)
        };
    }

    // =========================================================================
    // VENTAS & RECIBOS REALES CON CORRELATIVO
    // =========================================================================
    getRecibos(sedeFiltro) {
        try {
            const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECIBOS)) || [];
            if (!sedeFiltro || sedeFiltro === 'todas') return list;
            return list.filter(item => item.sede === sedeFiltro);
        } catch (e) {
            return [];
        }
    }

    saveRecibos(recibos) {
        localStorage.setItem(STORAGE_KEYS.RECIBOS, JSON.stringify(recibos));
    }

    getReciboById(id) {
        return this.getRecibos().find(r => r.id === id) || null;
    }

    getSiguienteCorrelativo() {
        const recibos = this.getRecibos();
        const year = new Date().getFullYear();
        let maxSeq = 0;
        recibos.forEach(r => {
            if (r.correlativo && typeof r.correlativo === 'number') {
                if (r.correlativo > maxSeq) maxSeq = r.correlativo;
            }
        });
        const nextSeq = maxSeq + 1;
        const code = `REC-${year}-${String(nextSeq).padStart(4, '0')}`;
        return { nextSeq, code };
    }

    crearVentaYRecibo(data) {
        const config = this.getConfig();
        const { nextSeq, code } = this.getSiguienteCorrelativo();
        const now = new Date();
        const fechaStr = now.toLocaleDateString('es-VE', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
                         now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });

        const subtotal = parseFloat(data.subtotal_usd) || 0;
        const descuento = parseFloat(data.descuento_usd) || 0;
        const totalUsd = Math.max(0, subtotal - descuento);
        const tasa = parseFloat(data.tasa_cambio) || config.tasa_usd_ves;
        const totalVes = Math.round(totalUsd * tasa * 100) / 100;

        const pagos = Array.isArray(data.pagos) ? data.pagos : [];
        let pagadoUsd = 0;
        pagos.forEach(p => {
            if (p.moneda === 'USD') {
                pagadoUsd += parseFloat(p.monto) || 0;
            } else if (p.moneda === 'VES') {
                const montoVes = parseFloat(p.monto) || 0;
                pagadoUsd += Math.round((montoVes / tasa) * 100) / 100;
            }
        });

        pagadoUsd = Math.min(totalUsd, Math.round(pagadoUsd * 100) / 100);
        const saldoPendienteUsd = Math.max(0, Math.round((totalUsd - pagadoUsd) * 100) / 100);
        const saldoPendienteVes = Math.round(saldoPendienteUsd * tasa * 100) / 100;
        const estadoPago = saldoPendienteUsd <= 0.01 ? 'PAGADO' : 'ABONO_PENDIENTE';

        const nuevoRecibo = {
            id: code,
            correlativo: nextSeq,
            fecha: fechaStr,
            fecha_iso: now.toISOString(),
            paciente_id: data.paciente_id,
            paciente_nombre: data.paciente_nombre,
            paciente_cedula: data.paciente_cedula,
            paciente_telefono: data.paciente_telefono,
            sede: data.sede || 'Maracay',
            optometrista: data.optometrista || config.medico_director,
            items: data.items || [],
            formula_prescripcion: data.formula_prescripcion || null,
            tasa_cambio: tasa,
            subtotal_usd: subtotal,
            descuento_usd: descuento,
            total_usd: totalUsd,
            total_ves: totalVes,
            pagos: pagos,
            pagado_usd: pagadoUsd,
            saldo_pendiente_usd: saldoPendienteUsd,
            saldo_pendiente_ves: saldoPendienteVes,
            estado_pago: estadoPago,
            garantia_dias: config.garantia_dias,
            notas: data.notas || '',
            orden_laboratorio_id: null
        };

        const tieneLentes = (nuevoRecibo.items || []).some(item => 
            item.tipo === 'cristales' || item.tipo === 'montura' || item.tipo === 'completo'
        );

        if (tieneLentes) {
            const ordenLab = this.crearOrdenLaboratorio({
                recibo_id: nuevoRecibo.id,
                paciente_id: nuevoRecibo.paciente_id,
                paciente_nombre: nuevoRecibo.paciente_nombre,
                paciente_cedula: nuevoRecibo.paciente_cedula,
                paciente_telefono: nuevoRecibo.paciente_telefono,
                sede: nuevoRecibo.sede,
                formula: nuevoRecibo.formula_prescripcion,
                items: nuevoRecibo.items,
                notas: nuevoRecibo.notas
            });
            nuevoRecibo.orden_laboratorio_id = ordenLab.id;
        }

        const recibos = this.getRecibos();
        recibos.unshift(nuevoRecibo);
        this.saveRecibos(recibos);

        // Movimientos de caja
        pagos.forEach(p => {
            this.registrarMovimientoCaja({
                tipo: 'INGRESO',
                concepto: `Venta ${nuevoRecibo.id} - ${nuevoRecibo.paciente_nombre}`,
                monto_usd: p.moneda === 'USD' ? p.monto : (Math.round((p.monto / tasa) * 100) / 100),
                monto_ves: p.moneda === 'VES' ? p.monto : (Math.round((p.monto * tasa) * 100) / 100),
                metodo: p.metodo,
                referencia: p.referencia || nuevoRecibo.id,
                sede: nuevoRecibo.sede
            });
        });

        return nuevoRecibo;
    }

    registrarAbonoRecibo(reciboId, pagoData) {
        const recibos = this.getRecibos();
        const idx = recibos.findIndex(r => r.id === reciboId);
        if (idx === -1) return null;

        const recibo = recibos[idx];
        const tasa = recibo.tasa_cambio || this.getConfig().tasa_usd_ves;
        let montoUsd = 0;

        if (pagoData.moneda === 'USD') {
            montoUsd = parseFloat(pagoData.monto) || 0;
        } else {
            const montoVes = parseFloat(pagoData.monto) || 0;
            montoUsd = Math.round((montoVes / tasa) * 100) / 100;
        }

        recibo.pagos.push(pagoData);
        recibo.pagado_usd = Math.min(recibo.total_usd, Math.round((recibo.pagado_usd + montoUsd) * 100) / 100);
        recibo.saldo_pendiente_usd = Math.max(0, Math.round((recibo.total_usd - recibo.pagado_usd) * 100) / 100);
        recibo.saldo_pendiente_ves = Math.round(recibo.saldo_pendiente_usd * tasa * 100) / 100;
        if (recibo.saldo_pendiente_usd <= 0.01) {
            recibo.estado_pago = 'PAGADO';
        }

        recibos[idx] = recibo;
        this.saveRecibos(recibos);

        this.registrarMovimientoCaja({
            tipo: 'INGRESO',
            concepto: `Abono a Recibo ${recibo.id} - ${recibo.paciente_nombre}`,
            monto_usd: pagoData.moneda === 'USD' ? pagoData.monto : (Math.round((pagoData.monto / tasa) * 100) / 100),
            monto_ves: pagoData.moneda === 'VES' ? pagoData.monto : (Math.round((pagoData.monto * tasa) * 100) / 100),
            metodo: pagoData.metodo,
            referencia: pagoData.referencia || `Abono ${recibo.id}`,
            sede: recibo.sede
        });

        return recibo;
    }

    // =========================================================================
    // TALLER & LABORATORIO ÓPTICO
    // =========================================================================
    getOrdenesLaboratorio(sedeFiltro) {
        try {
            const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.LABORATORIO)) || [];
            if (!sedeFiltro || sedeFiltro === 'todas') return list;
            return list.filter(item => item.sede === sedeFiltro);
        } catch (e) {
            return [];
        }
    }

    saveOrdenesLaboratorio(ordenes) {
        localStorage.setItem(STORAGE_KEYS.LABORATORIO, JSON.stringify(ordenes));
    }

    crearOrdenLaboratorio(data) {
        const ordenes = this.getOrdenesLaboratorio();
        const year = new Date().getFullYear();
        const nextId = `LAB-${year}-${String(ordenes.length + 1).padStart(4, '0')}`;
        const now = new Date();
        const faseInicial = data.fase || 'FASE_1';
        
        const titulosFase = {
            FASE_1: 'Enviado al Laboratorio',
            FASE_2: 'En Proceso Laboratorio',
            FASE_3: 'Listo en Laboratorio',
            FASE_4: 'Listos para la Entrega',
            FASE_5: 'Entregado al Paciente'
        };

        const monturaDesc = data.montura || (data.items?.find(i => i.tipo === 'MONTURA')?.descripcion) || 'Montura del Paciente';
        const cristalesDesc = data.cristales || (data.items?.find(i => i.tipo === 'CRISTALES')?.descripcion) || 'Cristales Oftálmicos';

        const nuevaOrden = {
            id: nextId,
            recibo_id: data.recibo_id || 'ASIG-DIRECTA',
            paciente_id: data.paciente_id,
            paciente_nombre: data.paciente_nombre,
            paciente_cedula: data.paciente_cedula,
            paciente_telefono: data.paciente_telefono,
            sede: data.sede || 'Maracay',
            montura: monturaDesc,
            cristales: cristalesDesc,
            fase: faseInicial,
            formula: data.formula || null,
            items: data.items || [],
            notas: data.notas || '',
            fecha_ingreso: now.toISOString(),
            fecha_promesa: data.fecha_promesa || new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            historial_fases: [
                {
                    fase: faseInicial,
                    titulo: titulosFase[faseInicial] || 'Fase Asignada',
                    fecha: now.toISOString(),
                    nota: data.notas || 'Orden ingresada o asignada en laboratorio óptico.'
                }
            ]
        };

        ordenes.unshift(nuevaOrden);
        this.saveOrdenesLaboratorio(ordenes);
        return nuevaOrden;
    }

    eliminarOrdenLaboratorio(ordenId) {
        let ordenes = this.getOrdenesLaboratorio();
        ordenes = ordenes.filter(o => o.id !== ordenId);
        this.saveOrdenesLaboratorio(ordenes);
        return true;
    }

    actualizarFaseLaboratorio(ordenId, nuevaFase, notaFase = '') {
        const ordenes = this.getOrdenesLaboratorio();
        const idx = ordenes.findIndex(o => o.id === ordenId);
        if (idx === -1) return null;

        const orden = ordenes[idx];
        orden.fase = nuevaFase;
        
        const titulosFase = {
            FASE_1: 'Enviado al Laboratorio',
            FASE_2: 'En Proceso Laboratorio',
            FASE_3: 'Listo en Laboratorio',
            FASE_4: 'Listos para la Entrega',
            FASE_5: 'Entregado al Paciente'
        };

        orden.historial_fases.push({
            fase: nuevaFase,
            titulo: titulosFase[nuevaFase] || nuevaFase,
            fecha: new Date().toISOString(),
            nota: notaFase || `Estado: ${titulosFase[nuevaFase] || nuevaFase}`
        });

        ordenes[idx] = orden;
        this.saveOrdenesLaboratorio(ordenes);
        return orden;
    }

    // =========================================================================
    // RÉCIPES MÉDICOS OFTALMOLÓGICOS (HOJA DUAL: LENTES + GOTAS)
    // =========================================================================
    getRecipes() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECIPES)) || [];
        } catch (e) {
            return [];
        }
    }

    saveRecipes(recipes) {
        localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
    }

    crearRecipe(data) {
        const list = this.getRecipes();
        const year = new Date().getFullYear();
        const nextId = `RCP-${year}-${String(list.length + 1).padStart(4, '0')}`;
        const now = new Date();

        const nuevoRecipe = {
            id: nextId,
            fecha: now.toLocaleDateString('es-VE'),
            fecha_iso: now.toISOString(),
            paciente_id: data.paciente_id || null,
            paciente_nombre: data.paciente_nombre,
            paciente_cedula: data.paciente_cedula,
            paciente_edad: data.paciente_edad || '',
            sede: data.sede || 'Maracay',
            medico_nombre: data.medico_nombre || (this.getMedicoActivo() ? `${this.getMedicoActivo().prefijo} ${this.getMedicoActivo().nombre} ${this.getMedicoActivo().apellido}`.trim() : 'Especialista No Asignado'),
            medico_colegio: data.medico_colegio || (this.getMedicoActivo() ? `C.M. ${this.getMedicoActivo().colegio} | M.P.P.S. ${this.getMedicoActivo().mpps}` : 'C.M. Pendiente | M.P.P.S. Pendiente'),
            medico_cedula: data.medico_cedula || (this.getMedicoActivo() ? this.getMedicoActivo().cedula : 'S/C'),
            // Mitad A: Refracción Óptica
            formula: data.formula || {},
            tipo_lente: data.tipo_lente || 'Monofocal',
            material: data.material || 'CR-39',
            tratamientos: data.tratamientos || [],
            uso_recomendado: data.uso_recomendado || 'Uso permanente para visión lejana y lectura',
            // Mitad B: Tratamiento Farmacológico (Gotas / Medicación)
            medicamentos: data.medicamentos || [],
            indicaciones_generales: data.indicaciones_generales || 'Control oftalmológico en 1 año.'
        };

        list.unshift(nuevoRecipe);
        this.saveRecipes(list);
        return nuevoRecipe;
    }

    getRecipeById(id) {
        return this.getRecipes().find(r => r.id === id) || null;
    }

    // =========================================================================
    // INFORMES MÉDICOS CLÍNICOS OFTALMOLÓGICOS
    // =========================================================================
    getInformes() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.INFORMES)) || [];
        } catch (e) {
            return [];
        }
    }

    saveInformes(informes) {
        localStorage.setItem(STORAGE_KEYS.INFORMES, JSON.stringify(informes));
    }

    crearInforme(data) {
        const list = this.getInformes();
        const year = new Date().getFullYear();
        const nextId = `INF-${year}-${String(list.length + 1).padStart(4, '0')}`;
        const now = new Date();

        const activoDoc = this.getMedicoActivo();
        const nuevoInforme = {
            id: nextId,
            fecha: now.toLocaleDateString('es-VE'),
            fecha_iso: now.toISOString(),
            paciente_id: data.paciente_id || null,
            paciente_nombre: data.paciente_nombre,
            paciente_cedula: data.paciente_cedula,
            paciente_edad: data.paciente_edad || '',
            paciente_sexo: data.paciente_sexo || 'M',
            sede: data.sede || 'Maracay',
            medico_nombre: data.medico_nombre || (activoDoc ? `${activoDoc.prefijo} ${activoDoc.nombre} ${activoDoc.apellido}`.trim() : 'Especialista No Asignado'),
            medico_colegio: data.medico_colegio || (activoDoc ? `C.M. ${activoDoc.colegio} | M.P.P.S. ${activoDoc.mpps}` : 'C.M. Pendiente | M.P.P.S. Pendiente'),
            medico_cedula: data.medico_cedula || (activoDoc ? activoDoc.cedula : 'S/C'),
            motivo_consulta: data.motivo_consulta || 'Evaluación Oftalmológica de Rutina',
            enfermedad_actual: data.enfermedad_actual || 'Paciente acude a control de rutina refiriendo disminución progresiva de agudeza visual.',
            antecedentes: data.antecedentes || 'Sin antecedentes quirúrgicos oculares ni patologías de base reportadas.',
            agudeza_visual_od: data.agudeza_visual_od || '20/20 cc',
            agudeza_visual_os: data.agudeza_visual_os || '20/20 cc',
            biomicroscopia: data.biomicroscopia || 'Párpados y anexos normales. Córnea transparente sin lesiones. Cámara anterior amplia y formada. Cristalino transparente.',
            presion_intraocular: data.presion_intraocular || 'OD: 14 mmHg / OS: 15 mmHg (Dentro de límites normales)',
            fondo_ojo: data.fondo_ojo || 'Papila de bordes netos y coloración normal. Excavación fisiológica 0.3. Vasos de calibre y trayecto conservados. Mácula brillante con reflejo foveal presente.',
            diagnostico: data.diagnostico || 'Vicio de Refracción (Astigmatismo Miópico Compuesto) en ambos ojos.',
            plan_conducta: data.plan_conducta || 'Prescripción de lentes correctores de uso continuo. Control en un (1) año.'
        };

        list.unshift(nuevoInforme);
        this.saveInformes(list);
        return nuevoInforme;
    }

    getInformeById(id) {
        return this.getInformes().find(i => i.id === id) || null;
    }

    // =========================================================================
    // CONSULTAS CLÍNICAS & HISTORIA OPTOMÉTRICA (ADMIN 2)
    // =========================================================================
    getConsultas(sedeFiltro) {
        try {
            const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSULTAS)) || [];
            if (!sedeFiltro || sedeFiltro === 'todas') return list;
            return list.filter(item => item.sede === sedeFiltro);
        } catch (e) {
            return [];
        }
    }

    saveConsultas(consultas) {
        localStorage.setItem(STORAGE_KEYS.CONSULTAS, JSON.stringify(consultas));
    }

    getConsultaById(id) {
        return this.getConsultas().find(c => c.id === id) || null;
    }

    getConsultasByPaciente(pacienteIdOCedula) {
        if (!pacienteIdOCedula) return [];
        const clean = pacienteIdOCedula.toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return this.getConsultas().filter(c => {
            const cId = (c.paciente_id || '').toLowerCase();
            const cCed = (c.paciente_cedula || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return cId === clean || cCed === clean || cCed.endsWith(clean) || clean.endsWith(cCed);
        });
    }

    crearConsulta(data) {
        const list = this.getConsultas();
        const year = new Date().getFullYear();
        const nextId = `CNS-${year}-${String(list.length + 1).padStart(4, '0')}`;
        const now = new Date();

        const nuevaConsulta = {
            id: nextId,
            fecha: now.toLocaleDateString('es-VE'),
            fecha_iso: now.toISOString(),
            paciente_id: data.paciente_id || null,
            paciente_nombre: data.paciente_nombre || '',
            paciente_cedula: data.paciente_cedula || '',
            paciente_edad: data.paciente_edad || '',
            paciente_sexo: data.paciente_sexo || 'M',
            paciente_telefono: data.paciente_telefono || '',
            sede: data.sede || 'Maracay',
            profesional: data.profesional || this.getConfig().medico_director,
            
            motivo_consulta: data.motivo_consulta || '',
            enfermedad_actual: data.enfermedad_actual || '',
            antecedentes_oculares: data.antecedentes_oculares || '',
            antecedentes_generales: data.antecedentes_generales || '',
            uso_lentes_previos: data.uso_lentes_previos || 'No',
            tiempo_uso_lentes: data.tiempo_uso_lentes || '',
            
            av_sin_correccion_od: data.av_sin_correccion_od || '20/20',
            av_sin_correccion_os: data.av_sin_correccion_os || '20/20',
            av_con_correccion_od: data.av_con_correccion_od || '',
            av_con_correccion_os: data.av_con_correccion_os || '',

            queratometria_od: data.queratometria_od || '',
            queratometria_os: data.queratometria_os || '',
            lensometria_od: data.lensometria_od || '',
            lensometria_os: data.lensometria_os || '',

            rx_obj_od_esfera: data.rx_obj_od_esfera || '',
            rx_obj_od_cilindro: data.rx_obj_od_cilindro || '',
            rx_obj_od_eje: data.rx_obj_od_eje || '',
            rx_obj_os_esfera: data.rx_obj_os_esfera || '',
            rx_obj_os_cilindro: data.rx_obj_os_cilindro || '',
            rx_obj_os_eje: data.rx_obj_os_eje || '',

            formula: {
                od_esfera: data.formula?.od_esfera || data.od_esfera || '',
                od_cilindro: data.formula?.od_cilindro || data.od_cilindro || '',
                od_eje: data.formula?.od_eje || data.od_eje || '',
                od_adicion: data.formula?.od_adicion || data.od_adicion || '',
                od_av: data.formula?.od_av || data.od_av || '20/20',
                os_esfera: data.formula?.os_esfera || data.os_esfera || '',
                os_cilindro: data.formula?.os_cilindro || data.os_cilindro || '',
                os_eje: data.formula?.os_eje || data.os_eje || '',
                os_adicion: data.formula?.os_adicion || data.os_adicion || '',
                os_av: data.formula?.os_av || data.os_av || '20/20',
                dp: data.formula?.dp || data.dp || '',
                alt: data.formula?.alt || data.alt || '',
                tipo_lente: data.formula?.tipo_lente || data.tipo_lente || 'Monofocal',
                material: data.formula?.material || data.material || 'CR-39',
                tratamientos: data.formula?.tratamientos || data.tratamientos || []
            },

            biomicroscopia: data.biomicroscopia || 'Sin alteraciones patológicas en polo anterior.',
            presion_intraocular: data.presion_intraocular || '',
            fondo_ojo: data.fondo_ojo || '',

            diagnostico_refractivo: data.diagnostico_refractivo || 'Emetropía',
            diagnostico_clinico: data.diagnostico_clinico || '',
            plan_conducta: data.plan_conducta || 'Corrección óptica y control en 1 año.',
            observaciones: data.observaciones || '',

            // Campos Extendidos Historia Médica Oftalmológica (PDF 2)
            antecedentes_personales: data.antecedentes_personales || '',
            antecedentes_oftalmologicos: data.antecedentes_oftalmologicos || '',
            antecedentes_familiares: data.antecedentes_familiares || '',
            
            avl_od: data.avl_od || '',
            avl_ph_od: data.avl_ph_od || '',
            avl_cc_od: data.avl_cc_od || '',
            avl_oi: data.avl_oi || '',
            avl_ph_oi: data.avl_ph_oi || '',
            avl_cc_oi: data.avl_cc_oi || '',

            avc_od: data.avc_od || '',
            avc_oi: data.avc_oi || '',

            rx_od_avl: data.rx_od_avl || '',
            rx_od_adicion: data.rx_od_adicion || '',
            rx_od_avc: data.rx_od_avc || '',
            rx_oi_avl: data.rx_oi_avl || '',
            rx_oi_adicion: data.rx_oi_adicion || '',
            rx_oi_avc: data.rx_oi_avc || '',

            refraccion_cicloplejica_od: data.refraccion_cicloplejica_od || '',
            refraccion_cicloplejica_oi: data.refraccion_cicloplejica_oi || '',
            balance_muscular: data.balance_muscular || '',

            biomicroscopia_od: data.biomicroscopia_od || '',
            biomicroscopia_oi: data.biomicroscopia_oi || '',

            pio_od: data.pio_od || '',
            pio_oi: data.pio_oi || '',

            fondo_od: data.fondo_od || '',
            fondo_oi: data.fondo_oi || '',

            impresion_diagnostica_1: data.impresion_diagnostica_1 || '',
            impresion_diagnostica_2: data.impresion_diagnostica_2 || '',
            impresion_diagnostica_3: data.impresion_diagnostica_3 || '',
            impresion_diagnostica_4: data.impresion_diagnostica_4 || '',
            impresion_diagnostica_5: data.impresion_diagnostica_5 || '',

            conducta_tratamiento: data.conducta_tratamiento || ''
        };

        list.unshift(nuevaConsulta);
        this.saveConsultas(list);

        if (data.paciente_id) {
            const paciente = this.getPacienteById(data.paciente_id);
            if (paciente) {
                this.actualizarPaciente(paciente.id, { formula: nuevaConsulta.formula });
            }
        } else if (data.paciente_cedula) {
            const paciente = this.getPacienteByCedula(data.paciente_cedula);
            if (paciente) {
                this.actualizarPaciente(paciente.id, { formula: nuevaConsulta.formula });
            }
        }

        return nuevaConsulta;
    }

    actualizarConsulta(id, data) {
        const list = this.getConsultas();
        const idx = list.findIndex(c => c.id === id);
        if (idx === -1) return null;
        list[idx] = { ...list[idx], ...data, updated_at: new Date().toISOString() };
        this.saveConsultas(list);
        return list[idx];
    }

    // =========================================================================
    // PLANTILLA 1: HISTORIAS OPTOMÉTRICAS (PDF 1)
    // =========================================================================
    getHistoriasOptometricas(pacienteId) {
        try {
            const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORIAS_OPTOMETRICAS)) || [];
            if (!pacienteId) return list;
            return list.filter(h => h.paciente_id === pacienteId || h.paciente_cedula === pacienteId);
        } catch (e) {
            return [];
        }
    }

    saveHistoriasOptometricas(list) {
        localStorage.setItem(STORAGE_KEYS.HISTORIAS_OPTOMETRICAS, JSON.stringify(list));
    }

    crearHistoriaOptometrica(data) {
        const list = this.getHistoriasOptometricas();
        const year = new Date().getFullYear();
        const nextId = `OPT-${year}-${String(list.length + 1).padStart(4, '0')}`;
        const now = new Date();

        const nuevaHistoria = {
            id: nextId,
            historia_nro: data.historia_nro || String(list.length + 1).padStart(4, '0'),
            fecha: now.toLocaleDateString('es-VE'),
            fecha_iso: now.toISOString(),
            paciente_id: data.paciente_id || null,
            paciente_nombre: data.paciente_nombre || '',
            paciente_cedula: data.paciente_cedula || '',
            paciente_edad: data.paciente_edad || '',
            paciente_fecha_nacimiento: data.paciente_fecha_nacimiento || '',
            paciente_telefono: data.paciente_telefono || '',
            paciente_ocupacion: data.paciente_ocupacion || '',
            paciente_direccion: data.paciente_direccion || '',
            sede: data.sede || 'Maracay',
            usuario_lentes: data.usuario_lentes || 'No',
            ant_hta: !!data.ant_hta,
            ant_dbt: !!data.ant_dbt,
            ant_glaucoma: !!data.ant_glaucoma,
            medicamento_actual: data.medicamento_actual || '',
            motivo_consulta: data.motivo_consulta || '',
            lensometria: data.lensometria || '',

            // Pruebas preliminares
            av_sc_od: data.av_sc_od || '',
            av_sc_oi: data.av_sc_oi || '',
            av_ph_od: data.av_ph_od || '',
            av_ph_oi: data.av_ph_oi || '',
            ppc: data.ppc || '',
            ppa: data.ppa || '',
            cover_test_unilateral_od: data.cover_test_unilateral_od || '',
            cover_test_unilateral_oi: data.cover_test_unilateral_oi || '',
            cover_test_alternantes_od: data.cover_test_alternantes_od || '',
            cover_test_alternantes_oi: data.cover_test_alternantes_oi || '',
            reflejo_pupilares: data.reflejo_pupilares || '',
            motilidad_ocular_od: data.motilidad_ocular_od || '',
            motilidad_ocular_oi: data.motilidad_ocular_oi || '',
            duocromo_od: data.duocromo_od || '',
            duocromo_oi: data.duocromo_oi || '',
            luces_worth: data.luces_worth || 'Fusión',

            // RX Definitivo
            rx_definitivo: {
                od_esfera: data.rx_definitivo?.od_esfera || data.od_esfera || '',
                od_cilindro: data.rx_definitivo?.od_cilindro || data.od_cilindro || '',
                od_add: data.rx_definitivo?.od_add || data.od_add || '',
                od_av_cc: data.rx_definitivo?.od_av_cc || data.od_av_cc || '',
                oi_esfera: data.rx_definitivo?.oi_esfera || data.oi_esfera || '',
                oi_cilindro: data.rx_definitivo?.oi_cilindro || data.oi_cilindro || '',
                oi_add: data.rx_definitivo?.oi_add || data.oi_add || '',
                oi_av_cc: data.rx_definitivo?.oi_av_cc || data.oi_av_cc || ''
            },

            observaciones: data.observaciones || '',
            oftalmoscopia: data.oftalmoscopia || '',
            biomicroscopia: data.biomicroscopia || ''
        };

        list.unshift(nuevaHistoria);
        this.saveHistoriasOptometricas(list);

        // Actualizar última fórmula del paciente si se especificó refracción
        if (data.paciente_id && (nuevaHistoria.rx_definitivo.od_esfera || nuevaHistoria.rx_definitivo.oi_esfera)) {
            const paciente = this.getPacienteById(data.paciente_id);
            if (paciente) {
                this.actualizarPaciente(paciente.id, { 
                    ultima_formula: {
                        od: { sph: nuevaHistoria.rx_definitivo.od_esfera, cyl: nuevaHistoria.rx_definitivo.od_cilindro, add: nuevaHistoria.rx_definitivo.od_add, av: nuevaHistoria.rx_definitivo.od_av_cc },
                        os: { sph: nuevaHistoria.rx_definitivo.oi_esfera, cyl: nuevaHistoria.rx_definitivo.oi_cilindro, add: nuevaHistoria.rx_definitivo.oi_add, av: nuevaHistoria.rx_definitivo.oi_av_cc }
                    }
                });
            }
        }

        return nuevaHistoria;
    }

    getHistoriaOptometricaById(id) {
        return this.getHistoriasOptometricas().find(h => h.id === id) || null;
    }

    // =========================================================================
    // PLANTILLA 3: FICHAS DE CONSULTA RÁPIDA (PDF 3)
    // =========================================================================
    getFichasConsulta(pacienteId) {
        try {
            const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.FICHAS_CONSULTA)) || [];
            if (!pacienteId) return list;
            return list.filter(f => f.paciente_id === pacienteId || f.paciente_cedula === pacienteId);
        } catch (e) {
            return [];
        }
    }

    saveFichasConsulta(list) {
        localStorage.setItem(STORAGE_KEYS.FICHAS_CONSULTA, JSON.stringify(list));
    }

    crearFichaConsulta(data) {
        const list = this.getFichasConsulta();
        const year = new Date().getFullYear();
        const nextId = `FCH-${year}-${String(list.length + 1).padStart(4, '0')}`;
        const now = new Date();

        const nuevaFicha = {
            id: nextId,
            fecha: now.toLocaleDateString('es-VE'),
            fecha_iso: now.toISOString(),
            paciente_id: data.paciente_id || null,
            paciente_nombre: data.paciente_nombre || '',
            paciente_cedula: data.paciente_cedula || '',
            sede: data.sede || 'Maracay',
            
            // Refracción rápida
            der_esf: data.der_esf || '',
            der_cil: data.der_cil || '',
            der_eje: data.der_eje || '',
            der_add: data.der_add || '',
            
            izq_esf: data.izq_esf || '',
            izq_cil: data.izq_cil || '',
            izq_eje: data.izq_eje || '',
            izq_add: data.izq_add || '',

            observacion: data.observacion || '',
            doctor_1: data.doctor_1 || (this.getMedicoActivo() ? `${this.getMedicoActivo().prefijo} ${this.getMedicoActivo().nombre} ${this.getMedicoActivo().apellido}` : ''),
            doctor_2: data.doctor_2 || ''
        };

        list.unshift(nuevaFicha);
        this.saveFichasConsulta(list);
        return nuevaFicha;
    }

    getFichaConsultaById(id) {
        return this.getFichasConsulta().find(f => f.id === id) || null;
    }

    // =========================================================================
    // CAJA DIARIA & ARQUEO MULTIMONEDA
    // =========================================================================
    getMovimientosCaja() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CAJA)) || [];
        } catch (e) {
            return [];
        }
    }

    saveMovimientosCaja(movimientos) {
        localStorage.setItem(STORAGE_KEYS.CAJA, JSON.stringify(movimientos));
    }

    registrarMovimientoCaja(data) {
        const list = this.getMovimientosCaja();
        const now = new Date();
        const fechaStr = now.toLocaleDateString('es-VE') + ' ' + now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

        const nuevoMov = {
            id: 'MOV-' + Date.now().toString(36).toUpperCase(),
            fecha: fechaStr,
            fecha_iso: now.toISOString(),
            tipo: data.tipo || 'INGRESO',
            concepto: data.concepto || 'Movimiento de caja',
            monto_usd: parseFloat(data.monto_usd) || 0,
            monto_ves: parseFloat(data.monto_ves) || 0,
            metodo: data.metodo || 'efectivo_usd',
            referencia: data.referencia || '',
            sede: data.sede || 'Maracay'
        };

        list.unshift(nuevoMov);
        this.saveMovimientosCaja(list);
        return nuevoMov;
    }

    getResumenCajaHoy(sedeFiltro = 'todas') {
        const movimientos = this.getMovimientosCaja();
        const hoy = new Date().toISOString().split('T')[0];

        let efectivoUsd = 0;
        let pagoMovilVes = 0;
        let puntoVentaVes = 0;
        let zelleUsd = 0;
        let otrosUsd = 0;
        let casheaUsd = 0;
        let totalIngresosUsd = 0;
        let totalEgresosUsd = 0;

        const movsHoy = movimientos.filter(m => {
            const fechaMov = (m.fecha_iso || '').split('T')[0];
            const coincideFecha = (fechaMov === hoy);
            const coincideSede = (sedeFiltro === 'todas' || m.sede === sedeFiltro);
            return coincideFecha && coincideSede;
        });

        movsHoy.forEach(m => {
            const factor = (m.tipo === 'EGRESO') ? -1 : 1;
            const usd = (parseFloat(m.monto_usd) || 0) * factor;
            const ves = (parseFloat(m.monto_ves) || 0) * factor;

            if (m.tipo === 'INGRESO') totalIngresosUsd += parseFloat(m.monto_usd) || 0;
            if (m.tipo === 'EGRESO') totalEgresosUsd += parseFloat(m.monto_usd) || 0;

            switch (m.metodo) {
                case 'efectivo_usd': efectivoUsd += usd; break;
                case 'pago_movil': pagoMovilVes += ves; break;
                case 'punto_venta': puntoVentaVes += ves; break;
                case 'zelle': zelleUsd += usd; break;
                case 'cashea': casheaUsd += usd; break;
                default: otrosUsd += usd; break;
            }
        });

        return {
            fecha: hoy,
            sede: sedeFiltro,
            movimientos_hoy: movsHoy,
            efectivo_usd: Math.round(efectivoUsd * 100) / 100,
            pago_movil_ves: Math.round(pagoMovilVes * 100) / 100,
            punto_venta_ves: Math.round(puntoVentaVes * 100) / 100,
            zelle_usd: Math.round(zelleUsd * 100) / 100,
            otros_usd: Math.round(otrosUsd * 100) / 100,
            cashea_usd: Math.round(casheaUsd * 100) / 100,
            total_ingresos_usd: Math.round(totalIngresosUsd * 100) / 100,
            total_egresos_usd: Math.round(totalEgresosUsd * 100) / 100,
            balance_neto_usd: Math.round((totalIngresosUsd - totalEgresosUsd) * 100) / 100
        };
    }

    // =========================================================================
    // AGENDA DE CITAS
    // =========================================================================
    getCitas() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CITAS)) || [];
        } catch (e) {
            return [];
        }
    }

    saveCitas(citas) {
        localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify(citas));
    }

    crearCita(data) {
        const citas = this.getCitas();
        const now = new Date();

        const nuevaCita = {
            id: 'CITA-' + Date.now().toString(36).toUpperCase(),
            paciente_id: data.paciente_id || null,
            nombre: data.nombre || '',
            cedula: data.cedula || '',
            telefono: data.telefono || '',
            sede: data.sede || 'Maracay',
            fecha: data.fecha || now.toISOString().split('T')[0],
            hora: data.hora || '09:00 AM',
            motivo: data.motivo || 'Examen Visual',
            estado: data.estado || 'PENDIENTE',
            created_at: now.toISOString()
        };

        citas.unshift(nuevaCita);
        this.saveCitas(citas);

        if (data.cedula && !this.getPacienteByCedula(data.cedula)) {
            const parts = (data.nombre || '').trim().split(' ');
            const nom = parts[0] || 'Paciente';
            const ape = parts.slice(1).join(' ') || '';
            this.crearOActualizarPaciente({
                cedula: data.cedula,
                nombre: nom,
                apellido: ape,
                telefono: data.telefono,
                sede: data.sede
            });
        }

        return nuevaCita;
    }

    registrarCita(data) {
        return this.crearCita(data);
    }

    actualizarEstadoCita(citaId, nuevoEstado) {
        const citas = this.getCitas();
        const idx = citas.findIndex(c => c.id === citaId);
        if (idx !== -1) {
            citas[idx].estado = nuevoEstado;
            this.saveCitas(citas);
            return citas[idx];
        }
        return null;
    }

    // =========================================================================
    // SERVICIO PÚBLICO PARA INDEX.HTML (RASTREADOR DE LENTES)
    // =========================================================================
    consultarEstatusLentesPorCedula(cedula) {
        if (!cedula) return null;
        const clean = cedula.toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        const ordenes = this.getOrdenesLaboratorio();
        const orden = ordenes.find(o => {
            const c = (o.paciente_cedula || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return c === clean || c.endsWith(clean) || clean.endsWith(c);
        });

        if (orden) {
            let activePhaseIndex = 0;
            if (orden.fase === 'FASE_5') activePhaseIndex = 4;
            else if (orden.fase === 'FASE_4') activePhaseIndex = 3;
            else if (orden.fase === 'FASE_3') activePhaseIndex = 2;
            else if (orden.fase === 'FASE_2') activePhaseIndex = 1;
            else activePhaseIndex = 0;

            return {
                encontrado: true,
                orden_id: orden.id,
                recibo_id: orden.recibo_id,
                paciente_nombre: orden.paciente_nombre,
                paciente_cedula: orden.paciente_cedula,
                sede: orden.sede,
                fase: orden.fase,
                activePhaseIndex: activePhaseIndex,
                fecha_promesa: orden.fecha_promesa,
                historial_fases: orden.historial_fases
            };
        }

        const paciente = this.getPacienteByCedula(cedula);
        if (paciente) {
            return {
                encontrado: true,
                orden_id: null,
                recibo_id: null,
                paciente_nombre: `${paciente.nombre} ${paciente.apellido}`.trim(),
                paciente_cedula: paciente.cedula,
                sede: paciente.sede,
                fase: 'FASE_1',
                activePhaseIndex: 0,
                fecha_promesa: 'Pendiente de consulta',
                historial_fases: [
                    {
                        fase: 'FASE_1',
                        titulo: 'Registro Clínico Inicial',
                        fecha: paciente.created_at,
                        nota: 'Paciente registrado en sistema.'
                    }
                ]
            };
        }

        return { encontrado: false };
    }

    // =========================================================================
    // KPIS GENERALES
    // =========================================================================
    getDashboardStats() {
        const pacientes = this.getPacientes();
        const recibos = this.getRecibos();
        const ordenes = this.getOrdenesLaboratorio();
        const recipes = this.getRecipes();
        const informes = this.getInformes();
        const citas = this.getCitas();
        const hoy = new Date().toISOString().split('T')[0];

        const ventasTotalUsd = recibos.reduce((acc, r) => acc + (parseFloat(r.total_usd) || 0), 0);
        const ventasHoyUsd = recibos
            .filter(r => (r.fecha_iso || '').split('T')[0] === hoy)
            .reduce((acc, r) => acc + (parseFloat(r.total_usd) || 0), 0);
        const cobradoTotalUsd = recibos.reduce((acc, r) => acc + (parseFloat(r.pagado_usd) || 0), 0);
        const cuentasPorCobrarUsd = recibos.reduce((acc, r) => acc + (parseFloat(r.saldo_pendiente_usd) || 0), 0);

        const ordenesEnTaller = ordenes.filter(o => ['FASE_1', 'FASE_2', 'FASE_3'].includes(o.fase)).length;
        const ordenesListasRetiro = ordenes.filter(o => o.fase === 'FASE_4').length;
        const citasPendientesHoy = citas.filter(c => c.fecha === hoy && c.estado === 'PENDIENTE').length;

        return {
            total_pacientes: pacientes.length,
            ventas_total_usd: Math.round(ventasTotalUsd * 100) / 100,
            ventas_hoy_usd: Math.round(ventasHoyUsd * 100) / 100,
            cobrado_total_usd: Math.round(cobradoTotalUsd * 100) / 100,
            cuentas_por_cobrar_usd: Math.round(cuentasPorCobrarUsd * 100) / 100,
            ordenes_en_taller: ordenesEnTaller,
            ordenes_listas_retiro: ordenesListasRetiro,
            total_recipes: recipes.length,
            total_informes: informes.length,
            citas_pendientes_hoy: citasPendientesHoy,
            total_recibos: recibos.length
        };
    }

    // =========================================================================
    // GESTIÓN DE PERFILES MÉDICOS (MODO DOCTOR)
    // =========================================================================
    getMedicos() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.MEDICOS);
            let list = data ? JSON.parse(data) : [];

            // Limpiar datos antiguos de Juan Loreto si persistían en caché
            if (data && (data.includes('Loreto') || data.includes('med_juan_loreto'))) {
                list = list.filter(m => !m.id?.includes('loreto') && !m.apellido?.includes('Loreto'));
                if (list.length === 0) {
                    list = JSON.parse(JSON.stringify(DEFAULT_MEDICOS));
                }
                localStorage.setItem(STORAGE_KEYS.MEDICOS, JSON.stringify(list));
                localStorage.setItem(STORAGE_KEYS.MEDICO_ACTIVO, list[0].id);
            }

            if (Array.isArray(list) && list.length > 0) {
                return list;
            }

            // Si está vacío, sembrar inmediatamente Especialista Oftalmólogo por defecto
            const defaultDoctor = JSON.parse(JSON.stringify(DEFAULT_MEDICOS));
            localStorage.setItem(STORAGE_KEYS.MEDICOS, JSON.stringify(defaultDoctor));
            localStorage.setItem(STORAGE_KEYS.MEDICO_ACTIVO, defaultDoctor[0].id);
            return defaultDoctor;
        } catch (e) {
            return JSON.parse(JSON.stringify(DEFAULT_MEDICOS));
        }
    }

    saveMedicos(medicos) {
        localStorage.setItem(STORAGE_KEYS.MEDICOS, JSON.stringify(medicos));
    }

    getMedicoById(id) {
        if (!id) return null;
        const list = this.getMedicos();
        return list.find(m => m.id === id) || null;
    }

    getMedicoActivo() {
        const list = this.getMedicos();
        if (!Array.isArray(list) || list.length === 0) return null;
        const activoId = localStorage.getItem(STORAGE_KEYS.MEDICO_ACTIVO);
        const med = list.find(m => m.id === activoId);
        if (med) return med;
        this.setMedicoActivoId(list[0].id);
        return list[0];
    }

    setMedicoActivoId(id) {
        if (id) {
            localStorage.setItem(STORAGE_KEYS.MEDICO_ACTIVO, id);
        } else {
            localStorage.removeItem(STORAGE_KEYS.MEDICO_ACTIVO);
        }
    }

    crearOActualizarMedico(data) {
        const list = this.getMedicos();
        const id = data.id || `med_${Date.now()}`;
        const nuevo = {
            id: id,
            prefijo: (data.prefijo === 'Dra.' || data.prefijo === 'Dra') ? 'Dra.' : 'Dr.',
            nombre: (data.nombre || '').trim(),
            apellido: (data.apellido || '').trim(),
            especialidad: (data.especialidad || 'Oftalmología').trim(),
            cedula: (data.cedula || '').trim(),
            mpps: (data.mpps || '').trim(),
            colegio: (data.colegio || '').trim(),
            telefono: (data.telefono || '').trim(),
            email: (data.email || '').trim()
        };

        const idx = list.findIndex(m => m.id === id);
        if (idx !== -1) {
            list[idx] = nuevo;
        } else {
            list.push(nuevo);
        }

        this.saveMedicos(list);
        this.setMedicoActivoId(id);

        // Sincronizar con el director médico de la configuración si es el primero
        const cfg = this.getConfig();
        if (!cfg.medico_director || list.length === 1) {
            cfg.medico_director = `${nuevo.prefijo} ${nuevo.nombre} ${nuevo.apellido}`.trim();
            cfg.medico_colegio = nuevo.colegio || nuevo.mpps ? `C.M. ${nuevo.colegio || '--'} | M.P.P.S. ${nuevo.mpps || '--'}` : '';
            this.saveConfig(cfg);
        }

        return nuevo;
    }

    // =========================================================================
    // CATÁLOGO DE MEDICAMENTOS & FARMACOLOGÍA
    // =========================================================================
    getCatalogoMedicamentos() {
        const stored = localStorage.getItem('optica_catalogo_medicamentos') || localStorage.getItem('liteMedicVademecum');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) {}
        }

        // Catálogo de medicamentos esenciales
        const predeterminado = [
            // — Lubricación ocular —
            { id: "v1", nombre: "Lágrimas Artificiales (Hialuronato de Sodio 0.4%) colirio", indicacion: "Instilar 1 gota en cada ojo cada 4 a 6 horas según necesidad." },
            { id: "v2", nombre: "Carboximetilcelulosa 0.5% colirio lubricante", indicacion: "Instilar 1 gota en ambos ojos cada 6 a 8 horas." },
            // — Antibióticos oftálmicos —
            { id: "v3", nombre: "Tobramicina 0.3% + Dexametasona 0.1% suspensión oftálmica", indicacion: "Instilar 1 gota en ojo afectado cada 6 horas por 7 días. Agitar antes de usar." },
            { id: "v4", nombre: "Ciprofloxacino 0.3% solución oftálmica", indicacion: "Aplicar 1 gota en ojo afectado cada 4 a 6 horas por 7 días." },
            { id: "v5", nombre: "Moxifloxacino 0.5% gotas oftálmicas", indicacion: "Instilar 1 gota en ojo afectado cada 8 horas por 7 días." },
            // — Antiinflamatorio / Antialérgico ocular —
            { id: "v6", nombre: "Ketorolaco Trometamina 0.5% colirio antiinflamatorio", indicacion: "Aplicar 1 gota cada 6 a 8 horas por 7 días." },
            { id: "v7", nombre: "Olopatadina 0.2% solución oftálmica antialérgica", indicacion: "Aplicar 1 gota en cada ojo una vez al día (mañana)." },
            { id: "v8", nombre: "Prednisolona Acetato 1% suspensión oftálmica", indicacion: "Instilar 1 gota cada 4 a 6 horas por 7 días con retiro progresivo." },
            // — Hipertensión ocular —
            { id: "v9", nombre: "Timolol 0.5% solución oftálmica", indicacion: "Instilar 1 gota en ojo afectado cada 12 horas." },
            { id: "v10", nombre: "Brimonidina 0.2% colirio antiglaucomatoso", indicacion: "Instilar 1 gota en ojo afectado cada 8 a 12 horas." },
            // — Suplemento ocular —
            { id: "v11", nombre: "Luteína 20 mg + Zeaxantina complejo antioxidante", indicacion: "Tomar 1 cápsula vía oral diaria con el almuerzo." },
            // — Básicos sistémicos —
            { id: "v12", nombre: "Acetaminofén (Paracetamol) 500 mg tabletas", indicacion: "Tomar 1 tableta vía oral cada 6 u 8 horas ante dolor o cefalea (máx. 5 días)." },
            { id: "v13", nombre: "Ibuprofeno 400 mg tabletas", indicacion: "Tomar 1 tableta vía oral cada 8 horas con alimentos ante dolor o inflamación." },
            { id: "v14", nombre: "Amoxicilina 500 mg cápsulas", indicacion: "Tomar 1 cápsula vía oral cada 8 horas por 7 días. Completar tratamiento." },
            { id: "v15", nombre: "Omeprazol 20 mg cápsulas", indicacion: "Tomar 1 cápsula vía oral en ayunas 30 min antes del desayuno por 14 días." },
            { id: "v16", nombre: "Vitamina C 500 mg tabletas", indicacion: "Tomar 1 tableta diaria en la mañana por 30 días." }
        ];
        localStorage.setItem('optica_catalogo_medicamentos', JSON.stringify(predeterminado));
        return predeterminado;
    }

    getVademecum() {
        return this.getCatalogoMedicamentos();
    }

    guardarMedicamentoEnCatalogo(med) {
        const catalogo = this.getCatalogoMedicamentos();
        if (med.id) {
            const idx = catalogo.findIndex(m => m.id === med.id);
            if (idx !== -1) {
                catalogo[idx] = { ...catalogo[idx], ...med };
            } else {
                catalogo.unshift(med);
            }
        } else {
            med.id = 'med_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
            catalogo.unshift(med);
        }
        localStorage.setItem('optica_catalogo_medicamentos', JSON.stringify(catalogo));
        return { success: true, item: med, catalogo };
    }

    eliminarMedicamentoDeCatalogo(id) {
        let catalogo = this.getCatalogoMedicamentos();
        catalogo = catalogo.filter(m => m.id !== id);
        localStorage.setItem('optica_catalogo_medicamentos', JSON.stringify(catalogo));
        return { success: true, catalogo };
    }

    eliminarMedico(id) {
        const list = this.getMedicos();
        if (list.length === 0) {
            return { success: false, message: 'No hay médicos registrados en el sistema.' };
        }

        const filtered = list.filter(m => m.id !== id);
        if (filtered.length === list.length) {
            return { success: false, message: 'Médico no encontrado.' };
        }

        this.saveMedicos(filtered);

        if (filtered.length === 0) {
            this.setMedicoActivoId(null);
            const cfg = this.getConfig();
            cfg.medico_director = '';
            cfg.medico_colegio = '';
            this.saveConfig(cfg);
            return { success: true, nuevoActivoId: null, medico: null };
        }

        const activoId = localStorage.getItem(STORAGE_KEYS.MEDICO_ACTIVO);
        let nuevoActivo = filtered[0];
        if (activoId === id) {
            this.setMedicoActivoId(nuevoActivo.id);
        } else {
            nuevoActivo = this.getMedicoActivo() || filtered[0];
        }

        const cfg = this.getConfig();
        if (nuevoActivo) {
            cfg.medico_director = `${nuevoActivo.prefijo} ${nuevoActivo.nombre} ${nuevoActivo.apellido}`.trim();
            cfg.medico_colegio = `C.M. ${nuevoActivo.colegio} | M.P.P.S. ${nuevoActivo.mpps}`;
            this.saveConfig(cfg);
        }

        return { success: true, nuevoActivoId: nuevoActivo.id, medico: nuevoActivo };
    }

    resetDatabase() {
        localStorage.setItem(STORAGE_KEYS.PACIENTES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.VENTAS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.RECIBOS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.LABORATORIO, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.INFORMES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CAJA, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CONSULTAS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
    }

    // =========================================================================
    // ALIAS Y MÉTODOS DE COMPATIBILIDAD (para admin.js y otros módulos)
    // =========================================================================

    registrarPaciente(data) {
        return this.crearOActualizarPaciente(data);
    }

    actualizarPaciente(id, data) {
        const list = this.getPacientes();
        const idx = list.findIndex(p => p.id === id);
        if (idx === -1) return null;
        const now = new Date().toISOString();
        list[idx] = { ...list[idx], ...data, updated_at: now };
        this.savePacientes(list);
        return list[idx];
    }

    registrarVenta(data) {
        return this.crearVentaYRecibo(data);
    }

    registrarOrdenLaboratorio(data) {
        return this.crearOrdenLaboratorio(data);
    }

    getHistorialCompletoPaciente(id) {
        return this.getFicha360(id);
    }

    // =========================================================================
    // MÓDULO DE INVENTARIO & CONTROL DE STOCK
    // =========================================================================
    getInventario(sedeFiltro, categoriaFiltro) {
        try {
            let list = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTARIO));
            if (!list || !Array.isArray(list) || list.length === 0) {
                list = (window.OPTICAL_PRODUCTS || []).map((p, idx) => ({
                    id: p.id || `MONT-${String(idx + 1).padStart(3, '0')}`,
                    sku: p.id || `SKU-${1000 + idx}`,
                    nombre: p.name,
                    categoria: 'Monturas',
                    marca: p.brand || 'Centro Óptico Nieves',
                    material: p.material || 'Acetato / Metal',
                    precio: p.price || 50,
                    stock: 12 - (idx % 8),
                    stock_minimo: 3,
                    sede: idx % 2 === 0 ? 'Maracay' : 'San Juan de los Morros',
                    updated_at: new Date().toISOString()
                }));
                list.push(
                    { id: 'CRIS-001', sku: 'CRIS-CR39', nombre: 'Cristales Monofocales CR-39 Orgánicos', categoria: 'Cristales', marca: 'Nieves Vision', material: 'CR-39', precio: 25.00, stock: 40, stock_minimo: 10, sede: 'Maracay', updated_at: new Date().toISOString() },
                    { id: 'CRIS-002', sku: 'CRIS-POLY', nombre: 'Cristales Policarbonato Alto Impacto', categoria: 'Cristales', marca: 'Nieves Vision', material: 'Policarbonato', precio: 35.00, stock: 30, stock_minimo: 8, sede: 'Maracay', updated_at: new Date().toISOString() },
                    { id: 'CRIS-003', sku: 'CRIS-156', nombre: 'Cristales Index 1.56 Blue Block', categoria: 'Cristales', marca: 'Nieves Vision', material: 'Index 1.56', precio: 45.00, stock: 25, stock_minimo: 5, sede: 'San Juan de los Morros', updated_at: new Date().toISOString() },
                    { id: 'CRIS-004', sku: 'CRIS-PROG', nombre: 'Cristales Progresivos Digitales FreeForm', categoria: 'Cristales', marca: 'Nieves Vision', material: 'Digital FreeForm', precio: 80.00, stock: 15, stock_minimo: 4, sede: 'Maracay', updated_at: new Date().toISOString() },
                    { id: 'ACC-001', sku: 'ACC-ESTUCHE', nombre: 'Estuche Rígido Ejecutivo con Paño Microfibra', categoria: 'Accesorios', marca: 'Centro Óptico Nieves', material: 'Piel Sintética', precio: 8.00, stock: 60, stock_minimo: 15, sede: 'Maracay', updated_at: new Date().toISOString() },
                    { id: 'ACC-002', sku: 'ACC-SPRAY', nombre: 'Solución Limpiadora Antiestática 60ml', categoria: 'Accesorios', marca: 'OptiClean', material: 'Líquido', precio: 5.00, stock: 50, stock_minimo: 10, sede: 'San Juan de los Morros', updated_at: new Date().toISOString() }
                );
                localStorage.setItem(STORAGE_KEYS.INVENTARIO, JSON.stringify(list));
            }
            if (sedeFiltro && sedeFiltro !== 'todas') {
                list = list.filter(item => item.sede === sedeFiltro);
            }
            if (categoriaFiltro && categoriaFiltro !== 'todas') {
                list = list.filter(item => item.categoria === categoriaFiltro);
            }
            return list;
        } catch (e) {
            return [];
        }
    }

    saveInventario(items) {
        localStorage.setItem(STORAGE_KEYS.INVENTARIO, JSON.stringify(items));
    }

    getProductoById(id) {
        if (!id) return null;
        const list = this.getInventario();
        return list.find(p => p.id === id) || null;
    }

    crearOActualizarProducto(data) {
        const list = this.getInventario();
        const now = new Date().toISOString();
        if (data.id) {
            const idx = list.findIndex(p => p.id === data.id);
            if (idx !== -1) {
                list[idx] = {
                    ...list[idx],
                    ...data,
                    foto: data.foto !== undefined ? data.foto : (list[idx].foto || ''),
                    precio: parseFloat(data.precio) || list[idx].precio,
                    stock: parseInt(data.stock, 10) !== undefined ? parseInt(data.stock, 10) : list[idx].stock,
                    stock_minimo: parseInt(data.stock_minimo, 10) !== undefined ? parseInt(data.stock_minimo, 10) : list[idx].stock_minimo,
                    updated_at: now
                };
                this.saveInventario(list);
                return list[idx];
            }
        }
        const nuevo = {
            id: data.id || `PROD-${Date.now().toString().slice(-6)}`,
            sku: data.sku || `SKU-${Date.now().toString().slice(-4)}`,
            foto: data.foto || '',
            nombre: data.nombre,
            categoria: data.categoria || 'Monturas',
            marca: data.marca || 'Centro Óptico Nieves',
            material: data.material || 'Estándar',
            precio: parseFloat(data.precio) || 0,
            stock: parseInt(data.stock, 10) || 0,
            stock_minimo: parseInt(data.stock_minimo, 10) || 3,
            sede: data.sede || 'Maracay',
            updated_at: now
        };
        list.unshift(nuevo);
        this.saveInventario(list);
        return nuevo;
    }

    // =========================================================================
    // CATEGORÍAS PERSONALIZABLES DE INVENTARIO
    // =========================================================================
    getCategoriasInventario() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIAS_INVENTARIO);
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr) && arr.length > 0) return arr;
            }
        } catch (e) {}
        const defaults = ['Monturas', 'Cristales', 'Accesorios', 'Lentes de Contacto', 'Estuches & Limpieza', 'Gotas & Soluciones'];
        localStorage.setItem(STORAGE_KEYS.CATEGORIAS_INVENTARIO, JSON.stringify(defaults));
        return defaults;
    }

    saveCategoriasInventario(cats) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIAS_INVENTARIO, JSON.stringify(cats));
    }

    agregarCategoriaInventario(nuevaCat) {
        const clean = (nuevaCat || '').trim();
        if (!clean) return false;
        const list = this.getCategoriasInventario();
        if (!list.some(c => c.toLowerCase() === clean.toLowerCase())) {
            list.push(clean);
            this.saveCategoriasInventario(list);
            return true;
        }
        return false;
    }

    eliminarCategoriaInventario(catAEliminar) {
        let list = this.getCategoriasInventario();
        list = list.filter(c => c.toLowerCase() !== (catAEliminar || '').trim().toLowerCase());
        this.saveCategoriasInventario(list);
        return true;
    }

    eliminarProducto(id) {
        let list = this.getInventario();
        list = list.filter(p => p.id !== id);
        this.saveInventario(list);
        return true;
    }

    descontarStockProducto(identificador, cantidad = 1) {
        if (!identificador) return null;
        const list = this.getInventario();
        const clean = identificador.toString().trim().toLowerCase();
        const idx = list.findIndex(p => 
            (p.id && p.id.toLowerCase() === clean) ||
            (p.sku && p.sku.toLowerCase() === clean) ||
            (p.nombre && (p.nombre.toLowerCase() === clean || clean.includes(p.nombre.toLowerCase()) || p.nombre.toLowerCase().includes(clean)))
        );
        if (idx !== -1) {
            list[idx].stock = Math.max(0, (list[idx].stock || 0) - cantidad);
            list[idx].updated_at = new Date().toISOString();
            this.saveInventario(list);
            return list[idx];
        }
        return null;
    }

    // =========================================================================
    // PLANTILLAS PERSONALIZADAS DE WHATSAPP
    // =========================================================================
    getPlantillasWhatsApp() {
        const defaults = [
            {
                id: 'lentes_listos',
                titulo: 'Lentes Listos para Retiro',
                categoria: 'Laboratorio',
                texto: 'Estimado(a) {nombre}, le saludamos desde Centro Óptico Nieves. Le informamos con agrado que sus lentes ya se encuentran listos para ser retirados en nuestra sede de {sede}. Puede pasar en nuestro horario habitual de atención. Esperamos su grata visita.',
                esSistema: true
            },
            {
                id: 'cita_recordatorio',
                titulo: 'Recordatorio de Cita',
                categoria: 'Citas',
                texto: 'Estimado(a) {nombre}, le recordamos su cita pautada en Centro Óptico Nieves, sede {sede}. Por favor confírmenos su asistencia respondiendo a este mensaje para garantizar su turno con el especialista.',
                esSistema: true
            },
            {
                id: 'renovacion_cristales_8m',
                titulo: 'Renovación de Cristales (8 Meses)',
                categoria: 'Mantenimiento',
                texto: 'Estimado(a) {nombre}, en Centro Óptico Nieves nos preocupamos por su salud visual. Al cumplirse 8 meses con sus cristales actuales, le recomendamos una rápida revisión de confort visual y mantenimiento en nuestra sede de {sede}.',
                esSistema: true
            },
            {
                id: 'mantenimiento_montura',
                titulo: 'Ajuste de Montura (7 Meses)',
                categoria: 'Mantenimiento',
                texto: 'Hola {nombre}, le saludamos de Centro Óptico Nieves. Ya han transcurrido 7 meses desde la entrega de sus lentes. Le invitamos a pasar por nuestra sede de {sede} para realizar un mantenimiento y ajuste preventivo de sus monturas sin costo adicional.',
                esSistema: true
            },
            {
                id: 'control_anual',
                titulo: 'Control Anual Oftalmológico (1 Año)',
                categoria: 'Salud Visual',
                texto: 'Estimado(a) {nombre}, ha transcurrido 1 año desde su última evaluación oftalmológica en Centro Óptico Nieves. Para garantizar una visión óptima y cuidar su salud ocular, le recomendamos agendar su consulta de control anual en nuestra sede de {sede}.',
                esSistema: true
            }
        ];

        try {
            const raw = localStorage.getItem(STORAGE_KEYS.WA_PLANTILLAS_CUSTOM);
            const custom = raw ? JSON.parse(raw) : [];
            return [...defaults, ...custom];
        } catch (e) {
            console.error('Error al obtener plantillas de WhatsApp:', e);
            return defaults;
        }
    }

    guardarPlantillaWhatsApp(titulo, texto, categoria = 'Personalizado') {
        if (!titulo || !texto) return null;
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.WA_PLANTILLAS_CUSTOM);
            const custom = raw ? JSON.parse(raw) : [];
            const nueva = {
                id: 'custom_' + Date.now(),
                titulo: titulo.trim(),
                categoria: categoria.trim() || 'Personalizado',
                texto: texto.trim(),
                esSistema: false,
                created_at: new Date().toISOString()
            };
            custom.push(nueva);
            localStorage.setItem(STORAGE_KEYS.WA_PLANTILLAS_CUSTOM, JSON.stringify(custom));
            return nueva;
        } catch (e) {
            console.error('Error al guardar plantilla WhatsApp:', e);
            return null;
        }
    }

    eliminarPlantillaWhatsApp(id) {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.WA_PLANTILLAS_CUSTOM);
            let custom = raw ? JSON.parse(raw) : [];
            custom = custom.filter(p => p.id !== id);
            localStorage.setItem(STORAGE_KEYS.WA_PLANTILLAS_CUSTOM, JSON.stringify(custom));
            return true;
        } catch (e) {
            console.error('Error al eliminar plantilla WhatsApp:', e);
            return false;
        }
    }

    // =========================================================================
    // RECORDATORIOS Y MENSAJES PROGRAMADOS DE WHATSAPP
    // =========================================================================
    getRecordatoriosWhatsApp() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.WA_RECORDATORIOS);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Error al obtener recordatorios WhatsApp:', e);
            return [];
        }
    }

    guardarRecordatorioWhatsApp(datos) {
        try {
            const list = this.getRecordatoriosWhatsApp();
            const nuevo = {
                id: 'rec_' + Date.now(),
                pacienteId: datos.pacienteId || '',
                pacienteNombre: datos.pacienteNombre || 'Paciente',
                pacienteCedula: datos.pacienteCedula || '',
                pacienteTelefono: datos.pacienteTelefono || '',
                sede: datos.sede || 'Maracay',
                motivo: datos.motivo || 'Renovación de Cristales',
                meses: Number(datos.meses) || 0,
                dias: Number(datos.dias) || 0,
                fechaCreacion: new Date().toISOString(),
                fechaProgramada: datos.fechaProgramada || new Date().toISOString().split('T')[0],
                mensaje: datos.mensaje || '',
                estado: 'pendiente',
                fechaEnvio: null
            };
            list.unshift(nuevo);
            localStorage.setItem(STORAGE_KEYS.WA_RECORDATORIOS, JSON.stringify(list));
            return nuevo;
        } catch (e) {
            console.error('Error al guardar recordatorio WhatsApp:', e);
            return null;
        }
    }

    marcarRecordatorioEnviado(id) {
        try {
            const list = this.getRecordatoriosWhatsApp();
            const idx = list.findIndex(r => r.id === id);
            if (idx !== -1) {
                list[idx].estado = 'enviado';
                list[idx].fechaEnvio = new Date().toISOString();
                localStorage.setItem(STORAGE_KEYS.WA_RECORDATORIOS, JSON.stringify(list));
                return list[idx];
            }
            return null;
        } catch (e) {
            console.error('Error al actualizar recordatorio:', e);
            return null;
        }
    }

    eliminarRecordatorioWhatsApp(id) {
        try {
            const list = this.getRecordatoriosWhatsApp().filter(r => r.id !== id);
            localStorage.setItem(STORAGE_KEYS.WA_RECORDATORIOS, JSON.stringify(list));
            return true;
        } catch (e) {
            console.error('Error al eliminar recordatorio WhatsApp:', e);
            return false;
        }
    }
}

// Instancia global
window.OpticaStorage = new OpticaStorageManager();
window.opticaDB = window.OpticaStorage;
