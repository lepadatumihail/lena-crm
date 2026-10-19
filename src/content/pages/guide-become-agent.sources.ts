/**
 * Every source the "how to become an estate agent" guide links, shared by its
 * three languages so a quarterly re-check (plan 024) fixes a moved page in one
 * place. Each was opened on the date in CHECKED.guideBecomeAgent.
 */
export const SOURCES = {
  // The national rule
  ley10_2003: "https://www.boe.es/eli/es/l/2003/05/20/10/con",
  rdl4_2000: "https://www.boe.es/eli/es/rdl/2000/06/23/4/con",
  rd1294_2007: "https://www.boe.es/eli/es/rd/2007/09/28/1294/con",

  // Regional registers
  catLaw: "https://www.boe.es/eli/es-ct/l/2007/12/28/18/con",
  catDecree: "https://portaljuridic.gencat.cat/eli/es-ct/d/2010/02/02/12",
  catProcedure:
    "https://tramits.gencat.cat/es/tramits/tramits-temes/Registre_Agents_Immobiliaris_Catalunya",
  valDecree: "https://dogv.gva.es/es/eli/es-vc/d/2022/07/29/98/",
  valRuling:
    "https://www.poderjudicial.es/cgpj/es/Poder-Judicial/Tribunales-Superiores-de-Justicia/TSJ-Comunidad-Valenciana/Oficina-de-Comunicacion/Archivo-de-notas-de-prensa/El-TSJCV-estima-un-recurso-de-la-CNMC-y-anula-varios-requisitos-del-Registro-de-Agentes-de-Intermediacion-Inmobiliaria-de-la-Comunidad-Valenciana",
  valSentence:
    "https://www.poderjudicial.es/stfls/TRIBUNALES%20SUPERIORES%20DE%20JUSTICIA/TSJ%20Comunidad%20Valenciana/JURISPRUDENCIA/TSJCV%20Cont%2013dic2024.pdf",
  valCnmc: "https://www.cnmc.es/expedientes/la032022",
  balLaw: "https://www.boe.es/buscar/act.php?id=BOE-A-2024-15575",
  andLaw: "https://www.boe.es/buscar/act.php?id=BOE-A-2026-423",
  andAgreement: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-21762",
  madDecree: "https://www.bocm.es/boletin/CM_Orden_BOCM/2018/02/16/BOCM-20180216-1.PDF",
  madRegister: "https://www.comunidad.madrid/vivienda/registro-agentes-inmobiliarios-rain",
  navDecree: "https://bon.navarra.es/es/anuncio/-/texto/2019/92/0/",
  canDecree: "https://www.gobiernodecanarias.org/boc/2022/021/001.html",
  pvLaw: "https://www.boe.es/eli/es-pv/l/2015/06/18/3/con",
  pvRuling: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2018-13995",

  // Becoming self-employed
  modelo036:
    "https://sede.agenciatributaria.gob.es/Sede/ayuda/calendario-contribuyente/calendario-contribuyente-2026/informacion-sobre-presentacion-modelos-no-periodicos/modelo-036.html",
  iae: "https://www.boe.es/buscar/act.php?id=BOE-A-1990-23930",
  iaeExemption: "https://www.boe.es/buscar/act.php?id=BOE-A-2004-4214",
  reta: "https://portal.seg-social.gob.es/wps/portal/importass/importass/Categorias/Altas,+bajas+y+modificaciones/Altas+y+afiliacion+de+trabajadores/Alta_trabajo_autonomo",
  cotizacion: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-7296",
  leta: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-13409",
  rirpf: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820",
  liva: "https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740",
  trade: "https://www.boe.es/buscar/act.php?id=BOE-A-2009-3673",
  tradeSepe:
    "https://sede.sepe.gob.es/portalSede/es/procedimientos-y-servicios/personas/contratos/TAED",
  verifactu: "https://www.boe.es/buscar/doc.php?id=BOE-A-2025-24446",

  // Obligations from the first sale
  aml: "https://www.boe.es/eli/es/l/2010/04/28/10/con",
  rd515: "https://www.boe.es/eli/es/rd/1989/04/21/515/con",
  ley12_2023: "https://www.boe.es/eli/es/l/2023/05/24/12/con",
} as const;
