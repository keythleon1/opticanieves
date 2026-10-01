/**
 * Lógica del Portal de Pacientes - Óptica Nieve
 * Maneja el catálogo, el selector dinámico de Venezuela y el formulario de agendamiento.
 */

document.addEventListener('DOMContentLoaded', () => {
    initCatalog();
    initVenezuelaSelectors();
    initServiceRadios();
    initDateInput();
    initFormSubmission();
    initModalEvents();
    initSimpleBookingForm();
    initLensTrackerForm();
});

/* ==========================================================================
   1. INICIALIZACIÓN DEL CATÁLOGO DE MONTURAS
   ========================================================================== */
function initCatalog() {
    const catalogGrid = document.getElementById('catalogGrid');
    if (!catalogGrid || !window.OPTICAL_PRODUCTS) return;

    catalogGrid.innerHTML = window.OPTICAL_PRODUCTS.map(product => `
        <div class="product-card">
            <div class="product-img-wrapper">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <span class="product-badge-float">${product.badge}</span>
                <span class="product-brand-float">${product.brand}</span>
            </div>
            <div class="product-body">
                <div>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-material">${product.material}</div>
                    <p class="product-desc">${product.description}</p>
                </div>
                <div class="product-footer">
                    <div class="product-price">
                        <span class="product-price-label">Precio Referencial</span>
                        <span class="product-price-val">$${product.price.toFixed(2)} USD</span>
                    </div>
                    <button type="button" class="btn btn-sm btn-primary" onclick="selectFrameForBooking('${product.name}', ${product.price})">
                        Elegir
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/* ==========================================================================
   2. SELECCIÓN DE MONTURA PARA EL FORMULARIO
   ========================================================================== */
window.selectFrameForBooking = function(frameName, price) {
    const banner = document.getElementById('selectedFrameBanner');
    const bannerName = document.getElementById('bannerFrameName');
    const bannerPrice = document.getElementById('bannerFramePrice');
    const frameInput = document.getElementById('selectedFrameInput');

    if (banner && bannerName && bannerPrice && frameInput) {
        bannerName.textContent = frameName;
        bannerPrice.textContent = `Precio Referencial: $${price.toFixed(2)} USD`;
        frameInput.value = `${frameName} ($${price.toFixed(2)})`;
        banner.style.display = 'flex';

        // Desplazarse suavemente al formulario
        document.getElementById('agendar').scrollIntoView({ behavior: 'smooth' });

        // Mostrar notificación toast rápida
        showToast(`Montura seleccionada: ${frameName}`);
    }
};

// Quitar montura seleccionada
document.getElementById('btnRemoveSelectedFrame')?.addEventListener('click', () => {
    const banner = document.getElementById('selectedFrameBanner');
    const frameInput = document.getElementById('selectedFrameInput');
    if (banner && frameInput) {
        banner.style.display = 'none';
        frameInput.value = "";
        showToast("Montura removida de la cita.");
    }
});

/* ==========================================================================
   3. SELECTORES DE VENEZUELA (24 ESTADOS + CIUDADES DINÁMICAS)
   ========================================================================== */
function initVenezuelaSelectors() {
    const stateSelect = document.getElementById('stateSelect');
    const citySelect = document.getElementById('citySelect');

    if (!stateSelect || !citySelect || !window.VENEZUELA_DATA) return;

    // Poblar los 24 estados ordenados alfabéticamente
    const states = Object.keys(window.VENEZUELA_DATA).sort();
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });

    // Evento al cambiar de estado
    stateSelect.addEventListener('change', (e) => {
        const selectedState = e.target.value;
        const cities = window.VENEZUELA_DATA[selectedState] || [];

        citySelect.innerHTML = '<option value="" disabled selected>-- Seleccione la Ciudad/Municipio --</option>';
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });

        citySelect.disabled = false;
    });
}

/* ==========================================================================
   4. MANEJO DE RADIOS DE SERVICIO (3 OPCIONES)
   ========================================================================== */
function initServiceRadios() {
    const options = document.querySelectorAll('.service-card-option');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            const radio = opt.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });
}

/* ==========================================================================
   5. FECHA MÍNIMA POR DEFECTO
   ========================================================================== */
function initDateInput() {
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }
}

/* ==========================================================================
   6. ENVÍO Y PROCESAMIENTO DEL FORMULARIO
   ========================================================================== */
function initFormSubmission() {
    const form = document.getElementById('patientRegistrationForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const patientData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            idDocType: formData.get('idDocType'),
            idDocNumber: formData.get('idDocNumber'),
            age: formData.get('age'),
            phone: formData.get('phone'),
            state: formData.get('state'),
            city: formData.get('city'),
            customAddress: formData.get('customAddress'),
            service: formData.get('service'),
            appointmentDate: formData.get('appointmentDate'),
            appointmentShift: formData.get('appointmentShift'),
            frameSelected: formData.get('frameSelected') || ""
        };

        // Validación básica
        if (!patientData.state || !patientData.city) {
            alert("Por favor seleccione su Estado y Ciudad de Venezuela.");
            return;
        }

        // Guardar en la base de datos de Óptica Nieve
        const createdPatient = window.opticaDB.addPatient(patientData);

        if (createdPatient) {
            // Mostrar Comprobante / Ticket
            showAppointmentTicket(createdPatient);
            // Resetear formulario
            form.reset();
            document.getElementById('selectedFrameBanner').style.display = 'none';
            document.getElementById('selectedFrameInput').value = "";
            initDateInput();
        } else {
            alert("Ocurrió un error al registrar al paciente.");
        }
    });
}

/* ==========================================================================
   7. MODAL DE TICKET Y COMPROBANTE DIGITAL
   ========================================================================== */
function showAppointmentTicket(patient) {
    const modal = document.getElementById('appointmentModal');
    if (!modal) return;

    document.getElementById('ticketCode').textContent = patient.id;
    document.getElementById('ticketPatientName').textContent = `${patient.firstName} ${patient.lastName} (${patient.age} años)`;
    document.getElementById('ticketCedula').textContent = `${patient.idDocType}${patient.idDocNumber}`;
    document.getElementById('ticketLocation').textContent = `${patient.city}, Edo. ${patient.state} ${patient.customAddress ? `(${patient.customAddress})` : ''}`;
    document.getElementById('ticketService').textContent = patient.service;
    document.getElementById('ticketDateTime').textContent = `${patient.appointmentDate} - ${patient.appointmentShift}`;
    document.getElementById('ticketFrame').textContent = patient.frameSelected;

    modal.classList.add('active');
}

function initModalEvents() {
    const modal = document.getElementById('appointmentModal');
    const closeBtn = document.getElementById('btnCloseModal');
    const printBtn = document.getElementById('btnPrintTicket');

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Cerrar al hacer clic fuera del contenedor
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

/* ==========================================================================
   UTILIDAD DE TOAST NOTIFICATIONS
   ========================================================================== */
function showToast(message) {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

/* ==========================================================================
   8. FORMULARIO SIMPLIFICADO DE CITAS (PÁGINA 2) & CONTROL DE FECHAS
   ========================================================================== */
window.actualizarFechasDisponiblesCliente = function() {
    const state = document.getElementById('stateSelectSimple')?.value;
    const dateInput = document.getElementById('appointmentDateSimple');
    const hint = document.getElementById('hintFechasDisponibles');
    if (!dateInput) return;

    const todayStr = new Date().toISOString().split('T')[0];
    dateInput.min = todayStr;

    if (!state) {
        if (hint) hint.innerHTML = 'Seleccione su Estado/Sede para ver fechas de atención.';
        return;
    }

    const sedeStr = state === 'Aragua' ? 'Maracay' : 'San Juan de los Morros';
    const config = window.OpticaStorage ? window.OpticaStorage.getConfig() : null;
    const fechasDisponibles = (config && config.fechas_disponibles && config.fechas_disponibles[sedeStr]) || [];

    if (fechasDisponibles && fechasDisponibles.length > 0) {
        if (hint) {
            hint.innerHTML = `Fechas activas para ${sedeStr}: <strong>${fechasDisponibles.slice(0, 4).join(', ')}${fechasDisponibles.length > 4 ? '...' : ''}</strong>`;
        }
        // Sugerir la primera fecha disponible
        if (!dateInput.value || !fechasDisponibles.includes(dateInput.value)) {
            dateInput.value = fechasDisponibles[0];
        }
    } else {
        if (hint) {
            hint.innerHTML = `Atención habitual de Lunes a Sábado en ${sedeStr}. Seleccione el día deseado.`;
        }
        if (!dateInput.value) {
            dateInput.value = todayStr;
        }
    }
};

function initSimpleBookingForm() {
    const form = document.getElementById('simpleBookingForm');
    const dateInput = document.getElementById('appointmentDateSimple');
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName')?.value.trim();
        const idPrefix = document.getElementById('idPrefix')?.value || 'V-';
        const idNumber = document.getElementById('idNumber')?.value.trim();
        const phone = document.getElementById('phoneNumber')?.value.trim();
        const state = document.getElementById('stateSelectSimple')?.value;
        const chosenDate = document.getElementById('appointmentDateSimple')?.value || new Date().toISOString().split('T')[0];
        const chosenShift = document.getElementById('appointmentShiftSimple')?.value || 'Mañana (09:00 AM - 12:30 PM)';

        if (!fullName || !idNumber || !phone || !state || !chosenDate) {
            alert('Por favor complete todos los campos obligatorios, incluyendo la fecha de la cita.');
            return;
        }

        const sedeStr = state === 'Aragua' ? 'Maracay' : 'San Juan de los Morros';
        const formattedCedula = `${idPrefix}${idNumber}`;

        const config = window.OpticaStorage ? window.OpticaStorage.getConfig() : null;
        if (config) {
            if (Array.isArray(config.fechas_bloqueadas) && config.fechas_bloqueadas.includes(chosenDate)) {
                alert(`Lo sentimos, la fecha seleccionada (${chosenDate}) no está disponible para atención. Por favor elija otra fecha.`);
                return;
            }
            const dateObj = new Date(chosenDate + 'T12:00:00');
            const dayOfWeek = dateObj.getDay();
            const diasHabilitados = (config.dias_habilitados && config.dias_habilitados[sedeStr]) || [1, 2, 3, 4, 5, 6];
            if (dayOfWeek === 0 || !diasHabilitados.includes(dayOfWeek)) {
                alert(`La sede ${sedeStr} no atiende consultas en el día de la semana seleccionado. Por favor seleccione otra fecha.`);
                return;
            }
        }

        if (window.OpticaStorage && window.OpticaStorage.crearCita) {
            window.OpticaStorage.crearCita({
                nombre: fullName,
                cedula: formattedCedula,
                telefono: phone,
                sede: sedeStr,
                fecha: chosenDate,
                hora: 'Por asignar',
                turno: chosenShift,
                estado: 'PENDIENTE',
                motivo: 'Solicitud de Turno y Día de Consulta desde Portal Web'
            });
        }

        // Guardar o actualizar datos del paciente para que quede disponible en todos los apartados
        if (window.OpticaStorage && window.OpticaStorage.crearOActualizarPaciente) {
            const partes = fullName.split(' ');
            const nom = partes[0] || fullName;
            const ape = partes.slice(1).join(' ') || '';
            window.OpticaStorage.crearOActualizarPaciente({
                cedula: formattedCedula,
                nombre: nom,
                apellido: ape,
                telefono: phone,
                whatsapp: phone,
                sede: sedeStr
            });
        }

        // Mensaje automatizado de WhatsApp según la sede
        const phoneSede = (sedeStr === 'Maracay' || state === 'Aragua') ? '584124419517' : '584243577194';
        const msgWhatsApp = encodeURIComponent(
            `Hola Centro Óptico Nieves (${sedeStr}), solicito turno y día de consulta:\n` +
            `• Paciente: ${fullName}\n` +
            `• Cédula: ${formattedCedula}\n` +
            `• Teléfono: ${phone}\n` +
            `• Fecha Solicitada: ${chosenDate}\n` +
            `• Turno Preferido: ${chosenShift}\n` +
            `• Sede: ${sedeStr}\n\n` +
            `Quedo atento a la confirmación de la hora exacta de mi cita.`
        );
        const waUrl = `https://wa.me/${phoneSede}?text=${msgWhatsApp}`;
        window.open(waUrl, '_blank');

        showToast(`¡Solicitud de turno y cita recibida para ${fullName}! Se abrió WhatsApp para enviar la confirmación a la sede ${sedeStr}.`);
        form.reset();
        if (dateInput) {
            dateInput.min = new Date().toISOString().split('T')[0];
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    });
}

/* ==========================================================================
   9. RASTREADOR DE ESTATUS DE LENTES POR CÉDULA (PÁGINA 3)
   ========================================================================== */
function initLensTrackerForm() {
    const form = document.getElementById('lensTrackerForm');
    const resultBox = document.getElementById('trackerResultBox');
    if (!form || !resultBox) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const prefix = document.getElementById('searchCedulaPrefix')?.value || 'V-';
        const num = document.getElementById('searchCedulaNumber')?.value.trim();

        if (!num) {
            alert('Por favor ingrese su número de cédula.');
            return;
        }

        const fullCedula = `${prefix}${num}`;
        const trackerData = window.OpticaStorage ? window.OpticaStorage.consultarEstatusLentesPorCedula(num) : null;

        if (!trackerData || !trackerData.encontrado) {
            resultBox.style.display = 'block';
            resultBox.innerHTML = `
                <div class="empty-state" style="padding: 2.5rem 1rem; text-align: center; background: #F8FAFC; border-radius: 12px; border: 1px dashed #CBD5E1;">
                    <h3 style="color: var(--color-primary-dark); font-size: 1.15rem; font-weight: 800; margin-bottom: 0.35rem;">No se encontró orden activa para la cédula ${fullCedula}</h3>
                    <p style="color: var(--color-gray-500); font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
                        Verifique el número ingresado o consulte directamente con nuestro equipo en la sede correspondiente.
                    </p>
                </div>
            `;
            return;
        }

        const activePhaseIndex = trackerData.activePhaseIndex !== undefined ? trackerData.activePhaseIndex : 0;
        const sedeNombre = trackerData.sede === 'Aragua' || trackerData.sede === 'Maracay' 
            ? 'C.C. Las Américas (Maracay)' 
            : 'C.C. Galería (San Juan de los Morros)';

        const phases = [
            {
                num: "1",
                title: "Fase 1: Enviado al Laboratorio",
                desc: "Orden técnica generada e ingresada a la cola de trabajo del laboratorio.",
                badge: activePhaseIndex > 0 ? "Completado" : (activePhaseIndex === 0 ? "En Curso" : "Pendiente")
            },
            {
                num: "2",
                title: "Fase 2: En Proceso Laboratorio",
                desc: "Corte computarizado, biselado, tallado digital de cristales y montaje en montura.",
                badge: activePhaseIndex > 1 ? "Completado" : (activePhaseIndex === 1 ? "En Proceso" : "Pendiente")
            },
            {
                num: "3",
                title: "Fase 3: Listo en Laboratorio",
                desc: "Control de calidad técnico aprobado en laboratorio, preparado para despacho a sede.",
                badge: activePhaseIndex > 2 ? "Completado" : (activePhaseIndex === 2 ? "Listo en Lab" : "Pendiente")
            },
            {
                num: "4",
                title: "Fase 4: Listos para la Entrega",
                desc: `Lentes recibidos y listos para retiro inmediato en ${sedeNombre}.`,
                badge: activePhaseIndex > 3 ? "Completado" : (activePhaseIndex === 3 ? "Listos para Retiro" : "Pendiente")
            },
            {
                num: "5",
                title: "Fase 5: Entregado al Paciente",
                desc: "Lentes entregados satisfactoriamente con estuche, paño y certificado de garantía.",
                badge: activePhaseIndex >= 4 ? "Entregado" : "Pendiente"
            }
        ];

        const isAllDone = activePhaseIndex >= 4;
        const isReady = activePhaseIndex === 3;

        resultBox.style.display = 'block';
        resultBox.innerHTML = `
            <div class="tracker-patient-summary">
                <div>
                    <div class="tracker-patient-name">${trackerData.paciente_nombre}</div>
                    <div class="tracker-patient-details">
                        <span>Cédula: ${trackerData.paciente_cedula}</span>
                        <span>Sede: ${sedeNombre}</span>
                        ${trackerData.orden_id ? `<span>Orden: ${trackerData.orden_id}</span>` : ''}
                    </div>
                </div>
                <div>
                    <span class="badge-tag ${(isAllDone || isReady) ? 'badge-green' : 'badge-blue'}" style="font-size: 0.85rem; padding: 0.4rem 0.85rem;">
                        ${isAllDone ? 'Lentes Entregados' : (isReady ? 'Listos para Retiro' : (activePhaseIndex === 2 ? 'Listo en Lab' : (activePhaseIndex === 1 ? 'En Proceso Lab' : 'Enviado al Lab')))}
                    </span>
                </div>
            </div>

            <div class="tracker-timeline">
                ${phases.map((ph, idx) => {
                    const isCompleted = idx < activePhaseIndex || (idx === 4 && activePhaseIndex === 4);
                    const isActive = idx === activePhaseIndex && !isAllDone;
                    const stateClass = isCompleted ? 'completed' : (isActive ? 'active' : 'pending');
                    const badgeClass = isCompleted ? 'done' : (isActive ? 'process' : 'pending');
                    const icon = isCompleted ? '✓' : ph.num;

                    return `
                        <div class="timeline-step ${stateClass}">
                            <div class="step-node">${icon}</div>
                            <div class="step-content">
                                <div class="step-title-row">
                                    <span class="step-title">${ph.title}</span>
                                    <span class="step-badge ${badgeClass}">${ph.badge}</span>
                                </div>
                                <p class="step-desc">${ph.desc}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    });
}
