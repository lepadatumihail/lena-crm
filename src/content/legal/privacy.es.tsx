import Link from "next/link";

import { LEGAL_ENTITY } from "@/lib/legal";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";

export function PrivacyEs() {
  const e = LEGAL_ENTITY;
  return (
    <>
      <p>
        Esta política explica qué hace {SITE_NAME} con los datos personales: los tuyos como
        agente que usa el servicio y los que tú guardas sobre tus propios clientes. Sigue el
        RGPD y la Ley Orgánica 3/2018 (LOPDGDD), en lenguaje claro.
      </p>

      <h2>1. Quién es el responsable</h2>
      <p>{SITE_NAME} es un servicio de:</p>
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
      <p>
        De los datos de tu cuenta somos el responsable del tratamiento. De los datos que
        guardas sobre tus clientes actuamos como encargado del tratamiento, siguiendo tus
        instrucciones (apartado 4). No hemos designado delegado de protección de datos;
        escribe al email indicado para cualquier cuestión sobre datos personales.
      </p>

      <h2>2. Información básica</h2>
      <table>
        <tbody>
          <tr>
            <th scope="row">Responsable</th>
            <td>
              {e.name}, {e.email}
            </td>
          </tr>
          <tr>
            <th scope="row">Finalidades</th>
            <td>
              Gestionar tu cuenta y el CRM; facturar las suscripciones Pro; mantener el
              servicio seguro; atender el soporte; medir el uso de la web pública.
            </td>
          </tr>
          <tr>
            <th scope="row">Legitimación</th>
            <td>
              El contrato contigo; nuestras obligaciones legales (fiscales y contables);
              nuestro interés legítimo en la seguridad y en entender cómo se usa el servicio;
              tu consentimiento cuando te lo pidamos.
            </td>
          </tr>
          <tr>
            <th scope="row">Destinatarios</th>
            <td>
              Los proveedores que alojan y hacen funcionar el servicio (apartado 6); las
              autoridades cuando la ley lo exija. Nadie más.
            </td>
          </tr>
          <tr>
            <th scope="row">Derechos</th>
            <td>
              Acceso, rectificación, supresión, limitación, portabilidad y oposición, por
              email; reclamación ante la Agencia Española de Protección de Datos (apartado
              9).
            </td>
          </tr>
          <tr>
            <th scope="row">Información adicional</th>
            <td>Apartados 3 a 13.</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Tus datos</h2>
      <h3>Qué recogemos</h3>
      <ul>
        <li>
          Cuenta: tu dirección de email; tu nombre, si inicias sesión con Google o lo añades;
          el idioma de la interfaz; y el método de acceso que usas (Google o un código de un
          solo uso por email). Al iniciar sesión con Google, Google nos facilita tu email y tu
          nombre, que usamos únicamente para crear y reconocer tu cuenta. Nunca vemos ni
          guardamos una contraseña.
        </li>
        <li>
          Facturación, solo en Pro: los datos que Stripe recoge al pagar, como nombre,
          dirección de facturación, NIF-IVA y método de pago, y el estado de tu suscripción.
          Los números de tarjeta van directamente a Stripe y nunca pasan por nuestros
          servidores.
        </li>
        <li>
          Referidos: tu código de invitación, quién te invitó y a quién invitaste, y los
          créditos obtenidos.
        </li>
        <li>
          Uso del servicio: los clientes, propiedades, visitas, ofertas, citas, plantillas,
          análisis de la calculadora y documentos que creas, y cuándo lo hiciste.
        </li>
        <li>
          Datos técnicos: dirección IP, navegador y tipo de dispositivo en registros de
          servidor de corta duración, y estadísticas agregadas y sin cookies de la web pública
          (apartado 8). Si aceptas el aviso de cookies, también el registro del píxel de Meta
          de las páginas públicas que has visto (apartado 8).
        </li>
        <li>Soporte: lo que nos escribes por email.</li>
      </ul>
      <h3>Para qué, y con qué base</h3>
      <ul>
        <li>
          Prestarte el servicio, identificarte, recordar tu idioma y enviarte los emails que el
          servicio necesita (códigos de acceso, los recordatorios que configures, avisos de
          facturación): ejecución del contrato contigo (art. 6.1.b RGPD).
        </li>
        <li>
          Cobrar las suscripciones Pro, emitir facturas y llevar la contabilidad: el contrato
          y nuestras obligaciones legales fiscales y mercantiles (art. 6.1.c).
        </li>
        <li>
          Mantener el servicio seguro, evitar abusos y resolver problemas: nuestro interés
          legítimo en ofrecer un servicio fiable (art. 6.1.f).
        </li>
        <li>
          Entender cómo se usa la web pública: nuestro interés legítimo, con estadísticas que
          no te identifican.
        </li>
        <li>
          Medir nuestra publicidad en Facebook e Instagram con el píxel de Meta: tu
          consentimiento, dado en el aviso de cookies de la web pública y revocable en
          cualquier momento desde el enlace Cookies del pie de página (art. 6.1.a; apartado
          8).
        </li>
        <li>Gestionar el programa de referidos en el que participas: el contrato contigo.</li>
        <li>
          Enviarte novedades de {SITE_NAME}: solo si nos lo pides, y puedes darte de baja en
          cualquier momento (consentimiento, art. 6.1.a). Hoy no enviamos emails
          comerciales.
        </li>
      </ul>
      <p>
        El email es necesario para abrir una cuenta; sin él no podemos prestar el servicio.
        No tomamos decisiones automatizadas con efectos jurídicos sobre ti ni elaboramos
        perfiles.
      </p>

      <h2>4. Los datos de tus clientes</h2>
      <p>
        Cuando añades un comprador o vendedor a {SITE_NAME}, tú decides qué guardar: nombre,
        teléfono, email, idioma, nacionalidad, presupuesto y preferencias, notas, las
        propiedades que visita, ofertas, fechas de reserva, citas y los documentos que subas,
        como contratos o documentos de identidad.
      </p>
      <p>
        De estos datos tú eres el responsable y nosotros tu encargado del tratamiento. En la
        práctica:
      </p>
      <ul>
        <li>
          Solo los tratamos para prestarte el servicio y según tus instrucciones, conforme al
          contrato de encargo incluido en los{" "}
          <Link href={marketingPath("terms", "es")}>Términos del servicio</Link>.
        </li>
        <li>
          Tú respondes de tener una base jurídica para conservarlos, de informar a tus
          clientes de cómo se usan sus datos (arts. 13 y 14 RGPD), de mantenerlos exactos y de
          las obligaciones de conservación que te apliquen, como las de prevención del
          blanqueo de capitales para agentes inmobiliarios.
        </li>
        <li>
          Solo tú puedes verlos. Los datos de cada agente están aislados mediante seguridad a
          nivel de fila en la base de datos; otros agentes, incluidos compañeros de la misma
          agencia, no pueden acceder a tu cartera. Nosotros solo accedemos cuando nos pides
          soporte o cuando es estrictamente necesario para operar el servicio.
        </li>
        <li>
          Si uno de tus clientes nos contacta sobre sus datos, le remitiremos a ti y te
          ayudaremos a responder.
        </li>
      </ul>

      <h2>5. Funciones de IA</h2>
      <p>
        Dos funciones usan un modelo de lenguaje de un tercero: pegar una solicitud de un
        portal para crear un lead y redactar mensajes o emails a un cliente. Solo se ejecutan
        cuando pulsas el botón.
      </p>
      <ul>
        <li>
          Qué se envía: para la captura de leads, el texto que pegas. Para los borradores, el
          nombre del cliente, si compra o vende, su fase en el pipeline y la etiqueta de
          agencia, presupuesto y preferencias, su última visita u oferta, fechas de reserva y
          cualquier borrador o instrucción que escribas.
        </li>
        <li>
          Quién lo recibe: OpenRouter, Inc. (Estados Unidos), que dirige la petición a los
          modelos de OpenAI. Según sus condiciones para empresas, el contenido no se usa para
          entrenar modelos y, como mucho, se conserva brevemente para control de abusos.
        </li>
        <li>
          Lo que vuelve es una sugerencia. Nada llega a tu cliente hasta que lo lees y lo
          envías tú, y el modelo no ve nada más allá de la petición.
        </li>
      </ul>
      <p>
        Si prefieres no enviar datos de clientes a un proveedor de IA, no uses estas dos
        funciones; el resto del servicio funciona sin ellas.
      </p>

      <h2>6. Con quién compartimos datos</h2>
      <p>
        No vendemos datos personales ni los compartimos con fines publicitarios. El servicio
        funciona sobre estos proveedores, cada uno vinculado por un contrato de encargo del
        tratamiento:
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Proveedor</th>
            <th scope="col">Para qué</th>
            <th scope="col">Dónde</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase, Inc.</td>
            <td>Base de datos, acceso y almacenamiento de archivos</td>
            <td>{e.hostingRegion}</td>
          </tr>
          <tr>
            <td>Vercel, Inc.</td>
            <td>Alojamiento, entrega de contenidos y estadísticas web sin cookies</td>
            <td>
              Estados Unidos (Marco de Privacidad de Datos UE-EE. UU., con cláusulas
              contractuales tipo como respaldo), con servidores perimetrales en todo el
              mundo
            </td>
          </tr>
          <tr>
            <td>Stripe Payments Europe, Ltd.</td>
            <td>Pagos, facturas e IVA de Pro</td>
            <td>Irlanda y Estados Unidos (Marco de Privacidad de Datos)</td>
          </tr>
          <tr>
            <td>Google LLC</td>
            <td>
              Inicio de sesión con Google; Google Calendar, si te suscribes a tu calendario
            </td>
            <td>Estados Unidos (Marco de Privacidad de Datos)</td>
          </tr>
          <tr>
            <td>Meta Platforms Ireland Limited</td>
            <td>
              Medición de nuestros anuncios en Facebook e Instagram con el píxel de Meta, solo
              si lo aceptas (apartado 8)
            </td>
            <td>Irlanda y Estados Unidos (Marco de Privacidad de Datos)</td>
          </tr>
          <tr>
            <td>OpenRouter, Inc. y OpenAI</td>
            <td>Redacción con IA y captura de leads (apartado 5)</td>
            <td>Estados Unidos (cláusulas contractuales tipo)</td>
          </tr>
          <tr>
            <td>Resend (Plus Five Five, Inc.)</td>
            <td>Envío de códigos de acceso y emails del servicio</td>
            <td>Estados Unidos (Marco de Privacidad de Datos)</td>
          </tr>
        </tbody>
      </table>
      <p>
        También podemos comunicar datos cuando la ley lo exija, para defender nuestros
        derechos o a un sucesor si el negocio cambia de manos, en cuyo caso esta política
        seguirá aplicándose.
      </p>

      <h2>7. Transferencias internacionales</h2>
      <p>
        Tu base de datos y tus archivos se almacenan en la Unión Europea. Algunos de los
        proveedores anteriores tratan datos en Estados Unidos. Cuando lo hacen, la
        transferencia se ampara en su certificación bajo el Marco de Privacidad de Datos
        UE-EE. UU. o en las cláusulas contractuales tipo de la Comisión Europea, según se
        indica en la tabla. Puedes pedirnos una copia de las garantías.
      </p>

      <h2>8. Cookies y almacenamiento en tu dispositivo</h2>
      <p>
        {SITE_NAME} usa sin preguntar las cookies necesarias para funcionar y para recordar
        tus preferencias. La única excepción es el píxel de Meta en la web pública, que mide
        nuestros anuncios en Facebook e Instagram y solo se activa si lo aceptas en el aviso
        de cookies. Nada más en este sitio te rastrea en otras webs.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Finalidad</th>
            <th scope="col">Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>sb-… (Supabase)</td>
            <td>Mantiene tu sesión iniciada</td>
            <td>Se renueva mientras usas el servicio; hasta 400 días</td>
          </tr>
          <tr>
            <td>NEXT_LOCALE</td>
            <td>Recuerda tu idioma</td>
            <td>Un año</td>
          </tr>
          <tr>
            <td>sidebar_state</td>
            <td>Recuerda si la barra lateral está abierta</td>
            <td>Siete días</td>
          </tr>
          <tr>
            <td>lw_ref</td>
            <td>
              Recuerda el enlace de invitación desde el que llegaste, para atribuir el
              referido
            </td>
            <td>30 minutos</td>
          </tr>
          <tr>
            <td>lw_consent</td>
            <td>
              Recuerda tu respuesta al aviso de cookies, en el almacenamiento local de tu
              navegador
            </td>
            <td>Un año</td>
          </tr>
          <tr>
            <td>_fbp, _fbc (píxel de Meta, solo si lo aceptas)</td>
            <td>
              Permiten a Meta saber qué visitas llegaron desde nuestros anuncios y en qué
              anuncio se hizo clic
            </td>
            <td>90 días</td>
          </tr>
        </tbody>
      </table>
      <p>
        Cuando instalas {SITE_NAME} en el móvil, el navegador guarda además una copia de las
        páginas abiertas recientemente para que puedas leerlas sin conexión. Puedes borrar todo
        esto cuando quieras eliminando los datos del sitio en tu navegador o desinstalando la
        app.
      </p>
      <p>
        Las estadísticas de la web provienen de Vercel Web Analytics, que no instala cookies
        ni guarda nada en tu dispositivo: cuenta las visitas con un identificador cifrado que
        se descarta en menos de un día.
      </p>
      <p>
        Si aceptas el aviso de cookies, el píxel de Meta (Meta Platforms Ireland Limited) se
        carga en las páginas públicas y envía a Meta las páginas que ves en ellas, tu dirección
        IP y datos del navegador, y las cookies de Meta que ya tenga tu dispositivo, para que
        podamos saber si nuestros anuncios traen agentes hasta aquí. Nunca se activa en las
        páginas que requieren iniciar sesión. Puedes cambiar tu respuesta cuando quieras desde
        el enlace Cookies del pie de página: si lo rechazas, deja de funcionar al momento y sus
        cookies caducan por sí solas. Cómo usa Meta estos datos se explica en su propia
        política de privacidad, en facebook.com/privacy/policy.
      </p>

      <h2>9. Tus derechos</h2>
      <p>
        Puedes pedirnos acceder a tus datos, corregirlos, suprimirlos o exportarlos, limitar u
        oponerte a su uso y retirar cualquier consentimiento que hayas dado. Puedes descargar
        tú mismo una copia de tus datos en cualquier momento desde Ajustes → Tus datos.
        Escribe a {e.email}. Podemos pedirte que confirmes tu identidad, y respondemos en el
        plazo de un mes.
      </p>
      <p>
        Puedes borrar clientes, documentos y análisis tú mismo en cualquier momento. Para
        cerrar tu cuenta, escríbenos: eliminamos tus datos en 30 días, salvo lo que debamos
        conservar por ley (apartado 10).
      </p>
      <p>
        Si crees que no hemos tratado tus datos correctamente, puedes reclamar ante la Agencia
        Española de Protección de Datos (C/ Jorge Juan 6, 28001 Madrid,{" "}
        <a href="https://www.aepd.es" target="_blank" rel="noreferrer">
          www.aepd.es
        </a>
        ) o ante la autoridad de control de tu lugar de residencia.
      </p>

      <h2>10. Cuánto tiempo conservamos los datos</h2>
      <ul>
        <li>
          Tu cuenta y todo lo que contiene: mientras esté abierta y hasta 30 días después de
          que nos pidas cerrarla. Pasar de Pro a Gratis no borra nada.
        </li>
        <li>
          Facturas y registros de pago: seis años, como exige la normativa mercantil y fiscal
          española, bloqueados y sin ningún otro uso.
        </li>
        <li>Registros de servidor: hasta 30 días.</li>
        <li>
          Copias de seguridad: se sobrescriben en el ciclo normal de nuestro proveedor, en un
          máximo de 30 días desde el borrado.
        </li>
      </ul>

      <h2>11. Seguridad</h2>
      <p>
        Los datos viajan cifrados (TLS) y se almacenan cifrados en reposo. Los datos de cada
        agente están separados mediante seguridad a nivel de fila en la base de datos; las
        claves de servidor nunca llegan al navegador; los datos de tarjeta los gestiona
        íntegramente Stripe. El acceso a producción se limita a lo que exige operar el
        servicio. Ningún sistema es perfectamente seguro: si una brecha te afecta, te lo
        comunicaremos a ti y a la Agencia Española de Protección de Datos como exige la ley.
      </p>

      <h2>12. Menores</h2>
      <p>
        {SITE_NAME} es una herramienta profesional para adultos. No mantenemos a sabiendas
        cuentas de menores de 18 años.
      </p>

      <h2>13. Cambios</h2>
      <p>
        Publicaremos aquí cualquier nueva versión con su fecha. Si un cambio te afecta de
        forma sustancial, te lo comunicaremos por email antes de que entre en vigor.
      </p>
    </>
  );
}
