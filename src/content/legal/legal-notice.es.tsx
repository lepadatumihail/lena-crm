import Link from "next/link";

import { LEGAL_ENTITY } from "@/lib/legal";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function LegalNoticeEs() {
  const e = LEGAL_ENTITY;
  return (
    <>
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la
        información y de comercio electrónico (LSSI-CE), estos son los datos del titular de{" "}
        {SITE_URL}:
      </p>
      <dl>
        <dt>Titular</dt>
        <dd>{e.name}</dd>
        <dt>NIF</dt>
        <dd>{e.taxId}</dd>
        <dt>Dirección</dt>
        <dd>{e.address}</dd>
        <dt>Email</dt>
        <dd>{e.email}</dd>
        {e.registry ? (
          <>
            <dt>Registro</dt>
            <dd>{e.registry}</dd>
          </>
        ) : null}
      </dl>

      <h2>Objeto del sitio web</h2>
      <p>
        Este sitio presenta {SITE_NAME}, un CRM para agentes inmobiliarios independientes, y da
        acceso a la aplicación. El uso de ambos está sujeto a este aviso, a los{" "}
        <Link href={marketingPath("terms", "es")}>Términos del servicio</Link> y a la{" "}
        <Link href={marketingPath("privacy", "es")}>Política de privacidad</Link>.
      </p>

      <h2>Precios</h2>
      <p>
        Los precios del plan Pro se muestran en euros y no incluyen el IVA, que se añade al
        pagar al tipo que te corresponda. El plan Gratis no tiene coste. Los pagos los
        procesa Stripe mediante una conexión cifrada; los datos de tarjeta nunca llegan a
        nuestros servidores.
      </p>

      <h2>Contratación electrónica</h2>
      <p>
        El acuerdo para usar {SITE_NAME} se perfecciona al iniciar sesión, y la suscripción
        Pro al completar el pago con Stripe. Antes de cada paso puedes revisar los Términos
        del servicio, que permanecen disponibles en este sitio, y corregir lo que hayas
        introducido. No archivamos una copia separada de cada contrato; Stripe te envía por
        email un recibo de cada pago. El contrato está disponible en español y en inglés.
      </p>

      <h2>Uso del sitio</h2>
      <p>
        Puedes navegar por el sitio y usar la aplicación conforme a los Términos. No puedes
        usarlo para fines ilícitos, intentar vulnerar su seguridad ni reproducir su contenido
        más allá de lo que exige la navegación.
      </p>

      <h2>Propiedad intelectual e industrial</h2>
      <p>
        El nombre {SITE_NAME}, el logotipo, el software, los textos y el diseño son nuestros o
        los usamos bajo licencia. Nada de lo aquí expuesto te concede una licencia sobre ellos
        más allá del uso del servicio. Los datos que introduces siguen siendo tuyos.
      </p>

      <h2>Enlaces</h2>
      <p>
        Los enlaces a otros sitios se ofrecen por comodidad; no los controlamos y no
        respondemos de su contenido.
      </p>

      <h2>Responsabilidad</h2>
      <p>
        Trabajamos para que el sitio sea exacto y esté disponible, pero no podemos garantizar
        que esté libre de errores o interrupciones, y no respondemos de los daños derivados
        de su uso más allá de lo que imponga la ley. Los Términos del servicio establecen las
        reglas de responsabilidad de la aplicación.
      </p>

      <h2>Alojamiento</h2>
      <p>
        El sitio está alojado en Vercel, Inc. (Estados Unidos, con servidores en Europa). Los
        datos de la aplicación los almacena Supabase, Inc. en {e.hostingRegion}.
      </p>

      <h2>Legislación</h2>
      <p>Este aviso se rige por la legislación española.</p>
    </>
  );
}
