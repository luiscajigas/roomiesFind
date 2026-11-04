/**
 * Barrios de San Juan de Pasto agrupados por comuna.
 * Fuente: https://es.wikipedia.org/wiki/Anexo:Comunas_de_Pasto
 * Las etapas de un mismo barrio (Niza I, II, III...) van en una sola opción
 * para que los vecinos coincidan al calcular la compatibilidad.
 */
export interface ComunaPasto {
  nombre: string;
  barrios: string[];
}

/** Para quien no encuentra su barrio: no cuenta como coincidencia de zona. */
export const OTRO_BARRIO = 'Otro barrio de Pasto';

export const COMUNAS_PASTO: ComunaPasto[] = [
  { nombre: 'Comuna 1', barrios: ['Bombona', 'Caracha', 'Centro', 'El Churo', 'El Cilindro', 'El Parque', 'El Portalito', 'Hullaguanga', 'La Panadería', 'Las Américas', 'Los Dos Puentes', 'Marcos de la Rosa', 'San Agustín', 'San Andrés', 'San Andresito', 'San José', 'San José Obrero', 'Santiago'] },
  { nombre: 'Comuna 2', barrios: ['Aire Libre', 'Alhambra', 'Atahualpa', 'Bella Vista', 'Casa Bella', 'El Olivo', 'El Prado', 'El Recuerdo', 'Fátima', 'Javeriano', 'Julián Bucheli', 'La Gran Colombia', 'Las Lunas', 'Las Violetas', 'Los Abedules', 'Los Álamos', 'Los Balcones', 'Los Olivos', 'Medardo Bucheli', 'Navarrete', 'Normandía', 'Parque Bolívar', 'Salomón', 'San Juan Bosco', 'San Miguel', 'Villa Lucía'] },
  { nombre: 'Comuna 3', barrios: ['Alejandría', 'Arnulfo Guerrero', 'Caicedonia', 'Camilo Torres', 'Casa Loma', 'El Ejido', 'Guamuez', 'José Antonio Galán', 'La Esmeralda', 'La Estrella', 'Las Brisas', 'Las Lajas', 'Las Mercedes', 'Los Pinos', 'Mercedario', 'Pie de Cuesta', 'Pinar del Río', 'Popular', 'Pucalpa', 'Rosal del Oriente', 'Santa Bárbara', 'Santa Catalina', 'Santa Mónica', 'Villa Flor', 'Villa Oriente'] },
  { nombre: 'Comuna 4', barrios: ['Albergue del Sol', 'Altos de Lorenzo', 'Altos del Campo', 'Belén', 'Bernal', 'Betania', 'Chile', 'Doce de Octubre', 'El Porvenir', 'El Rosario', 'El Tejar', 'El Triunfo', 'La Paz', 'Laureano Gómez', 'Lorenzo de Aldana', 'Los Eliseos', 'Miraflores', 'Praga', 'Puerta del Sol', 'Rincón Colonial', 'San Germán', 'San Juan de los Pastos', 'Santa Fe', 'Santacruz', 'Sendoya', 'Siete de Agosto', 'Villa Docente', 'Villa Olímpica', 'Villa Victoria'] },
  { nombre: 'Comuna 5', barrios: ['Altos de Chapalito', 'Antonio Nariño', 'Cantarana', 'Chambú', 'Chapal', 'El Pilar', 'El Progreso', 'El Remanso', 'Emilio Botero', 'La Minga', 'La Rosa', 'La Vega', 'Las Ferias', 'Los Cristales', 'Los Robles', 'Madrigal', 'María Isabel', 'Potrerillo', 'Prados del Sur', 'San Martín', 'Santa Clara', 'Venecia', 'Villa del Río', 'Vivienda Cristiana'] },
  { nombre: 'Comuna 6', barrios: ['Agualongo', 'Altamira', 'Bachué', 'Caicedo', 'Ciudad Jardín', 'Cooperativa Popular Nariñense', 'El Estadio', 'El Libertador', 'Gilberto Pabón', 'Granada', 'Inem', 'Jerusalén', 'La Cruz', 'La Palma', 'Los Fundadores', 'Luis Carlos Galán', 'Mijitayo', 'Mirador de Niza', 'Niza', 'Nueva Colombia', 'Prados del Niza', 'Quillacinga', 'Quito López', 'San Carlos', 'San Miguel de Jongovito', 'San Sebastián', 'Santa Isabel', 'Santanita', 'Sumatambo', 'Tamasagra', 'Tequendama', 'Valle Lili', 'Villa de los Ríos'] },
  { nombre: 'Comuna 7', barrios: ['Achalay', 'Capusigra', 'Castillos del Norte', 'El Bosque', 'El Edén', 'El Rincón de La Aurora', 'El Rincón de La Panamericana', 'Francisco de La Villota', 'La Aurora', 'La Primavera', 'Las Acacias', 'Las Camelias', 'Los Andes', 'Los Hexágonos', 'Rosales', 'San Felipe', 'San Ignacio', 'Santa María', 'Villa Aurora', 'Villa Campanela', 'Villa Sofía', 'Villa Vergel'] },
  { nombre: 'Comuna 8', barrios: ['Alta Vista', 'Altamira San Vicente', 'Altos de la Colina', 'Anganoy', 'Arco Iris', 'Balcones de Mariluz', 'Bello Horizonte', 'Colón', 'Colpatria', 'El Remanso del Norte', 'Gualcaloma', 'Jorge Giraldo', 'La Castellana', 'La Cuesta', 'La Pradera', 'Las Margaritas', 'Los Frailejones', 'Los Héroes', 'Los Laureles', 'Los Urapanes', 'Mariluz', 'Mirador de San Juan', 'Miravalle', 'Montemor', 'Panamericano', 'Portal de la Colina', 'Prados del Oeste', 'Quintas de San Pedro', 'Salazar Mejía', 'San Diego', 'San Juan de Anganoy', 'San Juan de Dios', 'San Pedro', 'San Vicente', 'Sindamanoy', 'Torres de Pubenza', 'Veracruz', 'Villa Jardín', 'Villas de San Rafael'] },
  { nombre: 'Comuna 9', barrios: ['Alto Juanoy', 'Briceño', 'Calatrava', 'Camino Real', 'Castilla', 'Chapultepec', 'Colonial', 'El Aljibe', 'El Cerámico', 'El Dorado', 'El Mirador', 'El Polvorín', 'El Refugio', 'Figueroa', 'José Ignacio Zarama', 'Juan XXIII', 'Juanoy', 'La Colina', 'La Riviera', 'La Victoria', 'Las Cuadras', 'Los Nogales', 'Los Sauces', 'Luis Brand', 'Manacá', 'Maridiaz', 'Marsella', 'Morasurco', 'Nuevo Amanecer', 'Palermo', 'Pandiaco', 'Paraná', 'Parque Infantil', 'Pinos del Norte', 'San Antonio de Juanoy', 'Santa Ana', 'Santa Rita', 'Sañudo', 'Terranova', 'Terrazas de Briceño', 'Titán', 'Torobajo', 'Universitario', 'Urbanización Zarama', 'Valle de Atriz', 'Versalles', 'Villa Campestre', 'Villa María'] },
  { nombre: 'Comuna 10', barrios: ['Aranda', 'Buenos Aires', 'Condominio Bellavista', 'Destechados', 'El Futuro', 'El Portal de Aranda', 'El Portal del Norte', 'El Rincón de Pasto', 'El Rincón del Rosario', 'Juan Pablo II', 'La Esperanza', 'La Floresta', 'Libertad', 'Marquetalia', 'Niño Jesús de Praga', 'Nueva Aranda', 'Nuevo Horizonte', 'Nuevo Sol', 'Ocho de Marzo', 'Prados del Norte', 'Quillotocto', 'Rincón de Aranda', 'Río Blanco', 'San Albano', 'Santa Matilde', 'Sol de Oriente', 'Tescual', 'Villa del Rosario', 'Villa Guerrero', 'Villas del Norte'] },
  { nombre: 'Comuna 11', barrios: ['Alameda', 'Aquine', 'Belalcázar', 'Centenario', 'Chico', 'Ciudad Real', 'Corazón de Jesús', 'El Calvario', 'El Común', 'El Corralito', 'La Lomita', 'Los Alcázares', 'Rincón del Paraíso', 'Salsipuedes', 'Villa Elena', 'Villa Jazmín'] },
  { nombre: 'Comuna 12', barrios: ['Altos de La Carolina', 'Balcones del Este', 'Campiña de Oriente', 'Carlos Pizarro', 'Cujacal Bajo', 'El Manantial', 'El Paraíso', 'Fray Ezequiel Moreno Díaz', 'Gualcalá', 'La Carolina', 'La Florida', 'La Josefina', 'Las Orquídeas', 'María Paz', 'Monserrat', 'Parque de Baviera', 'San Diego Norte', 'San Mateo', 'Sena', 'Simón Bolívar', 'Sindagua', 'Villa Adriana María', 'Villa Ángela', 'Villa Colombia', 'Villa del Prado', 'Villa Recreo', 'Villa Rocío'] }
];

/** Comuna a la que pertenece un barrio, o null si no está en la lista. */
export function comunaDeBarrio(barrio: string): string | null {
  return COMUNAS_PASTO.find((comuna) => comuna.barrios.includes(barrio))?.nombre ?? null;
}

export function esBarrioDeLaLista(zona: string): boolean {
  return zona === OTRO_BARRIO || COMUNAS_PASTO.some((comuna) => comuna.barrios.includes(zona));
}
