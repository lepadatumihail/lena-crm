import type { Help, PageLang } from "./content";

/*
 * The page's own words in each page language. Agent pages are read by
 * buyers in the language the agent offers them, which is often not one the
 * app runs in (Swedish), so this is a plain dictionary rather than the
 * next-intl catalogs. Spanish addresses the buyer as "usted", like the rest
 * of LeadWing's buyer-facing Spanish. {name} is the agent's first name.
 *
 * Written by Claude; a native speaker should read the Swedish and Spanish.
 */

export type ReplyBucket = "hour" | "fewHours" | "day";

type Step = { title: string; body: string };

export type PageCopy = {
  langLabel: string;
  exampleBanner: string;
  replyBadge: Record<ReplyBucket, string>;
  replySub: string;
  ctaPrimary: string;
  whatsappHello: string;
  factsLabel: string;
  fSpeaks: string;
  native: string;
  fAreas: string;
  fHelps: string;
  helps: Record<Help, string>;
  fSince: string;
  fWorks: string;
  independent: string;
  agency: string;
  aboutTitle: string;
  howTitle: string;
  buyerSteps: [Step, Step, Step];
  sellerSteps: [Step, Step, Step];
  formTitleBuy: string;
  formTitleSell: string;
  tabsLabel: string;
  tabBuy: string;
  tabSell: string;
  budget: string;
  budgetOpts: [string, string, string, string];
  beds: string;
  where: string;
  notSure: string;
  when: string;
  whenOpts: [string, string, string];
  sellWhere: string;
  sellWherePh: string;
  sellType: string;
  typeOpts: [string, string, string, string];
  sellWhen: string;
  sellWhenOpts: [string, string, string];
  name: string;
  namePh: string;
  contact: string;
  contactPh: string;
  msg: string;
  msgPh: string;
  send: string;
  sending: string;
  privacy: string;
  privacyLink: string;
  sentTitle: string;
  sentBody: Record<ReplyBucket | "none", string>;
  exampleSent: string;
  sendAnother: string;
  errors: { name: string; contact: string; rate: string; server: string; invalid: string };
  madeWith: string;
  ownPage: string;
  report: string;
  reportSubject: string;
  jobTitle: string;
  defaultTitle: string;
};

const en: PageCopy = {
  langLabel: "Language",
  exampleBanner:
    "Example page: this agent is made up. Anything you send here reaches the LeadWing team.",
  replyBadge: {
    hour: "Usually replies within an hour",
    fewHours: "Usually replies within a few hours",
    day: "Usually replies within a day",
  },
  replySub: "Measured by LeadWing on real enquiries",
  ctaPrimary: "Tell {name} what you’re looking for",
  whatsappHello: "Hi {name}, I found your page on LeadWing.",
  factsLabel: "{name} at a glance",
  fSpeaks: "Speaks",
  native: "native",
  fAreas: "Areas",
  fHelps: "Helps with",
  helps: { buying: "Buying", selling: "Selling", new_builds: "New builds", rentals: "Rentals" },
  fSince: "In the area since",
  fWorks: "Works",
  independent: "Independent agent",
  agency: "With {agency}",
  aboutTitle: "About {name}",
  howTitle: "How it works",
  buyerSteps: [
    {
      title: "Tell {name} what you’re looking for",
      body: "Budget, bedrooms, area, and when you’d like to come over.",
    },
    {
      title: "{name} sends homes that fit",
      body: "Only the ones that match your budget and wishes, so you don’t have to scroll the portals.",
    },
    {
      title: "You see them in one trip",
      body: "{name} plans the viewings and stays with you through the reservation and the notary.",
    },
  ],
  sellerSteps: [
    {
      title: "Tell {name} about your home",
      body: "Where it is, what kind of home, and when you’d like to sell.",
    },
    {
      title: "{name} values it honestly",
      body: "A realistic price, based on what sells in the area.",
    },
    {
      title: "{name} finds the buyer",
      body: "And handles the viewings, the offers and the notary.",
    },
  ],
  formTitleBuy: "What are you looking for?",
  formTitleSell: "Tell {name} about your home",
  tabsLabel: "Buying or selling",
  tabBuy: "Buying",
  tabSell: "Selling",
  budget: "Budget",
  budgetOpts: ["Up to €400k", "€400–800k", "€800k–1.5M", "Over €1.5M"],
  beds: "Bedrooms",
  where: "Where",
  notSure: "Not sure yet",
  when: "When",
  whenOpts: ["Just looking", "Within 6 months", "Ready now"],
  sellWhere: "Where is the home?",
  sellWherePh: "Town or development",
  sellType: "Type of home",
  typeOpts: ["Apartment", "Townhouse", "Villa", "Plot"],
  sellWhen: "When would you like to sell?",
  sellWhenOpts: ["Just want a price", "Within 6 months", "As soon as possible"],
  name: "Your name",
  namePh: "First and last name",
  contact: "WhatsApp or email",
  contactPh: "Phone with country code, or email",
  msg: "Anything else? (optional)",
  msgPh: "E.g. near the beach, we’re over in March",
  send: "Send to {name}",
  sending: "Sending…",
  privacy:
    "{name} gets your details through LeadWing to reply to you, and they’re used for nothing else.",
  privacyLink: "Privacy",
  sentTitle: "Sent to {name}",
  sentBody: {
    none: "{name} will get back to you on WhatsApp or by email.",
    hour: "{name} usually replies within an hour, on WhatsApp or by email.",
    fewHours: "{name} usually replies within a few hours, on WhatsApp or by email.",
    day: "{name} usually replies within a day, on WhatsApp or by email.",
  },
  exampleSent: "This is an example page, so your message went to the LeadWing team.",
  sendAnother: "Send another",
  errors: {
    name: "Please add your name.",
    contact: "Add a phone number with its country code, or an email.",
    rate: "Too many messages from here. Please try again later.",
    server: "Something went wrong. Please try again, or write on WhatsApp.",
    invalid: "Please check the form.",
  },
  madeWith: "Made with",
  ownPage: "Are you an agent? Get your own page",
  report: "Report this page",
  reportSubject: "Report: agent page {slug}",
  jobTitle: "Estate agent",
  defaultTitle: "estate agent in {area}",
};

const es: PageCopy = {
  langLabel: "Idioma",
  exampleBanner:
    "Página de ejemplo: este perfil es inventado. Lo que envíe aquí llega al equipo de LeadWing.",
  replyBadge: {
    hour: "Suele responder en menos de una hora",
    fewHours: "Suele responder en pocas horas",
    day: "Suele responder en menos de un día",
  },
  replySub: "Medido por LeadWing con consultas reales",
  ctaPrimary: "Cuéntele a {name} qué busca",
  whatsappHello: "Hola {name}, le escribo desde su página de LeadWing.",
  factsLabel: "{name} en breve",
  fSpeaks: "Habla",
  native: "nativo",
  fAreas: "Zonas",
  fHelps: "Ayuda con",
  helps: { buying: "Compra", selling: "Venta", new_builds: "Obra nueva", rentals: "Alquiler" },
  fSince: "En la zona desde",
  fWorks: "Trabaja",
  independent: "Por cuenta propia",
  agency: "Con {agency}",
  aboutTitle: "Sobre {name}",
  howTitle: "Cómo funciona",
  buyerSteps: [
    {
      title: "Cuéntele a {name} qué busca",
      body: "Presupuesto, dormitorios, zona y cuándo le gustaría venir.",
    },
    {
      title: "{name} le envía viviendas que encajan",
      body: "Solo las que cumplen su presupuesto y sus deseos, sin perder horas en los portales.",
    },
    {
      title: "Las ve en un solo viaje",
      body: "{name} organiza las visitas y le acompaña hasta la reserva y la notaría.",
    },
  ],
  sellerSteps: [
    {
      title: "Cuéntele a {name} sobre su vivienda",
      body: "Dónde está, qué tipo de vivienda es y cuándo quiere vender.",
    },
    {
      title: "{name} la valora con honestidad",
      body: "Un precio realista, según lo que se vende en la zona.",
    },
    {
      title: "{name} encuentra al comprador",
      body: "Y se ocupa de las visitas, las ofertas y la notaría.",
    },
  ],
  formTitleBuy: "¿Qué busca?",
  formTitleSell: "Cuéntele a {name} sobre su vivienda",
  tabsLabel: "Comprar o vender",
  tabBuy: "Comprar",
  tabSell: "Vender",
  budget: "Presupuesto",
  budgetOpts: ["Hasta 400.000 €", "400.000–800.000 €", "800.000 € – 1,5 M €", "Más de 1,5 M €"],
  beds: "Dormitorios",
  where: "Dónde",
  notSure: "Aún no lo sé",
  when: "Cuándo",
  whenOpts: ["Solo estoy mirando", "En los próximos 6 meses", "Ya"],
  sellWhere: "¿Dónde está la vivienda?",
  sellWherePh: "Municipio o urbanización",
  sellType: "Tipo de vivienda",
  typeOpts: ["Piso", "Adosado", "Villa", "Parcela"],
  sellWhen: "¿Cuándo quiere vender?",
  sellWhenOpts: ["Solo quiero saber el precio", "En los próximos 6 meses", "Lo antes posible"],
  name: "Su nombre",
  namePh: "Nombre y apellidos",
  contact: "WhatsApp o email",
  contactPh: "Teléfono con prefijo, o email",
  msg: "¿Algo más? (opcional)",
  msgPh: "P. ej.: cerca de la playa; venimos en marzo",
  send: "Enviar a {name}",
  sending: "Enviando…",
  privacy:
    "{name} recibe sus datos a través de LeadWing para responderle, y no se usan para nada más.",
  privacyLink: "Privacidad",
  sentTitle: "Enviado a {name}",
  sentBody: {
    none: "{name} le responderá por WhatsApp o por email.",
    hour: "{name} suele responder en menos de una hora, por WhatsApp o por email.",
    fewHours: "{name} suele responder en pocas horas, por WhatsApp o por email.",
    day: "{name} suele responder en menos de un día, por WhatsApp o por email.",
  },
  exampleSent: "Es una página de ejemplo, así que su mensaje ha llegado al equipo de LeadWing.",
  sendAnother: "Enviar otra consulta",
  errors: {
    name: "Escriba su nombre.",
    contact: "Añada un teléfono con su prefijo, o un email.",
    rate: "Demasiados mensajes desde aquí. Inténtelo más tarde.",
    server: "Algo ha fallado. Inténtelo de nuevo o escriba por WhatsApp.",
    invalid: "Revise el formulario.",
  },
  madeWith: "Hecha con",
  ownPage: "¿Es agente? Cree su propia página",
  report: "Denunciar esta página",
  reportSubject: "Denuncia: página de agente {slug}",
  jobTitle: "Agente inmobiliario",
  defaultTitle: "agente inmobiliario en {area}",
};

const sv: PageCopy = {
  langLabel: "Språk",
  exampleBanner:
    "Exempelsida: den här mäklaren finns inte på riktigt. Det du skickar här går till LeadWing-teamet.",
  replyBadge: {
    hour: "Svarar oftast inom en timme",
    fewHours: "Svarar oftast inom några timmar",
    day: "Svarar oftast inom ett dygn",
  },
  replySub: "Mätt av LeadWing på riktiga förfrågningar",
  ctaPrimary: "Berätta för {name} vad du söker",
  whatsappHello: "Hej {name}! Jag hittade din sida på LeadWing.",
  factsLabel: "{name} i korthet",
  fSpeaks: "Talar",
  native: "modersmål",
  fAreas: "Områden",
  fHelps: "Hjälper till med",
  helps: { buying: "Köp", selling: "Försäljning", new_builds: "Nyproduktion", rentals: "Uthyrning" },
  fSince: "I området sedan",
  fWorks: "Arbetar",
  independent: "Fristående mäklare",
  agency: "På {agency}",
  aboutTitle: "Om {name}",
  howTitle: "Så går det till",
  buyerSteps: [
    {
      title: "Berätta för {name} vad du söker",
      body: "Budget, antal sovrum, område och när du vill komma ner.",
    },
    {
      title: "{name} skickar bostäder som passar",
      body: "Bara de som matchar din budget och dina önskemål, så slipper du scrolla portalerna.",
    },
    {
      title: "Ni ser dem på en resa",
      body: "{name} planerar visningarna och finns med hela vägen till reservation och notarie.",
    },
  ],
  sellerSteps: [
    {
      title: "Berätta för {name} om din bostad",
      body: "Var den ligger, vilken typ av bostad det är och när du vill sälja.",
    },
    {
      title: "{name} värderar den ärligt",
      body: "Ett realistiskt pris utifrån vad som säljs i området.",
    },
    {
      title: "{name} hittar köparen",
      body: "Och sköter visningar, bud och notarie.",
    },
  ],
  formTitleBuy: "Vad söker du?",
  formTitleSell: "Berätta för {name} om din bostad",
  tabsLabel: "Köpa eller sälja",
  tabBuy: "Köpa",
  tabSell: "Sälja",
  budget: "Budget",
  budgetOpts: [
    "Upp till 400 000 €",
    "400 000–800 000 €",
    "800 000 € – 1,5 milj. €",
    "Över 1,5 milj. €",
  ],
  beds: "Sovrum",
  where: "Var",
  notSure: "Vet inte än",
  when: "När",
  whenOpts: ["Tittar bara", "Inom 6 månader", "Redo nu"],
  sellWhere: "Var ligger bostaden?",
  sellWherePh: "Ort eller område",
  sellType: "Typ av bostad",
  typeOpts: ["Lägenhet", "Radhus", "Villa", "Tomt"],
  sellWhen: "När vill du sälja?",
  sellWhenOpts: ["Vill bara veta priset", "Inom 6 månader", "Så snart som möjligt"],
  name: "Ditt namn",
  namePh: "För- och efternamn",
  contact: "WhatsApp eller e-post",
  contactPh: "Telefon med landsnummer, eller e-post",
  msg: "Något mer? (valfritt)",
  msgPh: "T.ex. nära stranden, vi kommer ner i mars",
  send: "Skicka till {name}",
  sending: "Skickar…",
  privacy:
    "{name} får dina uppgifter via LeadWing för att kunna svara dig, och de används inte till något annat.",
  privacyLink: "Integritet",
  sentTitle: "Skickat till {name}",
  sentBody: {
    none: "{name} hör av sig på WhatsApp eller via e-post.",
    hour: "{name} svarar oftast inom en timme, på WhatsApp eller via e-post.",
    fewHours: "{name} svarar oftast inom några timmar, på WhatsApp eller via e-post.",
    day: "{name} svarar oftast inom ett dygn, på WhatsApp eller via e-post.",
  },
  exampleSent: "Det här är en exempelsida, så ditt meddelande gick till LeadWing-teamet.",
  sendAnother: "Skicka ett till",
  errors: {
    name: "Skriv ditt namn.",
    contact: "Lägg till ett telefonnummer med landsnummer, eller en e-postadress.",
    rate: "För många meddelanden härifrån. Försök igen senare.",
    server: "Något gick fel. Försök igen, eller skriv på WhatsApp.",
    invalid: "Kontrollera formuläret.",
  },
  madeWith: "Gjord med",
  ownPage: "Är du mäklare? Skaffa en egen sida",
  report: "Anmäl sidan",
  reportSubject: "Anmälan: mäklarsida {slug}",
  jobTitle: "Fastighetsmäklare",
  defaultTitle: "fastighetsmäklare i {area}",
};

export const PAGE_COPY: Record<PageLang, PageCopy> = { en, es, sv };

/** Fills {placeholders}; a missing value leaves the placeholder visible. */
export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => vars[key] ?? whole);
}

/** "sv" in Spanish → "Sueco": the language's own name, capitalised. */
export function languageName(code: string, inLang: PageLang): string {
  let name: string | undefined;
  try {
    name = new Intl.DisplayNames([inLang], { type: "language" }).of(code);
  } catch {
    name = undefined;
  }
  if (!name || name === code) return code.toUpperCase();
  return name.charAt(0).toLocaleUpperCase(inLang) + name.slice(1);
}
