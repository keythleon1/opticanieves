/**
 * Base de Datos Geográfica de Venezuela - Óptica Nieve
 * Contiene los 24 estados federales y sus ciudades/municipios principales
 */

const VENEZUELA_DATA = {
    "Amazonas": [
        "Puerto Ayacucho", "San Fernando de Atabapo", "Maroa", "San Carlos de Río Negro", "Isla Ratón", "La Esmeralda"
    ],
    "Anzoátegui": [
        "Barcelona", "Puerto La Cruz", "Lechería", "Guanta", "El Tigre", "Anaco", "Cantaura", "Pariaguán", "Clarines", "Aragua de Barcelona"
    ],
    "Apure": [
        "San Fernando de Apure", "Guasdualito", "Achaguas", "Biruaca", "Elorza", "San Juan de Payara", "Mantecal"
    ],
    "Aragua": [
        "Maracay", "Turmero", "La Victoria", "Cagua", "El Limón", "Villa de Cura", "Santa Rita", "Palo Negro", "San Mateo", "Ocumare de la Costa"
    ],
    "Barinas": [
        "Barinas", "Barinitas", "Socopó", "Santa Bárbara", "Ciudad Bolivia", "Sabaneta", "Barrancas"
    ],
    "Bolívar": [
        "Ciudad Guayana (Puerto Ordaz / San Félix)", "Ciudad Bolívar", "Upata", "Caicara del Orinoco", "Tumeremo", "Guasipati", "El Callao", "Santa Elena de Uairén"
    ],
    "Carabobo": [
        "Valencia", "Puerto Cabello", "Guacara", "Naguanagua", "San Diego", "Tocuyito", "Mariara", "Morón", "Bejuma", "San Joaquín"
    ],
    "Cojedes": [
        "San Carlos", "Tinaquillo", "Tinaco", "El Baúl", "El Pao", "Las Vegas", "Libertad de Cojedes"
    ],
    "Delta Amacuro": [
        "Tucupita", "Sierra Imataca", "Pedernales", "Curiapo", "San Francisco de Guayo"
    ],
    "Distrito Capital": [
        "Caracas (Libertador)", "El Recreo", "Sucre (Catia)", "El Valle", "La Candelaria", "San Bernardino", "Antímano", "Caricuao", "El Paraíso"
    ],
    "Falcón": [
        "Coro", "Punto Fijo", "Chichiriviche", "Tucacas", "Dabajuro", "Puerto Cumarebo", "La Vela de Coro", "Churuguara", "Mene de Mauroa"
    ],
    "Guárico": [
        "San Juan de los Morros", "Calabozo", "Valle de la Pascua", "Zaraza", "Altagracia de Orituco", "Tucupido", "El Sombrero", "Camaguán", "Santa María de Ipire"
    ],
    "La Guaira (Vargas)": [
        "La Guaira", "Maiquetía", "Catia La Mar", "Caraballeda", "Macuto", "Naiguatá", "Carayaca"
    ],
    "Lara": [
        "Barquisimeto", "Cabudare", "Carora", "El Tocuyo", "Quíbor", "Duaca", "Sanare", "Siquisique"
    ],
    "Mérida": [
        "Mérida", "El Vigía", "Tovar", "Ejido", "Lagunillas", "Mucuchíes", "Bailadores", "Timotes", "Santa Cruz de Mora"
    ],
    "Miranda": [
        "Los Teques", "Chacao", "Baruta", "El Hatillo", "Sucre (Petare)", "Guarenas", "Guatire", "Charallave", "Cúa", "Ocumare del Tuy", "Higuerote", "San Antonio de los Altos"
    ],
    "Monagas": [
        "Maturín", "Punta de Mata", "Caripe", "Caripito", "Caicara de Maturín", "Temblador", "Aragua de Maturín"
    ],
    "Nueva Esparta": [
        "Porlamar", "Pampatar", "La Asunción", "Juan Griego", "El Valle del Espíritu Santo", "Punta de Piedras", "Boca de Río"
    ],
    "Portuguesa": [
        "Guanare", "Acarigua", "Araure", "Villa Bruzual", "Turén", "Biscucuy", "Ospino"
    ],
    "Sucre": [
        "Cumaná", "Carúpano", "Güiria", "Cariaco", "Araya", "Marigüitar", "Río Caribe", "El Pilar"
    ],
    "Táchira": [
        "San Cristóbal", "Táriba", "Rubio", "San Antonio del Táchira", "La Fría", "Colón", "Capacho", "Ureña", "La Grita"
    ],
    "Trujillo": [
        "Trujillo", "Valera", "Boconó", "Carache", "Sabana de Mendoza", "Pampán", "Pampanito", "Chejendé"
    ],
    "Yaracuy": [
        "San Felipe", "Yaritagua", "Chivacoa", "Nirgua", "Cocorote", "Urachiche", "Boraure"
    ],
    "Zulia": [
        "Maracaibo", "San Francisco", "Cabimas", "Ciudad Ojeda", "Villa del Rosario", "Machiques", "Santa Bárbara del Zulia", "La Concepción", "Los Puertos de Altagracia"
    ]
};

// Exportar globalmente
window.VENEZUELA_DATA = VENEZUELA_DATA;
