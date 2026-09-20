/**
 * Catálogo de Monturas y Lentes de Referencia - Óptica Nieve
 * Precios en USD ($) con imágenes de alta calidad
 */

const OPTICAL_PRODUCTS = [
    {
        id: "MONT-001",
        name: "Ray-Ban Aviator Classic Óptico",
        brand: "Ray-Ban",
        category: "Clásico",
        gender: "Unisex",
        material: "Metal Dorado / Terminales Acetato",
        price: 50.00,
        badge: "Más Vendido",
        description: "El icónico diseño Aviator adaptado para lentes de fórmula. Estructura liviana de alta resistencia con acabado pulido.",
        image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "MONT-002",
        name: "Ray-Ban Clubmaster Acetate",
        brand: "Ray-Ban",
        category: "Moderno",
        gender: "Unisex",
        material: "Acetato Negro / Detalles Dorados",
        price: 55.00,
        badge: "Tendencia",
        description: "Estilo retro sofisticado con ceja superior de acetato pulido y aros metálicos de precisión.",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "MONT-003",
        name: "Oakley Socket 5.0 Titanium",
        brand: "Oakley",
        category: "Deportivo / Ejecutivo",
        gender: "Caballero",
        material: "Aleación C-5 Ultraliviana",
        price: 65.00,
        badge: "Titanio",
        description: "Diseño ergonómico con plaquetas de silicona Unobtainium para máximo agarre y confort durante todo el día.",
        image: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "MONT-004",
        name: "Carolina Herrera Cat-Eye Elegance",
        brand: "Carolina Herrera",
        category: "Elegante",
        gender: "Dama",
        material: "Acetato Caret / Oro Rosa",
        price: 70.00,
        badge: "Exclusivo",
        description: "Montura femenina estilo Cat-Eye que realza la mirada con finos detalles en varillas y tono carey brillante.",
        image: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "MONT-005",
        name: "Carrera Active Rimless Flex",
        brand: "Carrera",
        category: "Ejecutivo",
        gender: "Unisex",
        material: "Acero Quirúrgico / Al Aire",
        price: 45.00,
        badge: "Ligereza Total",
        description: "Montura al aire de mínima presencia visual, ideal para rostros que buscan sobriedad y máxima ligereza.",
        image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "MONT-006",
        name: "Gucci Square Prestige",
        brand: "Gucci",
        category: "Lujo",
        gender: "Dama / Unisex",
        material: "Bio-Acetato Italiano Negro",
        price: 85.00,
        badge: "Lujo",
        description: "Silueta geométrica moderna con el distintivo sello de alta costura y acabado premium brillante.",
        image: "https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "MONT-007",
        name: "Vogue Round Minimalist",
        brand: "Vogue Eyewear",
        category: "Juvenil",
        gender: "Unisex",
        material: "Metal Plateado Mate",
        price: 40.00,
        badge: "Popular",
        description: "Estructura circular minimalista que combina con cualquier estilo casual o profesional.",
        image: "https://images.unsplash.com/photo-1582142407894-ec85a1260a46?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "MONT-008",
        name: "Tommy Hilfiger Sport TR90",
        brand: "Tommy Hilfiger",
        category: "Deportivo",
        gender: "Caballero / Niños",
        material: "Polímero TR90 Flexible e Indestructible",
        price: 38.00,
        badge: "Ultra Resistente",
        description: "Material termoplástico con memoria de forma, ultra resistente a caídas y apto para alta actividad.",
        image: "https://images.unsplash.com/photo-1563903530908-afdd155d057a?auto=format&fit=crop&w=600&q=80"
    }
];

window.OPTICAL_PRODUCTS = OPTICAL_PRODUCTS;
