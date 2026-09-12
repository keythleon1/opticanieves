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
    CONFIG: 'optica_nieves_config_v3'
};

// Configuración oficial con tasa BCV suministrada
const DEFAULT_CONFIG = {
    optica_nombre: "Centro Óptico Nieves",
    optica_lema: "Especialistas en el Cuidado de tus Ojos",
    optica_rif: "J-40918273-0",
    medico_director: "Dr. Carlos Nieves",
    medico_colegio: "C.M. 34.891 | M.P.P.S. 89.210",
    tasa_usd_ves: 842.21, // Tasa BCV Oficial
    tasa_fecha: "Martes, 15 Septiembre 2026",
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
        if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
            localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
        }
    }

    // =========================================================================
    // CONFIGURACIÓN & TASAS
    // =========================================================================
    getConfig() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
            return data ? { ...DEFAULT_CONFIG, ...JSON.parse(data) } : DEFAULT_CONFIG;
        } catch (e) {
            return DEFAULT_CONFIG;
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
            if (fechaTasa) cfg.tasa_fecha = fechaTasa;
            this.saveConfig(cfg);
            return true;
        }
        return false;
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

        return {
            paciente,
            recibos,
            laboratorio,
            recipes,
            informes,
            citas,
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

        const nuevaOrden = {
            id: nextId,
            recibo_id: data.recibo_id,
            paciente_id: data.paciente_id,
            paciente_nombre: data.paciente_nombre,
            paciente_cedula: data.paciente_cedula,
            paciente_telefono: data.paciente_telefono,
            sede: data.sede || 'Maracay',
            fase: 'FASE_1',
            formula: data.formula || null,
            items: data.items || [],
            notas: data.notas || '',
            fecha_ingreso: now.toISOString(),
            fecha_promesa: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            historial_fases: [
                {
                    fase: 'FASE_1',
                    titulo: 'Evaluación y Registro en Taller',
                    fecha: now.toISOString(),
                    nota: 'Orden ingresada a laboratorio óptico.'
                }
            ]
        };

        ordenes.unshift(nuevaOrden);
        this.saveOrdenesLaboratorio(ordenes);
        return nuevaOrden;
    }

    actualizarFaseLaboratorio(ordenId, nuevaFase, notaFase = '') {
        const ordenes = this.getOrdenesLaboratorio();
        const idx = ordenes.findIndex(o => o.id === ordenId);
        if (idx === -1) return null;

        const orden = ordenes[idx];
        orden.fase = nuevaFase;
        
        const titulosFase = {
            FASE_1: 'Pendiente por Taller',
            FASE_2: 'Biselado, Tallado Digital y Ensamblaje',
            FASE_3: 'Control de Calidad y Listo para Retiro',
            FASE_4: 'Entregado al Paciente'
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
            medico_nombre: data.medico_nombre || this.getConfig().medico_director,
            medico_colegio: data.medico_colegio || this.getConfig().medico_colegio,
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
            medico_nombre: data.medico_nombre || this.getConfig().medico_director,
            medico_colegio: data.medico_colegio || this.getConfig().medico_colegio,
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
            motivo: data.motivo || 'Examen Visual Integral',
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
            if (orden.fase === 'FASE_4') activePhaseIndex = 3;
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

        const ordenesEnTaller = ordenes.filter(o => o.fase === 'FASE_1' || o.fase === 'FASE_2').length;
        const ordenesListasRetiro = ordenes.filter(o => o.fase === 'FASE_3').length;
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

    resetDatabase() {
        localStorage.setItem(STORAGE_KEYS.PACIENTES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.VENTAS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.RECIBOS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.LABORATORIO, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.INFORMES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CAJA, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify([]));
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
}

// Instancia global
window.OpticaStorage = new OpticaStorageManager();
window.opticaDB = window.OpticaStorage;
