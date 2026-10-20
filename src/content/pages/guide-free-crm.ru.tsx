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
const FIRST_PUBLISHED = PUBLISHED.guideFreeCrm;

/**
 * The day every plan and limit was last checked on the vendors' own sites.
 * It is also the "Updated" date, dateModified and the sitemap's lastmod, so
 * the quarterly re-check (plan 025) bumps CHECKED, never PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guideFreeCrm ?? FIRST_PUBLISHED;

const AS_OF = new Intl.DateTimeFormat(intlTag(L), {
  dateStyle: "long",
  timeZone: "UTC",
}).format(new Date(LAST_CHECKED));

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

/**
 * The CRM names in the table's first column are brands: in a narrow table they
 * may wrap at a space but not inside a word, which the rule for Russian tables
 * in globals.css otherwise allows (as in guide-portal-prices.ru).
 */
const BRAND_CELL = "align-top [overflow-wrap:normal]! hyphens-manual!";

function Body() {
  return (
    <>
      <Callout title={`Проверено ${AS_OF}`}>
        <ul>
          <li>
            Слово «бесплатно» ниже означает четыре разные вещи: бессрочный тариф, бесплатную
            основу с платными дополнениями, акцию с датой окончания и пробный период.
          </li>
          <li>
            Каждый лимит и каждая цена взяты с сайта самой компании, ссылка стоит там, где они
            приводятся. Цены указаны без IVA, если не отмечено «IVA включён».
          </li>
          <li>{SITE_NAME} публикует это руководство и сам входит в число описанных в нём CRM.</li>
        </ul>
      </Callout>

      <h2>Бесплатные тарифы в одной таблице</h2>
      <p>
        Сначала идут CRM, созданные для риелторов в Испании, затем две универсальные CRM для
        продаж. В последней колонке — самый дешёвый способ платить, когда бесплатного тарифа
        станет мало.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">CRM</th>
            <th scope="col">Бесплатный тариф</th>
            <th scope="col">Когда его станет мало</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={BRAND_CELL}>inmoGesco</th>
            <td>
              Бессрочно: клиенты и объекты без ограничений, 1 пользователь, сайт на поддомене. Без
              публикации на порталах.
            </td>
            <td>PRO: 29 € в месяц при оплате за год или 35 € помесячно, для 2 пользователей</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Witei</th>
            <td>
              Бессрочно: 250 контактов, 10 объектов, 1 пользователь. Без выгрузки на порталы,
              ящика для заявок и сайта.
            </td>
            <td>25 € в месяц за модуль; контакты и объекты вместе — 50 €</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>InmoProCRM</th>
            <td>Бессрочно: 20 объектов, контакты без ограничений, 1 пользователь, все функции</td>
            <td>Premium: 39 € в месяц, IVA включён, на 200 объектов</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>PropertyList</th>
            <td>
              Бессрочно: его MLS, основные функции CRM, объявления и микросайт; каждый
              покупатель, перенесённый в воронку покупателей, после первых 5 стоит 1 кредит
            </td>
            <td>Кредиты от 0,80 € до 1 € за штуку</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>{SITE_NAME}</th>
            <td>
              Бессрочно: {FREE_CLIENT_LIMIT} клиентов (покупатели и продавцы вместе), все
              функции, 1 агент
            </td>
            <td>Pro: {PRICES.standard.monthly} € в месяц, клиенты без ограничений</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Fincta</th>
            <td>Всё до 1 февраля 2027 года; затем 1 агент, 12 клиентов и 7 объектов</td>
            <td>Agency S: 49 € в месяц, до 6 агентов</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>HubSpot</th>
            <td>Бессрочно: 2 пользователя и 1 000 контактов, как универсальная CRM для продаж</td>
            <td>
              Starter: от 7 € в месяц за пользователя при оплате за год, предложение для новых
              клиентов
            </td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Zoho CRM</th>
            <td>Бессрочно: 3 пользователя и 5 000 записей, как универсальная CRM для продаж</td>
            <td>Standard: 14 € в месяц за пользователя при оплате за год</td>
          </tr>
        </tbody>
      </table>

      <h2>Подробно о каждом бесплатном тарифе</h2>

      <h3>inmoGesco</h3>
      <ul>
        <li>
          <strong>Что бесплатно:</strong> клиенты и объекты без ограничений, для одного
          пользователя и одного офиса, с сайтом на поддомене, собственной MLS inmoGesco, подбором
          и оповещениями покупателей по почте (
          <Source href={S.inmogescoPrices}>цены inmoGesco</Source>).
        </li>
        <li>
          <strong>Что не бесплатно:</strong> публикация на порталах. По запросу её можно
          попробовать 30 дней, а дальше нужен PRO или PREMIUM (
          <Source href={S.inmogescoPortals}>порталы</Source>).
        </li>
        <li>
          <strong>Нюанс:</strong> аккаунт, в котором 6 месяцев не было активности, отключают.
        </li>
        <li>
          <strong>Платно:</strong> PRO стоит 29 € в месяц при оплате за год или 35 € помесячно,
          для 2 пользователей и 5 € за каждого дополнительного; PREMIUM — 39 € или 47 €, для 7
          пользователей.
        </li>
      </ul>

      <h3>Witei</h3>
      <ul>
        <li>
          <strong>Что бесплатно:</strong> 250 контактов, 10 объектов и один пользователь без
          ограничения по времени, а также взаимный подбор контактов и объектов (
          <Source href={S.witeiPrices}>цены Witei</Source>).
        </li>
        <li>
          <strong>Что не бесплатно:</strong> выгрузка на порталы, SmartInbox (он превращает
          письма с порталов в контакты), отправка писем, Google Calendar и сайт.
        </li>
        <li>
          <strong>Нюанс:</strong> аккаунты только с бесплатными тарифами могут закрыть за
          неактивность без предупреждения, а открытие аккаунта проходит через заявку, которую
          проверяет команда Witei (<Source href={S.witeiHome}>Witei</Source>).
        </li>
        <li>
          <strong>Платно:</strong> каждый модуль стоит 25, 45 или 65 € в месяц. Модуль
          контактов Normal рассчитан на 5 000 контактов и 10 пользователей, а модуль объектов
          Normal — на 1 000 объектов и 10 интеграций с порталами. Для аккаунтов, открытых с
          февраля 2022 года, Witei не может публиковать объявления в idealista (
          <Source href={S.witeiIdealista}>справка Witei</Source>).
        </li>
      </ul>

      <h3>InmoProCRM</h3>
      <ul>
        <li>
          <strong>Что бесплатно:</strong> 20 объектов, контакты без ограничений, один
          пользователь и один офис, все функции, включая ИИ; без карты (
          <Source href={S.inmoprocrm}>InmoProCRM</Source>).
        </li>
        <li>
          <strong>Нюанс:</strong> сверх 20 объектов вы переходите на платный тариф. Сайт
          InmoProCRM появился в середине 2026 года, и на нём не сказано, как экспортировать ваши
          данные.
        </li>
        <li>
          <strong>Платно:</strong> 39 € в месяц за 200 объектов и 5 пользователей, 69 € — за
          500 и 159 € — без ограничений; IVA включён, цена за агентство.
        </li>
        <li>
          <strong>WhatsApp:</strong> подключается по QR-коду в качестве устройства, как WhatsApp
          Web, а не через официальный API (<Source href={S.inmoprocrmWhatsapp}>WhatsApp</Source>).
        </li>
      </ul>

      <h3>PropertyList</h3>
      <ul>
        <li>
          <strong>Что бесплатно:</strong> его MLS, основные функции CRM, объявления на его
          портале и микросайт, без карты и без договора (
          <Source href={S.propertylistFree}>PropertyList</Source>).
        </li>
        <li>
          <strong>Что не бесплатно:</strong> по его собственным словам, CRM бесплатна не на
          100 %. Перенос квалифицированного покупателя в воронку покупателей после первых 5
          стоит 1 кредит (<Source href={S.propertylistPipelines}>воронки</Source>), каждое фото
          сверх 25 в одном объявлении стоит кредит, а конструктор сайта — 50 кредитов в месяц.
        </li>
        <li>
          <strong>Платно:</strong> кредиты продаются пакетами, от 20 € за 20 до 800 € за 1 000,
          плюс IVA, и они не сгорают (<Source href={S.propertylistPrices}>цены PropertyList</Source>
          ).
        </li>
        <li>
          <strong>Стоит знать:</strong> больше 1 040 агентств, в основном на Коста-дель-Соль.
          Объявления экспортируются в XML; экспорт ваших контактов на его страницах не описан.
        </li>
      </ul>

      <h3>{SITE_NAME}</h3>
      <ul>
        <li>
          <strong>Что бесплатно:</strong> {FREE_CLIENT_LIMIT} клиентов (покупатели и продавцы
          вместе) со всеми функциями, без карты и без ограничения по времени.
        </li>
        <li>
          <strong>Когда лимит достигнут:</strong> добавить ещё одного клиента нельзя, и ничего
          не удаляется.
        </li>
        <li>
          <strong>Платно:</strong> Pro стоит {PRICES.standard.monthly} € в месяц или{" "}
          {PRICES.standard.yearly} € в год без ограничения по числу клиентов, а первые{" "}
          {FOUNDING_CAP} платящих агентов сохраняют {PRICES.founding.monthly} € в месяц навсегда (
          <Link href={marketingPath("pricing", L)}>тарифы</Link>).
        </li>
        <li>
          <strong>Чего нет ни в одном тарифе:</strong> публикации объявлений, сайта и общей MLS.
          Заявки с порталов попадают в него через вставку текста.
        </li>
      </ul>

      <h3>Fincta</h3>
      <ul>
        <li>
          <strong>Пока бесплатно:</strong> всё открыто до 1 февраля 2027 года, без карты, а
          купить платный тариф во время акции нельзя (
          <Source href={S.finctaPrices}>цены Fincta</Source>).
        </li>
        <li>
          <strong>После этого:</strong> постоянный бесплатный тариф на 1 агента, 12 клиентов и 7
          объектов. В условиях Fincta сказано, что за неоплату ни один аккаунт не блокируется и
          не теряет данные (<Source href={S.finctaTerms}>условия</Source>), а сама Fincta
          предупреждает, что регистрация сейчас не делает безлимитный тариф бесплатным навсегда (
          <Source href={S.finctaFree}>Fincta</Source>).
        </li>
        <li>
          <strong>Платно:</strong> тарифы для агентств — 49 € в месяц до 6 агентов, 89 € — до 12
          и 149 € — при любом числе агентов.
        </li>
        <li>
          <strong>Чего нет:</strong> публикации на порталах, как сказано в её собственной
          сравнительной таблице (<Source href={S.finctaCompare}>сравнение</Source>).
        </li>
      </ul>

      <h2>Бесплатные универсальные CRM: HubSpot и Zoho</h2>
      <p>
        Обе бесплатны навсегда, но это универсальные CRM для продаж: без публикации на порталах,
        без готовых карточек объектов, а WhatsApp — только в платных тарифах.
      </p>

      <h3>HubSpot</h3>
      <ul>
        <li>
          <strong>Что бесплатно:</strong> до 2 пользователей и 1 000 контактов, без карты и без
          срока окончания (<Source href={S.hubspotCrm}>HubSpot CRM</Source>), плюс мобильное
          приложение (<Source href={S.hubspotFreeTools}>бесплатные инструменты</Source>).
        </li>
        <li>
          <strong>Устарело в других источниках:</strong> ответы, где обещают до миллиона
          контактов, описывают тариф до того, как осенью 2024 года HubSpot сократил его до
          1 000 (<Source href={S.hubspotCrm2024}>HubSpot, сентябрь 2024 года</Source>).
        </li>
        <li>
          <strong>Ограничения:</strong> 10 пользовательских свойств, одна воронка на объект CRM
          и брендинг HubSpot в письмах и формах (
          <Source href={S.hubspotFreeTools}>бесплатные инструменты</Source>). Для недвижимости в
          HubSpot есть объект Listings, который должен включить суперадминистратор (
          <Source href={S.hubspotListings}>объекты</Source>).
        </li>
        <li>
          <strong>WhatsApp и язык:</strong> входящие WhatsApp есть только в Marketing Hub или
          Service Hub Professional (<Source href={S.hubspotWhatsapp}>WhatsApp</Source>).
          Интерфейс есть на испанском, английском и ещё 15 языках, но не на русском (
          <Source href={S.hubspotLanguages}>языки</Source>).
        </li>
        <li>
          <strong>Платно:</strong> Starter — от 7 € в месяц за пользователя при оплате за год
          или 10 € помесячно; это предложение для новых клиентов, обычная цена — 20 € (
          <Source href={S.hubspotStarter}>Starter</Source>).
        </li>
      </ul>

      <h3>Zoho CRM</h3>
      <ul>
        <li>
          <strong>Что бесплатно:</strong> до 3 пользователей и 5 000 записей, навсегда и без
          карты (<Source href={S.zohoFree}>бесплатная Zoho CRM</Source>).
        </li>
        <li>
          <strong>Ограничения:</strong> нет ни пользовательских полей, ни пользовательских
          модулей, а значит, нет и модуля объектов; одна воронка; нет массовых рассылок и
          WhatsApp (<Source href={S.zohoFeatures}>список функций</Source>).
        </li>
        <li>
          <strong>Платно:</strong> Standard стоит 14 € в месяц за пользователя при оплате за год
          или 20 € помесячно. Интерфейс есть на 28 языках, в том числе на испанском и русском (
          <Source href={S.zohoPricing}>цены Zoho</Source>).
        </li>
      </ul>

      <h2>Без бесплатного тарифа: пробные периоды и демо</h2>
      <ul>
        <li>
          <strong>Inmovilla:</strong> пробный период на 15 дней с одним пробным пользователем и
          частью функций; Full Edition стоит 79 € в месяц или 790 € в год, до 7 пользователей (
          <Source href={S.inmovillaPrices}>цены Inmovilla</Source>).
        </li>
        <li>
          <strong>Sooprema:</strong> пробный период на 14 дней со всеми функциями и без карты;
          от 39 € в месяц за 150 объектов (<Source href={S.soopremaTrial}>Sooprema</Source>).
        </li>
        <li>
          <strong>Vesta CRM:</strong> бесплатный пробный период и гарантия возврата денег за
          первый месяц; от 44,90 € в месяц для 2 пользователей (
          <Source href={S.vestaPrices}>цены Vesta</Source>).
        </li>
        <li>
          <strong>Mobilia и Inmoweb:</strong> нужно записаться на демо. Mobilia стоит 49 € в
          месяц с одним пользователем (<Source href={S.mobiliaPrices}>цены Mobilia</Source>),
          Inmoweb — от 36 € в месяц за одного пользователя (
          <Source href={S.inmowebPrices}>цены Inmoweb</Source>).
        </li>
        <li>
          <strong>Clientify:</strong> пробный период на 7 дней, затем 39 € в месяц при оплате за
          год или 65 € помесячно за одного пользователя (
          <Source href={S.clientifyPrices}>цены Clientify</Source>). Сам Clientify говорит, что
          не управляет объектами, не публикует на порталах и не ведёт MLS (
          <Source href={S.clientifyRealEstate}>Clientify</Source>).
        </li>
        <li>
          <strong>Pipedrive:</strong> пробный период на 14 дней, затем от 14 € в месяц за
          пользователя при оплате за год или 24 € помесячно (
          <Source href={S.pipedrivePricing}>цены Pipedrive</Source>).
        </li>
        <li>
          <strong>Resales Online:</strong> за версию Standalone — CRM без общей сети объектов —
          сейчас не выставляют счёт (<Source href={S.resalesStandalone}>Standalone</Source>), но
          на странице цен продаются только платные пакеты, от 190 € в месяц для 4 пользователей (
          <Source href={S.resalesPricing}>цены Resales</Source>). Как её подключить, уточняйте у
          Resales.
        </li>
      </ul>

      <h2>Прежде чем переносить клиентов в бесплатный тариф</h2>
      <ol>
        <li>
          На что установлен лимит — на клиентов, объекты, пользователей или кредиты — и что
          будет, когда вы его достигнете.
        </li>
        <li>
          Бесплатно ли это навсегда или до определённой даты, как у Fincta — до 1 февраля 2027
          года.
        </li>
        <li>
          Закрывают ли неактивный аккаунт: inmoGesco делает это через 6 месяцев, а Witei может —
          для бесплатных аккаунтов.
        </li>
        <li>Можете ли вы сами экспортировать клиентов и в каком формате.</li>
        <li>
          Чей это аккаунт: если его открывает агентство, то и клиентами в нём распоряжается
          агентство.
        </li>
        <li>
          Входит ли публикация на порталах, которыми вы пользуетесь, — прежде всего на idealista
          — и в каком тарифе.
        </li>
      </ol>

      <h2>Кому подходит {SITE_NAME}</h2>
      <p>
        {SITE_NAME} — CRM для собственных клиентов одного агента, созданная для риелторов,
        которые продают для нескольких агентств. Вы помечаете каждого клиента агентством, через
        которое он пришёл, вставляете заявку с портала, чтобы заполнить карточку клиента, и
        получаете черновики сообщений для повторного контакта на языке клиента, которые
        отправляете из WhatsApp. Бесплатный тариф рассчитан на {FREE_CLIENT_LIMIT} клиентов со всеми
        функциями; Pro стоит {PRICES.standard.monthly} € в месяц плюс IVA (
        <Link href={marketingPath("pricing", L)}>тарифы</Link>).
      </p>
      <p>
        Если вы ведёте объекты и их нужно выставлять на порталы, это не тот инструмент: выберите
        одну из CRM для агентств выше. А если вы пока не готовы к CRM,{" "}
        <Link href={marketingPath("toolSpreadsheet", L)}>бесплатная таблица для учёта клиентов</Link>{" "}
        импортируется в {SITE_NAME}, когда вы будете готовы.
      </p>

      <h2>Источники</h2>
      <p>Сайты, справочные центры и условия самих компаний, проверены {AS_OF}</p>
      <ul>
        <li>
          inmoGesco: <Source href={S.inmogescoPrices}>цены</Source>,{" "}
          <Source href={S.inmogescoPortals}>порталы</Source>. Witei:{" "}
          <Source href={S.witeiPrices}>цены</Source>,{" "}
          <Source href={S.witeiHome}>регистрация</Source>,{" "}
          <Source href={S.witeiIdealista}>idealista</Source>. InmoProCRM:{" "}
          <Source href={S.inmoprocrm}>тарифы</Source>,{" "}
          <Source href={S.inmoprocrmWhatsapp}>WhatsApp</Source>.
        </li>
        <li>
          PropertyList: <Source href={S.propertylistFree}>бесплатный тариф</Source>,{" "}
          <Source href={S.propertylistPipelines}>воронки</Source>,{" "}
          <Source href={S.propertylistPrices}>цены</Source>. Fincta:{" "}
          <Source href={S.finctaPrices}>цены</Source>,{" "}
          <Source href={S.finctaTerms}>условия</Source>,{" "}
          <Source href={S.finctaFree}>страница о бесплатной CRM</Source>,{" "}
          <Source href={S.finctaCompare}>сравнение</Source>.
        </li>
        <li>
          HubSpot: <Source href={S.hubspotCrm}>CRM</Source>,{" "}
          <Source href={S.hubspotFreeTools}>бесплатные инструменты</Source>,{" "}
          <Source href={S.hubspotLimits}>лимиты</Source>,{" "}
          <Source href={S.hubspotStarter}>Starter</Source>,{" "}
          <Source href={S.hubspotWhatsapp}>WhatsApp</Source>,{" "}
          <Source href={S.hubspotLanguages}>языки</Source>,{" "}
          <Source href={S.hubspotListings}>объекты</Source>,{" "}
          <Source href={S.hubspotCrm2024}>страница 2024 года</Source>. Zoho:{" "}
          <Source href={S.zohoFree}>бесплатная CRM</Source>,{" "}
          <Source href={S.zohoFeatures}>список функций</Source>,{" "}
          <Source href={S.zohoPricing}>цены</Source>.
        </li>
        <li>
          <Source href={S.inmovillaPrices}>Inmovilla</Source>,{" "}
          <Source href={S.soopremaTrial}>Sooprema</Source>,{" "}
          <Source href={S.vestaPrices}>Vesta CRM</Source>,{" "}
          <Source href={S.mobiliaPrices}>Mobilia</Source>,{" "}
          <Source href={S.inmowebPrices}>Inmoweb</Source>,{" "}
          <Source href={S.clientifyPrices}>Clientify</Source> (и{" "}
          <Source href={S.clientifyRealEstate}>его статья о недвижимости</Source>),{" "}
          <Source href={S.pipedrivePricing}>Pipedrive</Source>, Resales Online (
          <Source href={S.resalesStandalone}>Standalone</Source>,{" "}
          <Source href={S.resalesPricing}>цены</Source>).
        </li>
      </ul>
      <p>
        Выбираете и среди платных CRM? Читайте о том,{" "}
        <Link href={marketingPath("guideBestCrm", L)}>какая CRM подходит под ваш стиль работы</Link>
        , и об{" "}
        <Link href={marketingPath("guideCrmAlternatives", L)}>альтернативах Witei и Inmovilla</Link>
        .
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Бесплатные CRM для риелторов в Испании (2026)",
  description:
    "У каких CRM для риелторов в Испании есть бесплатный тариф, на сколько клиентов, объектов и пользователей, что платно и когда начнёте платить. С источниками.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Руководство · CRM",
  heading:
    "Бесплатные CRM для риелторов в Испании: что входит в каждый тариф и где он заканчивается",
  lead: `У пяти CRM, созданных для риелторов в Испании, есть бессрочный бесплатный тариф: inmoGesco (клиенты и объекты без ограничений, один пользователь, без публикации на порталах), Witei (250 контактов и 10 объектов), InmoProCRM (20 объектов), PropertyList (собственная MLS и основные функции CRM, а покупатели после первых пяти оплачиваются кредитами) и ${SITE_NAME} (${FREE_CLIENT_LIMIT} клиентов). В Fincta всё бесплатно до 1 февраля 2027 года, затем — 12 клиентов. HubSpot и Zoho CRM тоже бесплатны — как универсальные CRM для продаж, без публикации на порталах. Inmovilla, Sooprema и Vesta вместо этого предлагают пробный период.`,
  Body,
  faq: [
    {
      q: "Есть ли бесплатная CRM для риелтора в Испании?",
      a: `Да. У inmoGesco, Witei, InmoProCRM, PropertyList и ${SITE_NAME} есть бессрочные бесплатные тарифы, у каждого свой лимит, а в Fincta всё бесплатно до 1 февраля 2027 года. HubSpot и Zoho CRM — бесплатные универсальные CRM для продаж, без инструментов для недвижимости.`,
    },
    {
      q: "В какой бесплатной CRM для риелтора нет ограничения по числу клиентов?",
      a: "В бесплатном тарифе inmoGesco нет ограничений ни на клиентов, ни на объекты — для одного пользователя и без публикации на порталах. PropertyList не ограничивает число контактов, но перенос покупателя в его воронку покупателей после первых пяти стоит кредит.",
    },
    {
      q: "Witei бесплатный?",
      a: "У Witei есть бесплатный тариф без ограничения по времени: 250 контактов, 10 объектов и один пользователь, без выгрузки на порталы и без SmartInbox. Платные модули стоят от 25 € в месяц каждый, плюс IVA.",
    },
    {
      q: "Inmovilla бесплатная?",
      a: "Нет. У Inmovilla есть бесплатный пробный период на 15 дней; Full Edition стоит 79 € в месяц или 790 € в год плюс IVA, до 7 пользователей.",
    },
    {
      q: "Бесплатна ли CRM HubSpot для риелторов?",
      a: "Да, до 2 пользователей и 1 000 контактов, без срока окончания. Это универсальная CRM для продаж: без публикации на порталах, а входящие WhatsApp есть только в платных тарифах Professional.",
    },
  ],
  related: ["guideBestCrm", "guideCrmAlternatives", "toolSpreadsheet"],
  topic: { "@type": "Thing", name: "Бесплатные CRM для недвижимости в Испании" },
};
