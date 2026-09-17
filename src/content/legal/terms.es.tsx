import Link from "next/link";

import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES } from "@/lib/billing";
import { LEGAL_ENTITY } from "@/lib/legal";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function TermsEs() {
  const e = LEGAL_ENTITY;
  const privacy = marketingPath("privacy", "es");
  return (
    <>
      <p>
        Estos términos son el acuerdo entre tú y {e.name} para el uso de {SITE_NAME} en{" "}
        {SITE_URL}. Los aceptas al iniciar sesión. Si no estás de acuerdo con ellos, no uses
        el servicio.
      </p>

      <h2>1. Quién puede usar {SITE_NAME}</h2>
      <p>
        {SITE_NAME} es una herramienta para profesionales inmobiliarios. Confirmas que eres
        mayor de 18 años, que usas el servicio en tu actividad profesional como agente o
        agencia y que no actúas como consumidor. Una persona, una cuenta; respondes de todo
        lo que se haga con ella. Protege tu cuenta de Google y tu email, porque son tus
        llaves.
      </p>

      <h2>2. El servicio</h2>
      <p>
        {SITE_NAME} es una aplicación web para gestionar compradores y vendedores,
        propiedades, visitas, ofertas, documentos, citas y mensajes de seguimiento, con
        redacción opcional mediante IA. La mejoramos continuamente, lo que significa que las
        funciones cambian; no retiraremos una función esencial sin avisar. Las funciones
        marcadas como beta pueden retirarse en cualquier momento.
      </p>

      <h2>3. Planes y precios</h2>
      <ul>
        <li>
          Gratis: todas las funciones, hasta {FREE_CLIENT_LIMIT} clientes (compradores y
          vendedores en conjunto), sin tarjeta y sin límite de tiempo.
        </li>
        <li>
          Pro: clientes ilimitados por {PRICES.standard.monthly} € al mes o{" "}
          {PRICES.standard.yearly} € al año. Los precios se muestran sin IVA; el IVA aplicable
          se añade al pagar según tu país y tu NIF-IVA.
        </li>
        <li>
          Precio fundador: los primeros {FOUNDING_CAP} agentes de pago obtienen Pro por{" "}
          {PRICES.founding.monthly} € al mes, o {PRICES.founding.yearly} € al año, mientras su
          suscripción se mantenga activa sin interrupción. Si se interrumpe, al volver se
          aplica el precio vigente.
        </li>
      </ul>
      <p>
        Podemos cambiar los precios avisándote por email con al menos 30 días de antelación.
        El nuevo precio se aplica desde tu siguiente renovación, y puedes cancelar antes.
      </p>

      <h2>4. Pago, renovación y pagos fallidos</h2>
      <p>
        Pro se cobra por adelantado a través de Stripe, de forma mensual o anual, y se renueva
        automáticamente hasta que canceles. Al pago en sí se le aplican las condiciones de
        Stripe. Si un pago falla, lo reintentamos durante unos días y te avisamos por email;
        si sigue fallando, tu cuenta vuelve al plan Gratis. No se borra nada cuando eso
        ocurre: conservas todo y simplemente no puedes añadir clientes por encima del límite
        del plan Gratis.
      </p>

      <h2>5. Cancelación y reembolsos</h2>
      <p>
        Cancela cuando quieras desde Facturación, que abre el portal de cliente de Stripe. La
        cancelación surte efecto al final del periodo que has pagado: conservas Pro hasta
        entonces y después vuelves al plan Gratis. No reembolsamos periodos parciales, salvo
        que la ley lo exija o que nosotros pongamos fin a tu plan Pro sin causa, en cuyo caso
        te devolvemos la parte no disfrutada a prorrata.
      </p>

      <h2>6. Programa de referidos</h2>
      <p>
        Cada cuenta tiene un enlace de invitación. Cuando alguien se registra con el tuyo, se
        convierte en suscriptor Pro de pago y lo sigue siendo durante el periodo de
        cualificación indicado en la página de Referidos, tú y esa persona recibís un mes
        gratis de Pro cada uno, aplicado como crédito en la siguiente factura. Los créditos no
        tienen valor en efectivo ni son transferibles. Los referidos de ti mismo, de cuentas
        que controles u obtenidos mediante spam o afirmaciones engañosas no generan nada y
        pueden suponer tu exclusión del programa. Podemos modificar o terminar el programa
        hacia el futuro con aviso previo; los créditos ya obtenidos se mantienen.
      </p>

      <h2>7. Tus datos y los datos de tus clientes</h2>
      <p>
        Todo lo que introduces te pertenece. Nos das el permiso necesario para alojarlo,
        tratarlo, respaldarlo y mostrarlo con el fin de prestar el servicio, y nada más. Tú
        eres el responsable del tratamiento de los datos personales de tus clientes y
        nosotros tu encargado, conforme al contrato de encargo del anexo. Garantizas que:
      </p>
      <ul>
        <li>
          tienes una base jurídica para conservar y usar los datos de cada cliente en{" "}
          {SITE_NAME}, y les has informado como exige el RGPD, incluido que usas software y
          asistencia de IA para gestionar y redactar tus comunicaciones con ellos;
        </li>
        <li>
          solo guardas lo que tu trabajo necesita, incluidos documentos de identidad cuando
          la normativa de prevención del blanqueo lo exige, y los tratas con el cuidado que
          merecen;
        </li>
        <li>
          tienes derecho a contactar con las personas a las que escribes, y tus mensajes
          cumplen las normas sobre comunicaciones comerciales y las condiciones de WhatsApp y
          de tu proveedor de email.
        </li>
      </ul>
      <p>
        Puedes borrar clientes, documentos y análisis en cualquier momento y descargar una
        copia de tus datos cuando quieras desde Ajustes → Tus datos, en un libro de Excel y en
        archivos CSV. Si quieres una copia de los archivos que subiste, pídenosla y te la
        enviaremos en un plazo de 30 días.
      </p>

      <h2>8. Uso aceptable</h2>
      <p>
        No uses {SITE_NAME} para infringir la ley, enviar mensajes masivos no solicitados,
        almacenar datos que no tienes derecho a conservar, dañar o suplantar a nadie ni subir
        código malicioso. No extraigas datos de forma automatizada, ni sondees, copies,
        revendas o hagas ingeniería inversa del servicio, ni lo uses para construir un
        producto competidor. Podemos suspender una cuenta que ponga en riesgo a otros o al
        servicio, y te diremos por qué.
      </p>

      <h2>9. Funciones de IA</h2>
      <p>
        La captura de leads y la redacción de mensajes usan modelos de lenguaje de terceros
        (apartado 5 de la <Link href={privacy}>Política de privacidad</Link>). Su resultado es
        una sugerencia: puede ser incorrecto, incompleto o inadecuado, y debes leerlo antes
        de confiar en él o enviarlo. Tú eres el autor y el remitente de cada mensaje. No
        garantizamos ningún resultado de estas funciones, y podemos cambiar de proveedor o
        limitar su uso para mantener el servicio justo para todos.
      </p>

      <h2>10. Servicios de terceros</h2>
      <p>
        El inicio de sesión con Google, Google Calendar, WhatsApp, Stripe y los portales
        inmobiliarios pertenecen a sus titulares y funcionan bajo sus propias condiciones.{" "}
        {SITE_NAME} abre WhatsApp en tu dispositivo con un mensaje ya redactado; el mensaje lo
        envías tú, desde tu propia cuenta de WhatsApp.
      </p>

      <h2>11. Disponibilidad y soporte</h2>
      <p>
        Intentamos que {SITE_NAME} esté disponible en todo momento, pero no podemos
        garantizarlo, y podemos pausarlo brevemente por mantenimiento. El soporte es por email
        en {e.email}. La calculadora de rentabilidad ofrece estimaciones a partir de las
        cifras que introduces; no es asesoramiento financiero, jurídico ni fiscal.
      </p>

      <h2>12. Propiedad intelectual</h2>
      <p>
        {SITE_NAME}, su código, su diseño y su marca nos pertenecen. Solo puedes usarlos como
        parte del servicio. Si nos envías ideas o sugerencias, podemos usarlas sin deberte
        nada.
      </p>

      <h2>13. Fin del acuerdo</h2>
      <p>
        Puedes dejarlo cuando quieras: cancela Pro y, si lo deseas, pídenos que eliminemos tu
        cuenta. Nosotros podemos poner fin al acuerdo si incumples estos términos y no lo
        corriges en los 15 días siguientes a nuestro aviso, o de inmediato ante un
        incumplimiento grave. Al cerrarse la cuenta, tus datos se eliminan en 30 días
        (apartado 10 de la Política de privacidad). Exporta antes lo que necesites (Ajustes →
        Tus datos).
      </p>

      <h2>14. Garantías y responsabilidad</h2>
      <p>
        {SITE_NAME} se presta tal cual. En la medida en que la ley lo permita, no prometemos
        que cubra todas las necesidades ni que esté libre de errores, y no respondemos de
        pérdidas indirectas, lucro cesante, operaciones perdidas ni datos de los que no
        hicieras copia. Nuestra responsabilidad total por todo lo derivado de este acuerdo se
        limita a lo que nos hayas pagado en los 12 meses anteriores a la reclamación, o a 100
        € si no has pagado nada. Nada en estos términos limita la responsabilidad que no
        puede limitarse conforme a la ley española, incluida la derivada de dolo.
      </p>

      <h2>15. Tu responsabilidad frente a nosotros</h2>
      <p>
        Si un tercero, incluido uno de tus clientes, presenta una reclamación contra nosotros
        por datos que almacenaste o mensajes que enviaste a través de {SITE_NAME}, asumirás
        los costes razonables y los daños que se deriven.
      </p>

      <h2>16. Cambios en estos términos</h2>
      <p>
        Podemos actualizar estos términos. Para los cambios sustanciales te avisaremos por
        email al menos 30 días antes de que entren en vigor; seguir usando el servicio a
        partir de esa fecha supone aceptarlos, y puedes cancelar antes si no estás de
        acuerdo.
      </p>

      <h2>17. Ley y jurisdicción</h2>
      <p>
        Este acuerdo se rige por la ley española. Cualquier controversia la conocerán los
        juzgados y tribunales españoles competentes conforme a las normas que te resulten
        aplicables. Nuestro establecimiento figura en el{" "}
        <Link href={marketingPath("legalNotice", "es")}>Aviso legal</Link>.
      </p>

      <h2>18. Disposiciones generales</h2>
      <p>
        Estos términos, la <Link href={privacy}>Política de privacidad</Link> y el Aviso legal
        constituyen el acuerdo completo. Si una cláusula fuera nula, el resto se mantiene. No
        puedes ceder tu cuenta; nosotros podemos ceder este acuerdo a un sucesor del negocio.
        Las notificaciones se envían por email a la dirección de tu cuenta. Estos términos
        existen en inglés y en español; en caso de discrepancia prevalece la versión inglesa.
      </p>

      <h2>Anexo: contrato de encargo del tratamiento</h2>
      <p>
        Este anexo es el contrato que exige el artículo 28 del RGPD entre tú, como
        responsable, y nosotros, como encargado. Cubre todos los datos personales que guardas
        en {SITE_NAME} sobre tus clientes y contactos.
      </p>
      <h3>A. Qué se trata</h3>
      <ul>
        <li>
          Objeto y duración: alojamiento y tratamiento de los datos de tu CRM mientras tengas
          una cuenta.
        </li>
        <li>
          Naturaleza y finalidad: almacenamiento, organización, visualización, búsqueda,
          cruce, redacción de mensajes, recordatorios y copias de seguridad, para que puedas
          ejercer tu actividad inmobiliaria.
        </li>
        <li>
          Datos: identificativos y de contacto, idioma, nacionalidad, presupuestos y
          preferencias, notas, registros de propiedades y visitas, ofertas, fechas de reserva,
          citas, documentos que subas (que pueden incluir documentos de identidad y contratos)
          y mensajes que redactes.
        </li>
        <li>Interesados: tus compradores, vendedores, contactos potenciales y sus contactos.</li>
      </ul>
      <h3>B. Nuestras obligaciones</h3>
      <ul>
        <li>
          Tratamos los datos únicamente siguiendo tus instrucciones documentadas, que son
          estos términos y tu uso del servicio, salvo que el Derecho de la UE o español exija
          otra cosa, en cuyo caso te informaremos antes cuando nos esté permitido.
        </li>
        <li>
          Todas las personas que acceden a los datos por nuestra cuenta están sujetas a
          confidencialidad.
        </li>
        <li>Aplicamos las medidas de seguridad del apartado C y las mantenemos actualizadas.</li>
        <li>
          Te ayudamos a atender las solicitudes de los interesados y a cumplir tus
          obligaciones de seguridad, notificación de brechas y evaluaciones de impacto, en
          proporción a lo que tratamos.
        </li>
        <li>
          Te informaremos sin dilación indebida tras tener conocimiento de una violación de la
          seguridad que afecte a tus datos, con toda la información de que dispongamos.
        </li>
        <li>
          Al finalizar el servicio eliminaremos todos los datos en 30 días, o te los
          devolveremos antes si lo pides. Solo conservaremos lo que exija la ley,
          bloqueado, mientras puedan derivarse responsabilidades.
        </li>
        <li>
          Pondremos a tu disposición la información necesaria para demostrar el cumplimiento
          y permitiremos auditorías: una vez al año, con preaviso razonable, a tu cargo y sin
          exponer datos de otros agentes.
        </li>
      </ul>
      <h3>C. Medidas de seguridad</h3>
      <p>
        Cifrado en tránsito y en reposo; seguridad a nivel de fila que separa los datos de
        cada agente; acceso mediante Google o códigos de un solo uso, sin contraseñas
        almacenadas; secretos solo en servidor; acceso a producción con privilegios mínimos;
        copias de seguridad del proveedor; registro de los accesos administrativos. Detalles
        completos a petición.
      </p>
      <h3>D. Subencargados</h3>
      <p>
        Autorizas a los proveedores enumerados en el apartado 6 de la{" "}
        <Link href={privacy}>Política de privacidad</Link>. Te avisaremos por email con al
        menos 30 días de antelación antes de añadir o sustituir uno. Si te opones por motivos
        razonables de protección de datos en un plazo de 14 días y no podemos resolverlo,
        puedes poner fin al acuerdo y te reembolsaremos el periodo Pro no disfrutado. Cada
        subencargado está sujeto a obligaciones de protección de datos equivalentes a las
        nuestras, y seguimos siendo responsables de ellos.
      </p>
      <h3>E. Transferencias</h3>
      <p>
        Los datos se almacenan en la Unión Europea. Las transferencias a subencargados fuera
        del EEE se amparan en el Marco de Privacidad de Datos UE-EE. UU. o en las cláusulas
        contractuales tipo, según se indica en la Política de privacidad.
      </p>
      <h3>F. Tus obligaciones</h3>
      <p>
        Respondes de la licitud de los datos y de tus instrucciones, de informar a los
        interesados y de atender sus solicitudes. No nos darás instrucciones para tratar
        datos de forma contraria a la ley.
      </p>
      <h3>G. Responsabilidad</h3>
      <p>
        El apartado 14 se aplica a este anexo, sin perjuicio de lo que el RGPD establece entre
        responsable y encargado.
      </p>
    </>
  );
}
