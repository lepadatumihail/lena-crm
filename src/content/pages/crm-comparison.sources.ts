/**
 * Every source the three CRM comparison guides link (plan 025: free plans,
 * best CRM for independent agents, Witei and Inmovilla alternatives), shared
 * by their nine modules so a quarterly re-check fixes a moved page in one
 * place. Each was opened on the date in CHECKED for those guides. Vendor pages
 * (and official registers) only: a price a vendor doesn't publish is "on
 * request" on the pages, never a figure from a blog.
 */
export const SOURCES = {
  // Witei (Witei Solutions SL; Fotocasa Group, owned by Scout24)
  witeiHome: "https://get.witei.com/es/",
  witeiPrices: "https://get.witei.com/es/precios-crm/",
  witeiCrm: "https://get.witei.com/es/crm-inmobiliario/",
  witeiAddOns: "https://faq.witei.com/es/articles/8450659-precios-adicionales-aplicables",
  witeiTerms:
    "https://faq.witei.com/es/articles/6548820-contrato-de-servicios-condiciones-generales-y-terminos-de-uso",
  witeiSmartInbox:
    "https://faq.witei.com/es/articles/113854-smart-inbox-registro-automatico-en-tu-crm-de-contactos-recibidos-por-email",
  witeiPortals: "https://faq.witei.com/es/articles/113753-pasarelas-a-portales-inmobiliarios",
  witeiIdealista: "https://faq.witei.com/es/articles/118118-idealista",
  witeiNoCollaboration:
    "https://faq.witei.com/es/articles/5916721-witei-no-disponibilidad-de-herramientas-facilitadoras-de-la-colaboracion-entre-agencias-inmobiliarias-independientes",
  witeiExport: "https://faq.witei.com/es/articles/3090216-realizar-una-exportacion-de-mis-datos",
  witeiCancel: "https://faq.witei.com/es/articles/6142307-dar-de-baja-la-cuenta-en-witei",
  witeiWhatsapp: "https://faq.witei.com/es/articles/6768859-whatsapp-enviar-mensajes-desde-tus-contactos",
  bormeWitei2025: "https://www.boe.es/borme/dias/2025/04/07/pdfs/BORME-A-2025-67-28.pdf",
  bormeScout24: "https://www.boe.es/borme/dias/2026/03/17/pdfs/BORME-A-2026-52-28.pdf",
  bormeFotocasaGroup: "https://www.boe.es/borme/dias/2026/07/21/pdfs/BORME-A-2026-138-28.pdf",
  scout24Q1:
    "https://www.scout24.com/media/scout24/Investor_Relations/Berichte_und_Praesentationen/2026/260429_Scout24_Bericht_Q1_2026_EN.pdf",
  fotocasaGroupBrands: "https://www.fotocasa.es/es/quienes-somos/",

  // Inmovilla (Aplicaciones Inmovilla SL, owned by idealista)
  inmovillaPrices: "https://www.inmovilla.com/precios",
  inmovillaFaqPrice: "https://academy.inmovilla.com/new/app/faqs/index.php?faq=770",
  inmovillaFaqShare: "https://academy.inmovilla.com/new/app/faqs/index.php?faq=776",
  inmovillaFaqWhatsapp: "https://academy.inmovilla.com/new/app/faqs/index.php?faq=817",
  inmovillaFaqPortals: "https://academy.inmovilla.com/new/app/faqs/index.php?faq=802",
  inmovillaFaqLeads: "https://academy.inmovilla.com/new/app/faqs/index.php?faq=749",
  inmovillaFaqCircles: "https://academy.inmovilla.com/new/app/faqs/index.php?faq=408",
  inmovillaFaqLanguages: "https://academy.inmovilla.com/new/app/faqs/index.php?faq=409",
  inmovillaFaqExport: "https://academy.inmovilla.com/new/app/faqs/index.php?faq=92",
  inmovillaFaqCancel: "https://academy.inmovilla.com/new/app/faqs/index.php?faq=851",
  inmovillaFaqAgencies: "https://academy.inmovilla.com/new/app/faqs/index.php?faq=769",
  idealistaBuysInmovilla:
    "https://www.idealista.com/news/inmobiliario/blog-de-idealista/2022/06/10/797139-idealista-adquiere-inmovilla",
  bormeInmovilla: "https://www.boe.es/borme/dias/2022/07/21/pdfs/BORME-A-2022-139-03.pdf",

  // Fincta (fincta.app; fincta.com is an unrelated firm)
  finctaPrices: "https://landing.fincta.app/precios/",
  finctaTerms: "https://landing.fincta.app/legal/terminos/",
  finctaFree: "https://landing.fincta.app/crm-inmobiliario-gratis/",
  finctaCompare: "https://landing.fincta.app/comparativa-crm-inmobiliario/",

  // Inmogesco
  inmogescoPrices: "https://inmogesco.com/precios-crm-inmogesco/",
  inmogescoPortals: "https://inmogesco.com/publicar-en-portales-inmobiliarios/",
  inmogescoHome: "https://inmogesco.com/",

  // PropertyList
  propertylistPrices: "https://info.propertylist.es/es/precios/",
  propertylistFree: "https://info.propertylist.es/es/gratis/",
  propertylistPipelines: "https://info.propertylist.es/es/pipelines/",

  // InmoProCRM
  inmoprocrm: "https://inmoprocrm.com/",
  inmoprocrmFeatures: "https://inmoprocrm.com/funciones/",
  inmoprocrmWhatsapp: "https://inmoprocrm.com/crm-inmobiliario-con-whatsapp/",

  // Resales Online
  resalesHome: "https://www.resales-online.com/",
  resalesPricing: "https://www.resales-online.com/pricing/",
  resalesFees: "https://support.resales-online.com/en/articles/10130518-subscription-fees",
  resalesStandalone:
    "https://support.resales-online.com/en/articles/5144438-what-is-the-standalone-version",
  resalesLicence:
    "https://support.resales-online.com/en/articles/6100698-software-licencing-agreement-resales-online",
  resalesViewings:
    "https://support.resales-online.com/en/articles/3420702-property-viewings-booking-and-managing-your-appointments",
  resalesEmails: "https://support.resales-online.com/en/articles/5606540-saving-emails-to-the-system-crm",
  resalesLanguages:
    "https://support.resales-online.com/en/articles/3400494-how-to-change-my-system-language-or-client-contact-language",
  resalesWhatsapp:
    "https://support.resales-online.com/en/articles/5226799-how-to-send-a-property-viewer-link-via-whatsapp",
  resalesAiTranslate:
    "https://support.resales-online.com/en/articles/17663106-ai-translate-translate-property-descriptions-into-missing-languages",

  // Mobilia
  mobiliaPrices: "https://www.mobiliagestion.es/precios",
  mobiliaWhatsapp: "https://www.mobiliagestion.es/promo/whatsapp-business-mobilia",
  mobiliaCrm: "https://www.mobiliagestion.es/crm-inmobiliario",

  // Sooprema
  sooprema: "https://www.sooprema.com/",
  soopremaTrial: "https://www.sooprema.com/crm-inmobiliario/",
  soopremaFaq: "https://www.sooprema.com/preguntas-frecuentes-software-inmobiliario/",
  soopremaPortals: "https://www.sooprema.com/portales-inmobiliarios/",

  // Inmoweb (a Fotocasa Group brand)
  inmowebPrices: "https://www.inmoweb.es/precios/",
  inmowebTerms: "https://www.inmoweb.es/condiciones/",
  inmowebOnebox: "https://ayuda.inmoweb.es/2018/03/02/que-es-onebox-y-como-se-configura/",
  inmowebPortals: "https://www.inmoweb.net/real-estate-portals/",
  inmowebWhatsapp: "https://ayuda.inmoweb.es/2020/05/20/como-mando-whatsapp-a-mis-clientes/",
  inmowebLanguages: "https://ayuda.inmoweb.es/2023/01/18/guia-primeros-pasos-panel-inmoweb/",

  // Vesta CRM
  vestaPrices: "https://www.vesta-crm.com/precios",
  vestaTerms: "https://www.vesta-crm.com/condiciones-servicio",

  // General sales CRMs
  hubspotCrm: "https://www.hubspot.es/products/crm",
  hubspotFreeTools: "https://legal.hubspot.com/es/hubspot-product-and-services-catalog/free-tools",
  hubspotLimits: "https://legal.hubspot.com/es/hubspot-product-and-services-catalog/technical-limits",
  hubspotStarter: "https://www.hubspot.es/products/crm/starter",
  hubspotWhatsapp: "https://knowledge.hubspot.com/es/inbox/connect-whatsapp-to-the-conversations-inbox",
  hubspotLanguages: "https://knowledge.hubspot.com/help-and-resources/hubspot-language-offerings",
  hubspotListings: "https://knowledge.hubspot.com/records/understand-objects",
  hubspotCrm2024: "https://web.archive.org/web/20240903223645/https://www.hubspot.com/products/crm",
  zohoPricing: "https://www.zoho.com/es-xl/crm/zohocrm-pricing.html",
  zohoFree: "https://www.zoho.com/es-xl/crm/free-crm.html",
  zohoFeatures: "https://www.zoho.com/es-xl/crm/complete-feature-list.html",
  clientifyPrices: "https://clientify.com/precios",
  clientifyRealEstate: "https://clientify.com/blog/crm/mejores-crm-inmobiliarias",
  pipedrivePricing: "https://www.pipedrive.com/es/pricing",
} as const;
