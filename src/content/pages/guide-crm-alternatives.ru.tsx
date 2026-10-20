import Link from "next/link";

import { intlTag } from "@/i18n/config";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES } from "@/lib/billing";
import { marketingPath } from "@/lib/routes";
import { CHECKED, PUBLISHED } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { SOURCES as S } from "@/content/pages/crm-comparison.sources";

const L = "ru";

/** The day the page was first published, which stays its datePublished. */
const FIRST_PUBLISHED = PUBLISHED.guideCrmAlternatives;

/**
 * The day every price and limit was last checked on the vendors' own sites.
 * It is also the "Updated" date, dateModified and the sitemap's lastmod, so
 * the quarterly re-check (plan 025) bumps CHECKED, never PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guideCrmAlternatives ?? FIRST_PUBLISHED;

const AS_OF = new Intl.DateTimeFormat(intlTag(L), {
  dateStyle: "long",
  timeZone: "UTC",
}).format(new Date(LAST_CHECKED));

/**
 * Первая колонка обеих таблиц — названия CRM и подписи строк: в узкой таблице
 * они переносятся по пробелу, но не внутри слова, как разрешает правило для
 * русских таблиц в globals.css (иначе на телефоне колонка сжимается до одной
 * буквы и «Цена» рвётся на две строки).
 */
const BRAND_CELL = "align-top [overflow-wrap:normal]! hyphens-manual!";

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function Body() {
  return (
    <>
      <Callout title={`Проверено ${AS_OF}`}>
        <ul>
          <li>
            Все цены, лимиты и функции ниже взяты с сайта или из справочного центра самого
            разработчика; ссылка стоит там, где они приводятся. Если разработчик чего-то не
            сообщает, мы так и пишем.
          </li>
          <li>Цены указаны без IVA, если не отмечено «IVA включён».</li>
          <li>
            {SITE_NAME} публикует это руководство и сам входит в число описанных в нём
            альтернатив.
          </li>
        </ul>
      </Callout>

      <h2>Witei и Inmovilla: главное</h2>
      <p>
        Обе — CRM для агентств недвижимости: они хранят объекты агентства, выгружают их на
        порталы, ведут его сайт и заносят в базу заявки, которые приходят в ответ. Разница — в
        модели цен, в idealista и в работе с другими агентствами.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Параметр</span>
            </th>
            <th scope="col">Witei</th>
            <th scope="col">Inmovilla</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={BRAND_CELL}>Владелец</th>
            <td>Witei Solutions SL, входит в Fotocasa Group (Scout24)</td>
            <td>Aplicaciones Inmovilla SL, принадлежит idealista</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Бесплатный тариф</th>
            <td>Да: 250 контактов, 10 объектов, 1 пользователь</td>
            <td>Нет; бесплатный пробный период 15 дней</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Цена</th>
            <td>25, 45 или 65 € в месяц за модуль; контакты и объекты вместе — от 50 €</td>
            <td>79 € в месяц или 790 € в год</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Пользователи</th>
            <td>
              1 на бесплатном тарифе, 10 в модуле контактов Normal; 5 € в месяц за каждого
              дополнительного
            </td>
            <td>До 7 включено; 12 € в месяц за каждого дополнительного</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>idealista</th>
            <td>С февраля 2022 года новые интеграции не подключаются</td>
            <td>Интеграция в реальном времени</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Заявки с порталов</th>
            <td>SmartInbox читает пересланные письма, начиная с тарифа Normal</td>
            <td>Письма на собственный ящик Inmovilla могут создать клиента и запрос</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>WhatsApp</th>
            <td>Открывает чат с контактом</td>
            <td>Открывает чат; платный ящик входящих с подключением по QR-коду</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Другие агентства</th>
            <td>Обмена между независимыми агентствами нет</td>
            <td>«Круги» (группы MLS) и соглашения о сотрудничестве</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Экспорт</th>
            <td>Excel или CSV</td>
            <td>Excel, CSV или XML</td>
          </tr>
        </tbody>
      </table>

      <h3>Witei</h3>
      <ul>
        <li>
          <strong>Тарифы:</strong> цена складывается из модулей — контакты, объекты и сайт — и
          берётся за рабочее пространство, а не за пользователя. Normal стоит 25 € в месяц за
          модуль, Premium — 45 €, Enterprise — 65 €; сайт — 19, 29 или 49 €. Без минимального
          срока, без платы за подключение и с гарантией возврата денег в течение 15 дней (
          <Source href={S.witeiPrices}>цены Witei</Source>). Дополнительный пользователь стоит
          5 € в месяц (<Source href={S.witeiAddOns}>дополнительные опции</Source>).
        </li>
        <li>
          <strong>Бесплатный тариф:</strong> без ограничения по времени, на 250 контактов,
          10 объектов и одного пользователя, с подбором между ними. Чего нет: выгрузки на
          порталы, SmartInbox, электронной почты и Google Calendar. Аккаунты, у которых только
          бесплатные тарифы, могут закрыть за неактивность без предупреждения (
          <Source href={S.witeiPrices}>цены Witei</Source>).
        </li>
        <li>
          <strong>Порталы:</strong> Fotocasa Pro (охватывает fotocasa, habitaclia и milanuncios),
          pisos.com, Kyero, Rightmove, Zoopla, thinkSPAIN, Green-Acres и другие (
          <Source href={S.witeiPortals}>интеграции</Source>). Но не idealista: с февраля 2022 года
          Witei не может подключать новые интеграции с idealista, хотя старые продолжают работать
          (<Source href={S.witeiIdealista}>справка Witei</Source>).
        </li>
        <li>
          <strong>Заявки:</strong> у каждого рабочего пространства есть адрес SmartInbox, и
          письма с порталов, отправленные или пересланные на него, становятся контактами. Для
          автоматического ответа нужен тариф контактов Normal или выше (
          <Source href={S.witeiSmartInbox}>SmartInbox</Source>).
        </li>
        <li>
          <strong>Другие агентства:</strong> у Witei нет инструментов для сотрудничества между
          независимыми агентствами, и его условия такое сотрудничество запрещают. Рабочие
          пространства можно связать только внутри одной компании (
          <Source href={S.witeiNoCollaboration}>справка Witei</Source>).
        </li>
        <li>
          <strong>Кто может подключиться:</strong> те, чья профессиональная деятельность
          зарегистрирована в стране ЕС (<Source href={S.witeiTerms}>условия</Source>).
        </li>
        <li>
          <strong>Владелец:</strong> Witei Solutions SL принадлежит Fotocasa Group, бывшей
          Adevinta Real Estate, которую Scout24 купил 27 февраля 2026 года (
          <Source href={S.bormeWitei2025}>BORME 2025</Source>,{" "}
          <Source href={S.scout24Q1}>Scout24</Source>,{" "}
          <Source href={S.bormeFotocasaGroup}>BORME 2026</Source>). Inmoweb входит в ту же группу
          (<Source href={S.fotocasaGroupBrands}>Fotocasa Group</Source>).
        </li>
      </ul>

      <h3>Inmovilla</h3>
      <ul>
        <li>
          <strong>Цена:</strong> один тариф, Full Edition, за 79 € в месяц или 790 € в год: до
          7 пользователей, неограниченное число объектов, сайт и 50 ГБ хранилища. Бесплатный
          пробный период длится 15 дней, с одним пробным пользователем и частью функций (
          <Source href={S.inmovillaPrices}>цены Inmovilla</Source>). Дополнительный пользователь
          стоит 12 € в месяц, а первый импорт ваших данных из другой CRM бесплатный (
          <Source href={S.inmovillaFaqPrice}>справка Inmovilla</Source>).
        </li>
        <li>
          <strong>Лицензия только для MLS:</strong> участники MLS могут взять ограниченную версию
          за 15 € в месяц за каждую MLS, чтобы видеть её общие объекты и отправлять их клиентам (
          <Source href={S.inmovillaFaqShare}>справка Inmovilla</Source>).
        </li>
        <li>
          <strong>Порталы:</strong> выгрузка в реальном времени на idealista, fotocasa и pisos.com
          (<Source href={S.inmovillaFaqPortals}>справка Inmovilla</Source>). Заявки, пришедшие
          письмом на собственный почтовый ящик Inmovilla, могут сами создать клиента и запрос (
          <Source href={S.inmovillaFaqLeads}>справка Inmovilla</Source>).
        </li>
        <li>
          <strong>WhatsApp:</strong> платный ящик входящих, который покупается на каждого агента и
          подключается сканированием QR-кода в разделе «Связанные устройства» WhatsApp, как при
          подключении WhatsApp Web. Цена не опубликована, а собственное руководство Inmovilla
          предупреждает, что WhatsApp может заблокировать номер, использование которого сочтёт
          ненадлежащим (<Source href={S.inmovillaFaqWhatsapp}>справка Inmovilla</Source>).
        </li>
        <li>
          <strong>Другие агентства:</strong> «круги» (círculos) — группы MLS, которые вы создаёте
          или к которым присоединяетесь, — и соглашения о сотрудничестве между двумя агентствами
          (<Source href={S.inmovillaFaqCircles}>справка Inmovilla</Source>).
        </li>
        <li>
          <strong>Интерфейс:</strong> на испанском, английском и португальском (
          <Source href={S.inmovillaFaqLanguages}>справка Inmovilla</Source>).
        </li>
        <li>
          <strong>Владелец:</strong> idealista купил его в июне 2022 года (
          <Source href={S.idealistaBuysInmovilla}>idealista</Source>,{" "}
          <Source href={S.bormeInmovilla}>BORME</Source>). Inmovilla сообщает, что работает более
          чем с 4 000 агентств (<Source href={S.inmovillaFaqAgencies}>справка Inmovilla</Source>).
        </li>
      </ul>

      <h2>Почему риелторы ищут альтернативу</h2>
      <p>Обычно по одной из этих причин, и каждая ведёт к своему типу инструментов.</p>

      <h3>У вас нет своих объектов</h3>
      <p>
        Если вы продаёте объекты других агентств, многое из того, за что берёт деньги CRM,
        построенная вокруг объектов, остаётся без дела: выгрузка на порталы, сайт, страницы
        объектов. А ваши клиенты хранятся в аккаунте, который может принадлежать агентству. Вам
        нужна собственная база клиентов.
      </p>

      <h3>Вам нужен idealista, а у вас Witei</h3>
      <p>
        Аккаунт Witei не может подключить новую интеграцию с idealista, поэтому агентство,
        которое пришло в Witei после февраля 2022 года, не может выгружать из него объекты на
        idealista. Inmovilla и Inmoweb выгружают на него в реальном времени, а Sooprema,
        Mobilia, Vesta и платные тарифы inmoGesco включают его в свой список порталов.
      </p>

      <h3>Вы хотите делиться объектами с другими агентствами</h3>
      <p>
        Witei ограничивает обмен рамками одной компании. Если ваша работа строится на совместных
        продажах, присмотритесь к инструментам, построенным как сети: «круги» Inmovilla, сеть
        Resales Online на Коста-дель-Соль или PropertyList.
      </p>

      <h3>Вам тесно на бесплатном тарифе</h3>
      <p>
        Бесплатный тариф Witei ограничен 250 контактами и 10 объектами, без выгрузки на порталы,
        а у Inmovilla есть только пробный период. Бесплатный тариф inmoGesco не ограничивает
        число клиентов и объектов — для одного пользователя и без порталов.
      </p>

      <h3>Вы предпочли бы CRM, которая не принадлежит порталу</h3>
      <p>
        Inmovilla принадлежит idealista, а Witei и Inmoweb — Fotocasa Group, компании Scout24 в
        Испании. Некоторые риелторы предпочитают CRM от компании, которая не продаёт им заодно и
        объявления.
      </p>

      <h3>Ваш бизнес зарегистрирован за пределами ЕС</h3>
      <p>
        Witei принимает только клиентов, чья профессиональная деятельность зарегистрирована в
        стране ЕС, и это исключает, например, агентство, зарегистрированное в Великобритании.
      </p>

      <h2>Альтернативы</h2>
      <p>Цены — за самый дешёвый тариф каждого разработчика, плюс IVA, если не отмечено иное.</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Альтернатива</th>
            <th scope="col">Сильная сторона</th>
            <th scope="col">Цена от</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={BRAND_CELL}>inmoGesco</th>
            <td>Бесплатный тариф без ограничения по клиентам и объектам</td>
            <td>Бесплатно; с порталами — 29 € в месяц при оплате за год</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Sooprema</th>
            <td>Много объектов и любое число пользователей</td>
            <td>39 € в месяц за 150 объектов</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Inmoweb</th>
            <td>idealista и Fotocasa в реальном времени на небольшом тарифе</td>
            <td>36 € в месяц, 1 пользователь</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Mobilia</th>
            <td>WhatsApp через официальный API Meta</td>
            <td>49 € в месяц, 1 пользователь</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Vesta CRM</th>
            <td>Сайт, общий ящик входящих и ИИ в одном сервисе</td>
            <td>44,90 € в месяц, 2 пользователя</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>InmoProCRM</th>
            <td>Бесплатный тариф со всеми функциями для небольшого портфеля объектов</td>
            <td>Бесплатно до 20 объектов; 39 € в месяц, IVA включён</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Resales Online</th>
            <td>Общая база объектов Коста-дель-Соль</td>
            <td>190 € в месяц, 4 пользователя</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>PropertyList</th>
            <td>Бесплатная MLS, оплата по мере использования</td>
            <td>Базовые функции бесплатно; кредиты от 0,80 €</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>{SITE_NAME}</th>
            <td>Клиенты одного агента из нескольких агентств</td>
            <td>
              Бесплатно до {FREE_CLIENT_LIMIT} клиентов; {PRICES.standard.monthly} € в месяц
            </td>
          </tr>
        </tbody>
      </table>

      <h3>inmoGesco</h3>
      <ul>
        <li>
          <strong>Бесплатно навсегда:</strong> неограниченное число клиентов и объектов для одного
          пользователя, с сайтом на поддомене, собственной MLS, подбором и уведомлениями
          покупателям по электронной почте. Неактивные аккаунты отключают через 6 месяцев (
          <Source href={S.inmogescoPrices}>цены inmoGesco</Source>).
        </li>
        <li>
          <strong>Порталы:</strong> на бесплатном тарифе их нет, кроме 30-дневного пробного
          периода по запросу (<Source href={S.inmogescoPortals}>порталы</Source>). PRO стоит
          29 € в месяц при оплате за год или 35 € при помесячной оплате, на 2 пользователей, и
          выгружает объекты на idealista, pisos.com, Kyero, thinkSPAIN и другие порталы; на его
          странице порталов не указаны Fotocasa и habitaclia.
        </li>
        <li>
          <strong>На практике:</strong> работает в браузере, приложения нет. Чтобы отменить
          подписку, нужно связаться с его командой (
          <Source href={S.inmogescoHome}>inmoGesco</Source>).
        </li>
      </ul>

      <h3>Sooprema</h3>
      <ul>
        <li>
          <strong>Цена — по числу активных объектов</strong>, без ограничения по пользователям:
          от 39 € в месяц за 150 до 99 € за 2 500 (<Source href={S.sooprema}>Sooprema</Source>).
          Пробный период на 14 дней со всеми функциями и без карты (
          <Source href={S.soopremaTrial}>страница CRM</Source>), минимального срока нет (
          <Source href={S.soopremaFaq}>частые вопросы</Source>).
        </li>
        <li>
          <strong>Порталы:</strong> больше 70, включая idealista, Fotocasa, Kyero и pisos.com (
          <Source href={S.soopremaPortals}>порталы</Source>).
        </li>
        <li>
          <strong>Заявки:</strong> его раздел входящих читает ваш почтовый ящик, и каждую заявку
          с портала вы импортируете одним кликом. Сайт — отдельный продукт с платой за
          подключение.
        </li>
      </ul>

      <h3>Inmoweb</h3>
      <ul>
        <li>
          <strong>Тарифы:</strong> Starter — 36 € в месяц на 1 пользователя, Evolution — 59 €
          на 3, Enterprise — 79 € на 10, плюс налоги, со скидкой 20 % при оплате за год (
          <Source href={S.inmowebPrices}>цены Inmoweb</Source>).
        </li>
        <li>
          <strong>Порталы:</strong> около 30, из них idealista, Fotocasa и habitaclia — в реальном
          времени (<Source href={S.inmowebPortals}>порталы</Source>). Onebox, который превращает
          письма с порталов в клиентов, доступен начиная с Evolution (
          <Source href={S.inmowebOnebox}>Onebox</Source>).
        </li>
        <li>
          <strong>Полезно знать:</strong> работает в браузере, на испанском или английском.
          Подписка отменяется в панели управления не позднее чем за 15 дней до продления (
          <Source href={S.inmowebTerms}>условия</Source>). Принадлежит той же группе, что и Witei.
        </li>
      </ul>

      <h3>Mobilia</h3>
      <ul>
        <li>
          <strong>Цена:</strong> 49 € в месяц с одним пользователем; дополнительные стоят по
          20 €, до пяти. Базовое подключение бесплатное при минимальном сроке 3 месяца для
          первого пользователя, а премиальное стоит 349 € (
          <Source href={S.mobiliaPrices}>цены Mobilia</Source>). Бесплатного тарифа и пробного
          периода нет: нужно записаться на демонстрацию.
        </li>
        <li>
          <strong>WhatsApp:</strong> официальный WhatsApp Business API, подключённый через Meta,
          и переписка с каждым клиентом хранится в CRM; стоимость называют на демонстрации (
          <Source href={S.mobiliaWhatsapp}>WhatsApp</Source>).
        </li>
        <li>
          <strong>Порталы и заявки:</strong> около 50 порталов, включая idealista, Fotocasa,
          Kyero, Rightmove и русскоязычный Prian.ru; заявки с порталов приходят в виде обращений,
          которые вы подтверждаете как клиентов (<Source href={S.mobiliaCrm}>CRM</Source>).
        </li>
      </ul>

      <h3>Vesta CRM</h3>
      <ul>
        <li>
          <strong>Тарифы:</strong> Starter — 44,90 € в месяц на 2 пользователей, Básico —
          99,90 € и Profesional — 149,90 € на 5, сайт есть в каждом тарифе; при оплате за год
          берут плату за десять месяцев (<Source href={S.vestaPrices}>цены Vesta</Source>).
        </li>
        <li>
          <strong>Как попробовать:</strong> бесплатный пробный период и гарантия возврата денег
          за первый месяц (<Source href={S.vestaTerms}>условия</Source>). Номер WhatsApp во
          входящих Vesta стоит 8,90 € в месяц, в тарифе Profesional он включён (
          <Source href={S.vestaPrices}>цены Vesta</Source>); как он подключается к WhatsApp, не
          указано.
        </li>
      </ul>

      <h3>InmoProCRM</h3>
      <ul>
        <li>
          <strong>Бесплатно навсегда</strong> до 20 объектов, без ограничения по контактам, для
          одного пользователя и со всеми функциями; дальше — 39, 69 или 159 € в месяц за
          агентство, IVA включён (<Source href={S.inmoprocrm}>InmoProCRM</Source>).
        </li>
        <li>
          <strong>Порталы и WhatsApp:</strong> около 40 порталов (
          <Source href={S.inmoprocrmFeatures}>функции</Source>). WhatsApp привязывается по
          QR-коду как устройство, по аналогии с WhatsApp Web, а не через официальный API (
          <Source href={S.inmoprocrmWhatsapp}>WhatsApp</Source>).
        </li>
        <li>
          <strong>Полезно знать:</strong> его сайт появился в середине 2026 года, и на нём не
          сказано, как экспортировать ваши данные.
        </li>
      </ul>

      <h3>Resales Online</h3>
      <ul>
        <li>
          <strong>Цена:</strong> тариф Network and New Developments — 190 € в месяц на
          4 пользователей, дешевле при оплате на 6 или 12 месяцев вперёд; 15 € за каждого
          дополнительного пользователя (<Source href={S.resalesFees}>стоимость подписки</Source>).
          Требуется корпоративная почта на вашем собственном домене (
          <Source href={S.resalesLicence}>лицензия</Source>).
        </li>
        <li>
          <strong>Сеть:</strong> 2 149 активных агентств, по данным главной страницы на {AS_OF} (
          <Source href={S.resalesHome}>Resales Online</Source>). Когда вы записываете клиента на
          показ объекта другого агента, тот видит только фамилию и последние четыре цифры
          телефона вашего клиента (<Source href={S.resalesViewings}>показы</Source>).
        </li>
        <li>
          <strong>Заявки:</strong> с вашего сайта и с его портала PropExtra; остальные
          пересылаются по почте и прикрепляются вручную (
          <Source href={S.resalesEmails}>справка Resales</Source>). Плата за версию Standalone,
          CRM без сети, сейчас не взимается (
          <Source href={S.resalesStandalone}>Standalone</Source>).
        </li>
      </ul>

      <h3>PropertyList</h3>
      <ul>
        <li>
          <strong>Бесплатная основа:</strong> его MLS, CRM, объекты и мини-сайт. Перевод
          покупателя в воронку покупателей после первых 5 стоит 1 кредит, а кредиты стоят
          от 0,80 до 1 € плюс IVA (<Source href={S.propertylistPrices}>цены PropertyList</Source>).
        </li>
        <li>
          <strong>Сеть:</strong> более 1 040 агентств, прежде всего на Коста-дель-Соль (
          <Source href={S.propertylistFree}>PropertyList</Source>).
        </li>
        <li>
          <strong>Если решите уйти:</strong> договора нет, а ваши объекты экспортируются в XML (
          <Source href={S.propertylistPrices}>цены PropertyList</Source>); экспорт контактов на
          его страницах не описан.
        </li>
      </ul>

      <h3>{SITE_NAME}</h3>
      <ul>
        <li>
          <strong>Для собственных клиентов одного агента</strong> по всем агентствам, для которых
          он продаёт: каждый клиент помечен агентством, через которое пришёл. Бесплатно до{" "}
          {FREE_CLIENT_LIMIT} клиентов со всеми функциями; Pro стоит {PRICES.standard.monthly} €
          в месяц, а первые {FOUNDING_CAP} платящих агентов навсегда сохраняют цену{" "}
          {PRICES.founding.monthly} € в месяц (<Link href={marketingPath("pricing", L)}>тарифы</Link>).
        </li>
        <li>
          <strong>Чего в нём нет:</strong> публикации объектов, сайта и общей MLS. Вы вставляете
          заявку с портала, и он заполняет карточку клиента; он готовит черновики сообщений для
          WhatsApp на языке клиента, а отправляете их вы со своего телефона.
        </li>
      </ul>

      <h2>Как забрать клиентов с собой</h2>

      <h3>Из Witei</h3>
      <p>
        Администратор или пользователь с правом на экспорт может выгрузить объекты, контакты и
        сайт в Excel или CSV, включая фотографии, документы, предложения, задачи и переписку.
        Это может занять до 24 часов, файлы делятся на части по 10 000 строк, а скачать их
        можно в течение 30 дней (<Source href={S.witeiExport}>справка Witei</Source>).
        Экспортируйте данные до отмены подписки: на странице продукта Witei сказано, что он
        хранит ваши данные 30 дней на случай, если вы вернётесь (
        <Source href={S.witeiCrm}>Witei</Source>), но в статье справки об отмене подписки
        говорится, что доступ к аккаунту, данным, домену и почте прекращается сразу после
        подтверждения (<Source href={S.witeiCancel}>справка Witei</Source>).
      </p>

      <h3>Из Inmovilla</h3>
      <p>
        Объекты, запросы и контакты экспортируются в Excel, CSV или XML, и в XML попадают
        фотографии. О полном экспорте всех данных без фильтров получает уведомление руководитель
        агентства (<Source href={S.inmovillaFaqExport}>справка Inmovilla</Source>). Чтобы
        отменить подписку, пользователь с профилем руководителя (gerente) заходит в Mi oficina ›
        Configuración › Solicitar baja; работа сайта приостанавливается через несколько дней
        после подтверждения отмены (<Source href={S.inmovillaFaqCancel}>справка Inmovilla</Source>
        ).
      </p>

      <h3>В новую CRM</h3>
      <p>
        Большинство перечисленных CRM импортируют файл Excel или CSV. Inmovilla бесплатно
        импортирует ваши первые данные, у Vesta перенос данных стоит 500 € (за полцены при
        обязательстве на 12 месяцев, бесплатно — на 24), а Fincta импортирует клиентов, но не
        объекты и не документы. {SITE_NAME} импортирует Excel или CSV, показывает, как
        сопоставляется каждая колонка, и позволяет отменить весь импорт одним кликом.
      </p>

      <Callout kind="warning" title="Чьи это клиенты?">
        <p>
          Если аккаунт Witei или Inmovilla принадлежит агентству, то записи о клиентах в нём —
          тоже данные агентства. Забирайте только то, что позволяет ваше соглашение с этим
          агентством: для переноса персональных данных нужно законное основание по GDPR (RGPD).
        </p>
      </Callout>

      <h2>Источники</h2>
      <p>Сайты, справочные центры и условия самих разработчиков, все проверены {AS_OF}</p>
      <ul>
        <li>
          Witei: <Source href={S.witeiPrices}>цены</Source>,{" "}
          <Source href={S.witeiAddOns}>дополнительные опции</Source>,{" "}
          <Source href={S.witeiTerms}>условия</Source>,{" "}
          <Source href={S.witeiPortals}>интеграции</Source>,{" "}
          <Source href={S.witeiIdealista}>idealista</Source>,{" "}
          <Source href={S.witeiSmartInbox}>SmartInbox</Source>,{" "}
          <Source href={S.witeiNoCollaboration}>другие агентства</Source>,{" "}
          <Source href={S.witeiExport}>экспорт</Source>,{" "}
          <Source href={S.witeiCancel}>отмена подписки</Source>; владелец:{" "}
          <Source href={S.bormeWitei2025}>BORME от 7 апреля 2025 года</Source>,{" "}
          <Source href={S.bormeScout24}>BORME от 17 марта 2026 года</Source>,{" "}
          <Source href={S.bormeFotocasaGroup}>BORME от 21 июля 2026 года</Source>,{" "}
          <Source href={S.scout24Q1}>Scout24 за 1-й квартал 2026 года</Source>,{" "}
          <Source href={S.fotocasaGroupBrands}>Fotocasa Group</Source>.
        </li>
        <li>
          Inmovilla: <Source href={S.inmovillaPrices}>цены</Source>,{" "}
          <Source href={S.inmovillaFaqPrice}>пользователи и импорт</Source>,{" "}
          <Source href={S.inmovillaFaqShare}>лицензия MLS</Source>,{" "}
          <Source href={S.inmovillaFaqPortals}>порталы</Source>,{" "}
          <Source href={S.inmovillaFaqLeads}>заявки</Source>,{" "}
          <Source href={S.inmovillaFaqWhatsapp}>WhatsApp</Source>,{" "}
          <Source href={S.inmovillaFaqCircles}>«круги»</Source>,{" "}
          <Source href={S.inmovillaFaqLanguages}>языки</Source>,{" "}
          <Source href={S.inmovillaFaqExport}>экспорт</Source>,{" "}
          <Source href={S.inmovillaFaqCancel}>отмена подписки</Source>; владелец:{" "}
          <Source href={S.idealistaBuysInmovilla}>idealista</Source>,{" "}
          <Source href={S.bormeInmovilla}>BORME от 21 июля 2022 года</Source>.
        </li>
        <li>
          <Source href={S.inmogescoPrices}>inmoGesco</Source>,{" "}
          <Source href={S.sooprema}>Sooprema</Source>,{" "}
          <Source href={S.inmowebPrices}>Inmoweb</Source>,{" "}
          <Source href={S.mobiliaPrices}>Mobilia</Source>,{" "}
          <Source href={S.vestaPrices}>Vesta CRM</Source>,{" "}
          <Source href={S.inmoprocrm}>InmoProCRM</Source>,{" "}
          <Source href={S.resalesFees}>Resales Online</Source>,{" "}
          <Source href={S.propertylistPrices}>PropertyList</Source> и страницы, на которые
          ссылается каждый раздел выше.
        </li>
      </ul>
      <p>
        Хотите подробнее сравнить бесплатные тарифы? Посмотрите,{" "}
        <Link href={marketingPath("guideFreeCrm", L)}>что входит в каждую бесплатную CRM для недвижимости</Link>
        , или узнайте,{" "}
        <Link href={marketingPath("guideBestCrm", L)}>какая CRM подходит под то, как вы работаете</Link>.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Альтернативы Witei и Inmovilla для риелторов (2026)",
  description:
    "Цены и возможности Witei и Inmovilla в 2026 году, альтернативы для риелторов в Испании, от бесплатных тарифов до MLS Коста-дель-Соль, и как забрать клиентов.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Руководство · CRM",
  heading: "Альтернативы Witei и Inmovilla и как забрать с собой своих клиентов",
  lead: `Witei и Inmovilla — CRM для агентств, построенные вокруг объектов и публикации на порталах. Witei бесплатен до 250 контактов, платные модули стоят от 25 € в месяц плюс IVA, а принадлежит он Fotocasa Group, которой владеет Scout24. Inmovilla стоит 79 € в месяц плюс IVA, включая до 7 пользователей, и принадлежит idealista. Подходящая альтернатива зависит от того, почему вы ищете замену: бесплатный тариф с большими лимитами (inmoGesco), другая система для агентств (Sooprema, Inmoweb, Mobilia, Vesta), общие объекты Коста-дель-Соль (Resales Online, PropertyList) или клиенты одного агента из разных агентств (${SITE_NAME}). Обе системы позволяют экспортировать данные в Excel или CSV.`,
  Body,
  faq: [
    {
      q: "Чем заменить Witei?",
      a: `Зависит от того, почему вы уходите. Если нужен бесплатный тариф с большими лимитами, у inmoGesco нет ограничения по клиентам и объектам для одного пользователя. Если нужна другая система для агентств, Sooprema стоит от 39 € в месяц, а Inmoweb — от 36 €, обе цены плюс IVA, и Inmoweb выгружает объекты на idealista в реальном времени. Если вы продаёте для нескольких агентств и своих объектов у вас нет, ${SITE_NAME} хранит ваших собственных клиентов в одном месте.`,
    },
    {
      q: "Есть ли бесплатная альтернатива Inmovilla?",
      a: "У Inmovilla есть только пробный период на 15 дней. inmoGesco бесплатен навсегда: неограниченное число клиентов и объектов для одного пользователя, без публикации на порталах; Witei бесплатен до 250 контактов и 10 объектов; InmoProCRM — до 20 объектов; MLS и базовая CRM PropertyList бесплатны, а некоторые действия оплачиваются кредитами.",
    },
    {
      q: "Кому принадлежат Witei и Inmovilla?",
      a: "Inmovilla с июня 2022 года принадлежит idealista. Witei Solutions SL принадлежит Fotocasa Group, бывшей Adevinta Real Estate, которую Scout24 купил 27 февраля 2026 года; Inmoweb входит в ту же группу.",
    },
    {
      q: "Может ли Witei выгружать объекты на idealista?",
      a: "Для новых аккаунтов — нет. С февраля 2022 года в Witei нельзя подключить новую интеграцию с idealista, хотя интеграции, подключённые раньше, продолжают работать. Заявки с idealista по-прежнему можно пересылать в SmartInbox Witei.",
    },
    {
      q: "Как выгрузить клиентов из Inmovilla?",
      a: "Inmovilla экспортирует объекты, запросы и контакты в Excel, CSV или XML, и в XML попадают фотографии. О полном экспорте всех данных без фильтров получает уведомление руководитель агентства, поэтому, если аккаунт принадлежит агентству, проверьте, что разрешает забрать ваше соглашение с ним.",
    },
  ],
  related: ["guideFreeCrm", "guideBestCrm", "guidePortalPrices"],
  topic: { "@type": "Thing", name: "CRM-системы для недвижимости в Испании" },
};
