const PRODUCTS = [
  {id:"tee-plan",name:"Camiseta Everybody Has a Plan",cat:"camisetas",shape:"tee",img:"/img/camiseta-plan.jpg",pos:"50% 35%",price:22,colors:["negro"],sizes:["S","M","L","XL","XXL"],flag:"Nuevo",
   desc:"Oversize con ilustración estilo tattoo old school en la espalda: el boxeador, la calavera y la frase que todo peleador conoce.",specs:["Algodón 200 g, corte oversize","Estampado grande en espalda","Cuello reforzado"]},
  {id:"hoodie-wild",name:"Hoodie Wild Ones Never Die",cat:"hoodies",shape:"hoodie",img:"/img/hoodie-wild-ones.jpg",pos:"22% 30%",zoom:1.7,price:42,colors:["negro"],sizes:["S","M","L","XL","XXL"],flag:"Top",
   desc:"Hoodie negro con letras amarillas en espalda y mangas, y los esqueletos boxeadores al centro.",specs:["Algodón perchado 300 g","Estampado amarillo y blanco","Capucha y puños elásticos"]},
  {id:"jogger-boxing",name:"Jogger BOXING",cat:"shorts",shape:"leggings",img:"/img/hoodie-wild-ones.jpg",pos:"82% 82%",zoom:2,price:30,colors:["negro"],sizes:["S","M","L","XL","XXL"],
   desc:"Pantalón jogger negro con BOXING en amarillo a lo largo de la pierna. Para llegar y salir del gimnasio.",specs:["Algodón french terry","Puño elástico en tobillo","Bolsillos laterales"]},
  {id:"short-boxeo",name:"Short BOXEO Jab",cat:"shorts",shape:"shorts",img:"/img/short-boxeo.jpg",pos:"82% 78%",zoom:1.8,price:25,colors:["negro"],sizes:["S","M","L","XL","XXL"],
   desc:"Short de algodón con BOXEO en blanco y el logo Jab bordado en amarillo. El favorito para saco y circuitos.",specs:["Algodón-poliéster","Cintura elástica con cordón","Logo Jab en pierna izquierda"]},
  {id:"leggings-mujer",name:"Set Crop + Leggings",cat:"mujer",shape:"leggings",img:"/img/mujer-leggings.jpg",pos:"50% 45%",price:38,colors:["negro"],sizes:["XS","S","M","L"],
   desc:"Crop tank sin mangas y leggings de tiro alto. Cómodo para HIIT, cuerda y sparring.",specs:["Licra suplex","Leggings tiro alto, no transparentan","Se venden juntos"]},
  {id:"top-jab",name:"Top Deportivo Jab",cat:"mujer",shape:"top",img:"/img/top-guantes.jpg",pos:"50% 78%",zoom:1.6,price:22,colors:["negro"],sizes:["XS","S","M","L"],
   desc:"Top de soporte medio con escote en V y malla. Combina con los leggings Jab.",specs:["Licra con malla frontal","Banda inferior ancha","Copas removibles"]},
  {id:"guantes-12",name:"Guantes Jab 12 oz",cat:"accesorios",shape:"wraps",img:"/img/top-guantes.jpg",pos:"50% 38%",zoom:1.25,price:45,colors:["negro"],sizes:["10 oz","12 oz","14 oz"],flag:"Básico",
   desc:"Los guantes de la clase: logo Jab amarillo y cierre de velcro. Ideales para empezar.",specs:["Cuero sintético","Cierre de velcro","Espuma de alta densidad"]},
  {id:"guantes-pro",name:"Guantes Jab Pro",cat:"accesorios",shape:"wraps",img:"/img/guantes-pro.jpg",pos:"40% 62%",zoom:1.2,price:60,colors:["negro"],sizes:["12 oz","14 oz","16 oz"],flag:"Pro",
   desc:"Guantes de entrenamiento y sparring con logo Jab en dorado. Más acolchado para trabajo pesado.",specs:["Cuero sintético premium","Pulgar fijo","Forro interno transpirable"]},
  {id:"tee-boxeo",name:"Camiseta BOXEO",cat:"camisetas",shape:"tee",print:"BOXEO",printFont:"college",price:18,colors:["negro","gris","blanco"],sizes:["S","M","L","XL","XXL"],
   desc:"La clásica del gimnasio: estampado BOXEO estilo vintage al frente. Algodón peinado que aguanta la sesión completa.",specs:["100% algodón peinado 180 g","Estampado serigrafía desgastada","Corte regular"]},
  {id:"tee-jab",name:"Camiseta Jab Logo",cat:"camisetas",shape:"tee",print:"Jab",printFont:"script",price:18,colors:["amarillo","negro"],sizes:["XS","S","M","L","XL"],
   desc:"El logo Jab en grande. La que se ve en cada Fight Night.",specs:["Algodón 180 g","Logo al frente, HIIT BOXING en espalda","Corte regular"]},
  {id:"tank-fight",name:"Tank Top Fight Team",cat:"tanks",shape:"tank",print:"FIGHT TEAM",printFont:"display",price:16,colors:["negro","amarillo"],sizes:["S","M","L","XL"],flag:"Top",
   desc:"Sin mangas para mover los hombros libre en saco y manoplas.",specs:["Algodón-poliéster","Sisa amplia","Logo Fight Team"]},
  {id:"tank-boxeo",name:"Tank Top BOXEO",cat:"tanks",shape:"tank",print:"BOXEO",printFont:"college",price:15,colors:["negro","blanco"],sizes:["S","M","L","XL","XXL"],
   desc:"La versión sin mangas del estampado BOXEO.",specs:["Algodón 160 g","Estampado vintage","Corte atlético"]},
  {id:"short-satin",name:"Short de Box Satinado",cat:"shorts",shape:"shorts",print:"Jab",printFont:"script",price:28,colors:["negro","rojo","amarillo"],sizes:["S","M","L","XL"],flag:"Pro",
   desc:"Short tradicional de boxeo con pretina ancha. Listo para el ring.",specs:["Satín brillante","Pretina elástica de 10 cm","Aberturas laterales"]},
  {id:"vendas",name:"Vendas de Box 4.5 m",cat:"accesorios",shape:"wraps",print:"",price:8,colors:["negro","rojo","amarillo"],sizes:["Única"],flag:"Básico",
   desc:"Protege muñecas y nudillos debajo del guante. Indispensable desde la primera clase.",specs:["4.5 m semi-elásticas","Cierre de velcro","Par"]},
  {id:"gorra",name:"Gorra Jab",cat:"accesorios",shape:"cap",print:"Jab",printFont:"script",price:15,colors:["negro","amarillo"],sizes:["Única"],
   desc:"Gorra curva con logo Jab bordado.",specs:["Bordado frontal","Ajuste trasero","Algodón twill"]}
];
const COLORS = {
  negro:{hex:"#141414",ink:"#ffffff",name:"Negro"},
  amarillo:{hex:"#ffd21f",ink:"#0b0b0b",name:"Amarillo Jab"},
  blanco:{hex:"#f2f2ee",ink:"#0b0b0b",name:"Blanco"},
  rojo:{hex:"#c91f27",ink:"#ffffff",name:"Rojo guante"},
  gris:{hex:"#3a3a3f",ink:"#ffd21f",name:"Gris carbón"}
};
const CATS = {camisetas:"Camisetas",tanks:"Tank tops",shorts:"Shorts y pantalones",hoodies:"Hoodies",mujer:"Mujer",accesorios:"Accesorios"};

/* =========================================================================
   CONTENIDO EDITABLE DE LA TIENDA JAB
   Todo lo que aparece en la web sale de este archivo. Los precios se validan
   en el servidor con estos valores (el navegador no puede cambiarlos).
   ========================================================================= */

// Stock inicial por talla (solo se usa la primera vez; luego se maneja desde /admin)
const STOCK_INICIAL = 10;

// ---- Envíos (USD). base = primera prenda, extra = cada prenda adicional.
// VALORES DE EJEMPLO: reemplazar por las tarifas reales del courier.
const SHIPPING = [
  { id:"retiro-centro", label:"Retiro en Jab Centro",           group:"Retiro en el gimnasio", base:0,  extra:0, needsAddress:false, country:"EC", eta:"Listo en 24 h" },
  { id:"retiro-ceibos", label:"Retiro en Jab Ceibos",           group:"Retiro en el gimnasio", base:0,  extra:0, needsAddress:false, country:"EC", eta:"Listo en 24 h" },
  { id:"gye",           label:"Envío dentro de Guayaquil",      group:"Ecuador",               base:3,  extra:0, needsAddress:true,  country:"EC", eta:"24–48 h" },
  { id:"ecuador",       label:"Envío a otra ciudad de Ecuador", group:"Ecuador",               base:6,  extra:1, needsAddress:true,  country:"EC", eta:"2–4 días hábiles" },
  { id:"usa",           label:"Envío a Estados Unidos",         group:"Internacional",         base:35, extra:5, needsAddress:true,  country:"US", eta:"7–12 días hábiles" },
  { id:"espana",        label:"Envío a España",                 group:"Internacional",         base:45, extra:6, needsAddress:true,  country:"ES", eta:"10–15 días hábiles" },
  { id:"alemania",      label:"Envío a Alemania",               group:"Internacional",         base:45, extra:6, needsAddress:true,  country:"DE", eta:"10–15 días hábiles" }
];

// ---- Membresías virtuales: créditos para desbloquear clases pregrabadas.
// Cada crédito desbloquea una clase para siempre en la cuenta del alumno.
const PACKS = [
  { id:"pack-5",  name:"Pack 5 clases",  classes:5,  price:10 },
  { id:"pack-15", name:"Pack 15 clases", classes:15, price:13, flag:"Más elegido" },
  { id:"pack-20", name:"Pack 20 clases", classes:20, price:15, flag:"Mejor precio" }
];

// ---- Clases pregrabadas. videoUrl: link de inserción (YouTube "no listado",
// Vimeo o Bunny Stream). El servidor solo lo entrega a quien desbloqueó la clase.
const CLASSES = [
  { id:"c01", title:"Fundamentos: guardia y jab",           level:"Principiante", minutes:25, coach:"Equipo Jab", thumb:"/img/top-guantes.jpg",      videoUrl:"" , free:true },
  { id:"c02", title:"El cruzado (el 2) sin abrir el codo",  level:"Principiante", minutes:20, coach:"Equipo Jab", thumb:"/img/short-boxeo.jpg",      videoUrl:"" },
  { id:"c03", title:"Combinaciones de 3 y 4 golpes",        level:"Intermedio",   minutes:30, coach:"Equipo Jab", thumb:"/img/guantes-pro.jpg",      videoUrl:"" },
  { id:"c04", title:"HIIT Boxing 30 minutos",               level:"Todos",        minutes:30, coach:"Equipo Jab", thumb:"/img/mujer-leggings.jpg",   videoUrl:"" },
  { id:"c05", title:"Core para boxeadores",                 level:"Todos",        minutes:20, coach:"Equipo Jab", thumb:"/img/top-guantes.jpg",      videoUrl:"" },
  { id:"c06", title:"Cuerda: ritmo y resistencia",          level:"Principiante", minutes:15, coach:"Equipo Jab", thumb:"/img/hoodie-wild-ones.jpg", videoUrl:"" },
  { id:"c07", title:"Defensa: esquivas y bloqueos",         level:"Intermedio",   minutes:25, coach:"Equipo Jab", thumb:"/img/guantes-pro.jpg",      videoUrl:"" },
  { id:"c08", title:"Saco: 6 rounds de 3 minutos",          level:"Intermedio",   minutes:35, coach:"Equipo Jab", thumb:"/img/short-boxeo.jpg",      videoUrl:"" },
  { id:"c09", title:"Juego de piernas en el ring",          level:"Intermedio",   minutes:20, coach:"Equipo Jab", thumb:"/img/camiseta-plan.jpg",    videoUrl:"" },
  { id:"c10", title:"Sombra con intención",                 level:"Todos",        minutes:15, coach:"Equipo Jab", thumb:"/img/hoodie-wild-ones.jpg", videoUrl:"" },
  { id:"c11", title:"Muay Thai: patadas y rodillas básicas",level:"Principiante", minutes:30, coach:"Equipo Jab", thumb:"/img/mujer-leggings.jpg",   videoUrl:"" },
  { id:"c12", title:"Movilidad y estiramiento post-entreno",level:"Todos",        minutes:15, coach:"Equipo Jab", thumb:"/img/top-guantes.jpg",      videoUrl:"" }
];

// ---- Entrenadores. photo: ruta en /img (opcional). Completar los "por confirmar".
const TRAINERS = [
  { name:"Manny Fálquez", role:"Fundador de JAB HIIT Boxing", photo:"",
    bio:"Creó JAB para que cualquier persona pudiera entrenar boxeo sin experiencia previa, mezclando técnica con intervalos de alta intensidad. Hoy lidera las sedes de Centro y Ceibos y una comunidad que entrena, compite y organiza las Fight Night.",
    tags:["Boxeo","HIIT","Dirección"] },
  { name:"Segundo Mercado", role:"Clases magistrales de boxeo", photo:"",
    bio:"Leyenda del boxeo ecuatoriano. En 1994 disputó en Quito el título mundial de peso mediano de la FIB ante Bernard Hopkins: lo derribó dos veces y la pelea terminó empatada. Desde octubre de 2026 enseña técnica en JAB: lunes en Ceibos y jueves en Centro, de 18:30 a 19:30.",
    tags:["Técnica","Combinaciones","Mascoteo"] },
  { name:"Coach de Muay Thai", role:"Muay Thai · por confirmar", photo:"",
    bio:"Pendiente: nombre, trayectoria y logros del coach de Muay Thai.",
    tags:["Muay Thai"] },
  { name:"Coach de HIIT", role:"HIIT y acondicionamiento · por confirmar", photo:"",
    bio:"Pendiente: nombre y biografía del coach de HIIT.",
    tags:["HIIT","Fuerza"] }
];

// ---- Historia del gimnasio
const STORY = {
  title:"Boxeo para todos, sin experiencia previa",
  paragraphs:[
    "JAB HIIT Boxing nació en Guayaquil con una idea sencilla: que el boxeo no sea solo para peleadores. Fundado por Manny Fálquez, el gimnasio combina la técnica del boxeo con entrenamiento por intervalos de alta intensidad para transformar mente y cuerpo desde la primera clase.",
    "Hoy JAB tiene dos sedes, en la calle Panamá en el centro y en Fedenador de Los Ceibos, y una comunidad que entrena junta, forma su propio Fight Team, compite en torneos y se reúne en las Fight Night.",
    "En octubre de 2026 JAB sumó a Segundo Mercado, figura histórica del boxeo ecuatoriano, para enseñar técnica a nuevas generaciones. Para JAB, Segundo Mercado le pertenece al boxeo."
  ],
  facts:[ ["2","sedes en Guayaquil"], ["20 mil+","seguidores en Instagram"], ["0","experiencia previa necesaria"] ]
};

// ---- Sedes. query = lo que se busca en Google Maps/Waze. Si tienes coordenadas
// exactas, pon lat y lng para que el pin sea preciso.
const LOCATIONS = [
  { id:"centro", name:"Jab Centro",  address:"Calle Panamá, centro de Guayaquil",
    query:"JAB HIIT Boxing Centro, Calle Panamá, Guayaquil, Ecuador", lat:null, lng:null },
  { id:"ceibos", name:"Jab Ceibos",  address:"Fedenador de Los Ceibos, km 4.5 Av. de los Bomberos, junto al Teatro Centro de Arte",
    query:"Fedenador Ceibos, Av. de los Bomberos, Guayaquil, Ecuador", lat:null, lng:null }
];

// ---- Datos de pago por transferencia (completar). Si numero queda vacío,
// la tienda indica que los datos se envían por WhatsApp.
const BANK = { banco:"", tipo:"", numero:"", titular:"", identificacion:"", correo:"" };

const WHATSAPP = "593980870849";
const INSTAGRAM = "https://www.instagram.com/jab.hiitboxing/";

module.exports = { PRODUCTS, COLORS, CATS, STOCK_INICIAL, SHIPPING, PACKS, CLASSES, TRAINERS, STORY, LOCATIONS, BANK, WHATSAPP, INSTAGRAM };
