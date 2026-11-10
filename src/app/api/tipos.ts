/**
 * Tipos del API REST y del WebSocket, sacados del contrato OpenAPI del backend
 * (roomiesFindBack/contratos/src/main/openapi/roomiesfind-api.yaml).
 *
 * contrato.ts se genera con `npm run contrato`: no se edita a mano. Si el backend cambia
 * el contrato, se vuelve a generar y el compilador señala lo que hay que ajustar aquí.
 */
import type { components } from './contrato';

type Esquemas = components['schemas'];

export type Persona = Esquemas['Persona'];
export type CambiosPerfil = Esquemas['CambiosPerfil'];
export type PaginaCandidatos = Esquemas['PaginaCandidatos'];
export type ResumenNiveles = Esquemas['ResumenNiveles'];
export type FotoGuardada = Esquemas['FotoGuardada'];
export type Horario = Esquemas['Horario'];
export type OrdenBusqueda = Esquemas['OrdenBusqueda'];
export type FiltroMascotas = Esquemas['FiltroMascotas'];

export type UsuarioSesion = Esquemas['UsuarioSesion'];
export type Sesion = Esquemas['Sesion'];
export type Registro = Esquemas['Registro'];

export type Explicacion = Esquemas['Explicacion'];
export type Traduccion = Esquemas['Traduccion'];
export type Idioma = Esquemas['Idioma'];
export type Registrado = Esquemas['Registrado'];

export type Mensaje = Esquemas['Mensaje'];
export type Conversacion = Esquemas['Conversacion'];
export type PaginaMensajes = Esquemas['PaginaMensajes'];
/** Lo que llega por el WebSocket; se distingue por `tipo`. */
export type EventoNavegador = Esquemas['EventoNavegador'];
/** Lo que se envía por el WebSocket. */
export type MensajeAlServidor = Esquemas['MensajeAlServidor'];

export type MotivoReporte = Esquemas['MotivoReporte'];
export type ReporteCreado = Esquemas['ReporteCreado'];

export type Ficha = Esquemas['Ficha'];
export type ReporteAdmin = Esquemas['ReporteAdmin'];
export type CuentaReportada = Esquemas['CuentaReportada'];
export type Suspension = Esquemas['Suspension'];
export type ResumenAdmin = Esquemas['ResumenAdmin'];

export type ErrorApi = Esquemas['Error'];
