import Link from "next/link";

import { intlTag } from "@/i18n/config";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { PRICES } from "@/lib/billing";
import { marketingPath } from "@/lib/routes";
import { CHECKED, PUBLISHED } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { SOURCES as S } from "@/content/pages/crm-comparison.sources";

const L = "ru";

/** День первой публикации страницы, он остаётся её datePublished. */
const FIRST_PUBLISHED = PUBLISHED.guideBestCrm;

/**
 * День, когда каждую цену и функцию последний раз сверили с сайтами самих
 * компаний. Это же дата «Обновлено», dateModified и lastmod в sitemap, поэтому
 * ежеквартальная проверка (план 025) меняет CHECKED, но никогда PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guideBestCrm ?? FIRST_PUBLISHED;

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
 * Названия CRM в первой колонке — бренды: в узкой таблице они могут
 * переноситься по пробелу, но не внутри слова, как разрешает правило для
 * русских таблиц в globals.css.
 */
const BRAND_CELL = "align-top [overflow-wrap:normal]! hyphens-manual!";

function Body() {
  return (
    <>
      <Callout title={`Проверено ${AS_OF}`}>
        <ul>
          <li>
            Цены и функции взяты с собственного сайта каждой компании, ссылка — там, где они
            приводятся. Цены указаны без IVA, если не отмечено «IVA включён».
          </li>
          <li>
            Это руководство публикует {SITE_NAME}. Он упоминается там, где уместен, вместе с тем,
            чего он не делает.
          </li>
        </ul>
      </Callout>

      <h2>Начните с того, как вы работаете</h2>
      <p>
        Большинство независимых риелторов работают одним из пяти способов, часто несколькими
        сразу. Для каждого нужна CRM другого типа.
      </p>

      <h3>1. Вы продаёте объекты других агентств</h3>
      <p>
        Ваша работа — это клиенты: покупатели, которых вы приводите, их показы и предложения, а
        также повторные контакты. CRM для агентств построены вокруг объектов одного агентства, и
        аккаунт обычно принадлежит этому агентству. Вам подходит собственная база клиентов:
      </p>
      <ul>
        <li>
          <strong>{SITE_NAME}</strong> создан для этого. У каждого клиента отмечено агентство,
          через которое он пришёл, так что одна база охватывает все агентства, для которых вы
          продаёте. Бесплатно до {FREE_CLIENT_LIMIT} клиентов; Pro стоит{" "}
          {PRICES.standard.monthly} € в месяц (
          <Link href={marketingPath("pricing", L)}>тарифы</Link>).
        </li>
        <li>
          <strong>Таблица</strong> подойдёт для нескольких десятков клиентов, если поддерживать
          её в актуальном состоянии, но она ни о чём не напомнит и не напишет сообщение.{" "}
          <Link href={marketingPath("toolSpreadsheet", L)}>Бесплатная таблица клиентов</Link>{" "}
          импортируется в {SITE_NAME}, если позже вы на него перейдёте.
        </li>
        <li>
          <strong>HubSpot или Zoho CRM</strong>, бесплатные для 2 и 3 пользователей
          соответственно, если вы готовы сами настроить объекты и показы (
          <Link href={marketingPath("guideFreeCrm", L)}>сравнение бесплатных CRM</Link>).
        </li>
      </ul>
      <p>
        Одна оговорка: если клиента вам передало агентство, ваша договорённость с этим
        агентством определяет, можете ли вы хранить данные клиента в собственной системе.
      </p>

      <h3>2. Вы выставляете свои объекты и хотите видеть их на порталах</h3>
      <p>
        Тогда вам нужны выгрузка на порталы, сайт и подбор объектов под покупателей — именно для
        этого созданы испанские CRM для агентств. Их самые дешёвые тарифы:
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">CRM</th>
            <th scope="col">Самый дешёвый тариф</th>
            <th scope="col">Чем выделяется</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={BRAND_CELL}>inmoGesco</th>
            <td>Бесплатно без порталов; PRO — 29 € в месяц при оплате за год, 2 пользователя</td>
            <td>Сайт и собственная MLS на всех тарифах; на его странице о порталах нет Fotocasa</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Witei</th>
            <td>50 € в месяц за контакты и объекты</td>
            <td>Без idealista для аккаунтов, открытых с февраля 2022 года</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Sooprema</th>
            <td>39 € в месяц на 150 объектов</td>
            <td>Без ограничения пользователей, 70+ порталов, пробный период 14 дней</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Inmoweb</th>
            <td>36 € в месяц, 1 пользователь</td>
            <td>idealista, Fotocasa и habitaclia в реальном времени; ящик входящих заявок — от 59 €</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Mobilia</th>
            <td>49 € в месяц, 1 пользователь</td>
            <td>WhatsApp через официальный API Meta</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Vesta CRM</th>
            <td>44,90 € в месяц, 2 пользователя</td>
            <td>Сайт включён; номер WhatsApp в ящике входящих — 8,90 € в месяц</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Inmovilla</th>
            <td>79 € в месяц, до 7 пользователей</td>
            <td>idealista, Fotocasa и pisos.com в реальном времени; сайт включён</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>InmoProCRM</th>
            <td>Бесплатно до 20 объектов; 39 € в месяц, IVA включён</td>
            <td>Около 40 порталов; WhatsApp подключается по QR-коду</td>
          </tr>
        </tbody>
      </table>
      <p>
        Данные с сайта каждой компании: <Source href={S.inmogescoPrices}>inmoGesco</Source>,{" "}
        <Source href={S.witeiPrices}>Witei</Source> (и об{" "}
        <Source href={S.witeiIdealista}>idealista</Source>),{" "}
        <Source href={S.sooprema}>Sooprema</Source>,{" "}
        <Source href={S.inmowebPrices}>Inmoweb</Source>,{" "}
        <Source href={S.mobiliaPrices}>Mobilia</Source>,{" "}
        <Source href={S.vestaPrices}>Vesta CRM</Source>,{" "}
        <Source href={S.inmovillaPrices}>Inmovilla</Source>,{" "}
        <Source href={S.inmoprocrm}>InmoProCRM</Source>. Если покупатели находят вас на
        idealista, первым делом проверьте выгрузку на этот портал.
      </p>

      <h3>3. Вы работаете с общими объектами Коста-дель-Соль</h3>
      <p>На побережье агентства делятся объектами через сети, и CRM идёт вместе с сетью:</p>
      <ul>
        <li>
          <strong>Resales Online:</strong> 190 € в месяц на 4 пользователей (
          <Source href={S.resalesFees}>стоимость</Source>); на его главной странице по состоянию
          на {AS_OF} указано 2 149 активных агентств (
          <Source href={S.resalesHome}>Resales Online</Source>). Когда вы назначаете показ
          объекта другого агента, тот видит только фамилию вашего клиента и последние четыре
          цифры его телефона (<Source href={S.resalesViewings}>показы</Source>). Нужна
          корпоративная почта на вашем собственном домене (
          <Source href={S.resalesLicence}>лицензия</Source>).
        </li>
        <li>
          <strong>PropertyList:</strong> его MLS и базовая CRM бесплатны; после первых пяти
          перевод покупателя в воронку покупателей стоит один кредит, по цене от 0,80 до 1 € за
          кредит. Более 1 040 агентств (<Source href={S.propertylistFree}>PropertyList</Source>).
        </li>
      </ul>

      <h3>4. Большая часть ваших разговоров идёт в WhatsApp</h3>
      <p>
        Под «интеграцией с WhatsApp» понимают три разные вещи, так что уточните, какую из них вы
        получаете:
      </p>
      <ul>
        <li>
          <strong>Кнопка, которая открывает чат.</strong> CRM открывает WhatsApp с номером
          клиента, иногда с готовым сообщением, а переписка остаётся в WhatsApp. Так работают
          Witei, Inmoweb, Resales Online, inmoGesco и Fincta (
          <Source href={S.witeiWhatsapp}>Witei</Source>,{" "}
          <Source href={S.inmowebWhatsapp}>Inmoweb</Source>,{" "}
          <Source href={S.resalesWhatsapp}>Resales</Source>). Так же работает и {SITE_NAME}:
          сначала он готовит черновик сообщения на языке вашего клиента.
        </li>
        <li>
          <strong>Ваш номер, подключённый по QR-коду</strong>, как в WhatsApp Web: так работают
          InmoProCRM и платный ящик входящих в Inmovilla. Сообщения попадают в CRM, но справка
          самой Inmovilla предупреждает, что WhatsApp может заблокировать номер, если увидит, что
          его используют не по правилам (
          <Source href={S.inmovillaFaqWhatsapp}>Inmovilla</Source>,{" "}
          <Source href={S.inmoprocrmWhatsapp}>InmoProCRM</Source>).
        </li>
        <li>
          <strong>Официальная WhatsApp Business Platform от Meta:</strong> Mobilia; Clientify,
          где сверху добавляется плата Meta за сообщения; HubSpot начиная с тарифов Professional;
          и Zoho CRM на платных тарифах, с кредитами на сообщения (
          <Source href={S.mobiliaWhatsapp}>Mobilia</Source>,{" "}
          <Source href={S.clientifyPrices}>Clientify</Source>,{" "}
          <Source href={S.hubspotWhatsapp}>HubSpot</Source>,{" "}
          <Source href={S.zohoFeatures}>Zoho</Source>).
        </li>
      </ul>

      <h3>5. Ваши клиенты не говорят по-испански</h3>
      <p>Здесь две разные вещи: язык экранов CRM и язык того, что вы отправляете.</p>
      <ul>
        <li>
          <strong>Экраны:</strong> интерфейс Resales Online доступен на 13 языках, включая
          русский (<Source href={S.resalesLanguages}>Resales</Source>); Zoho CRM — на 28, а
          Pipedrive — на 24, и в обоих есть русский (<Source href={S.zohoPricing}>Zoho</Source>,{" "}
          <Source href={S.pipedrivePricing}>Pipedrive</Source>). Inmovilla работает на испанском,
          английском и португальском (<Source href={S.inmovillaFaqLanguages}>Inmovilla</Source>),
          Inmoweb и Fincta — на испанском и английском (
          <Source href={S.inmowebLanguages}>Inmoweb</Source>,{" "}
          <Source href={S.finctaPrices}>Fincta</Source>), а в HubSpot нет русского (
          <Source href={S.hubspotLanguages}>HubSpot</Source>). {SITE_NAME} работает на
          английском, испанском и русском.
        </li>
        <li>
          <strong>Сообщения:</strong> {SITE_NAME} пишет черновик каждого повторного контакта на
          языке самого клиента. AI Translate в Resales Online заполняет описания объектов на
          недостающих языках (<Source href={S.resalesAiTranslate}>Resales</Source>), а
          Sooprema пишет описания с помощью ИИ на 14 языках (
          <Source href={S.sooprema}>Sooprema</Source>).
        </li>
      </ul>

      <h2>Сколько платит один риелтор</h2>
      <p>
        Самый дешёвый вариант для одного риелтора по данным страницы цен каждой компании (ссылки
        — выше или в источниках). Цены без IVA, если не отмечено иное.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">CRM</th>
            <th scope="col">Бесплатный тариф</th>
            <th scope="col">Самый дешёвый платный тариф</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={BRAND_CELL}>Clientify</th>
            <td>Нет; пробный период 7 дней</td>
            <td>39 € в месяц при оплате за год, 1 пользователь</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Fincta</th>
            <td>Всё до 1 февраля 2027 года, затем 12 клиентов</td>
            <td>49 € в месяц, до 6 агентов</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>HubSpot</th>
            <td>2 пользователя, 1 000 контактов</td>
            <td>От 7 € в месяц за пользователя при оплате за год, для новых клиентов</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>inmoGesco</th>
            <td>Без ограничения клиентов и объектов, 1 пользователь, без порталов</td>
            <td>29 € в месяц при оплате за год, 2 пользователя</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>InmoProCRM</th>
            <td>20 объектов, 1 пользователь</td>
            <td>39 € в месяц, IVA включён</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Inmovilla</th>
            <td>Нет; пробный период 15 дней</td>
            <td>79 € в месяц, до 7 пользователей</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Inmoweb</th>
            <td>Нет; демо</td>
            <td>36 € в месяц, 1 пользователь</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>{SITE_NAME}</th>
            <td>{FREE_CLIENT_LIMIT} клиентов, все функции</td>
            <td>{PRICES.standard.monthly} € в месяц, без ограничения клиентов</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Mobilia</th>
            <td>Нет; демо</td>
            <td>49 € в месяц, 1 пользователь</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Pipedrive</th>
            <td>Нет; пробный период 14 дней</td>
            <td>14 € в месяц за пользователя при оплате за год</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>PropertyList</th>
            <td>Его MLS и базовая CRM</td>
            <td>Кредиты по цене от 0,80 до 1 € за штуку</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Resales Online</th>
            <td>CRM Standalone, за которую сейчас не берут плату</td>
            <td>190 € в месяц, 4 пользователя</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Sooprema</th>
            <td>Нет; пробный период 14 дней</td>
            <td>39 € в месяц на 150 объектов</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Vesta CRM</th>
            <td>Нет; пробный период</td>
            <td>44,90 € в месяц, 2 пользователя</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Witei</th>
            <td>250 контактов, 10 объектов, 1 пользователь</td>
            <td>25 € в месяц за модуль</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Zoho CRM</th>
            <td>3 пользователя, 5 000 записей</td>
            <td>14 € в месяц за пользователя при оплате за год</td>
          </tr>
        </tbody>
      </table>

      <h2>Что спросить, прежде чем переносить клиентов в CRM</h2>
      <ol>
        <li>Она построена вокруг объектов агентства, объектов сети или ваших собственных клиентов?</li>
        <li>На какие порталы она выгружает объекты, включая idealista, и с какого тарифа?</li>
        <li>Как в неё попадают заявки с порталов: пересылкой писем, прямым подключением или вручную?</li>
        <li>Как она подключается к WhatsApp: кнопка, сессия по QR-коду или официальный API?</li>
        <li>Сколько платит один риелтор с IVA и есть ли минимальный срок?</li>
        <li>
          Можете ли вы сами экспортировать всё, в каком формате и что будет с вашими данными,
          когда вы уйдёте?
        </li>
      </ol>

      <h2>Где {SITE_NAME} подходит, а где нет</h2>
      <p>
        {SITE_NAME} создан для первой ситуации: независимому риелтору, который продаёт для
        нескольких агентств, нужно одно место для своих покупателей, продавцов, показов,
        предложений и повторных контактов. Вы вставляете заявку с портала, и он заполняет
        карточку клиента; он пишет черновик каждого повторного контакта на языке клиента, чтобы
        вы отправили его из WhatsApp, и работает на английском, испанском или русском.
      </p>
      <p>
        Он не публикует объекты на порталах, не ведёт сайт, не даёт общей MLS и не управляет
        командой, а пока работает только с продажами, без аренды. Если вам это нужно, лучше
        подойдёт одна из CRM выше. Бесплатный тариф — до {FREE_CLIENT_LIMIT} клиентов со всеми
        функциями; Pro стоит {PRICES.standard.monthly} € в месяц плюс IVA (
        <Link href={marketingPath("pricing", L)}>тарифы</Link>).
      </p>

      <h2>Источники</h2>
      <p>Проверено {AS_OF} на сайтах самих компаний, в их справочных центрах или условиях.</p>
      <ul>
        <li>
          CRM для агентств: <Source href={S.inmogescoPrices}>inmoGesco</Source>,{" "}
          <Source href={S.witeiPrices}>Witei</Source>,{" "}
          <Source href={S.sooprema}>Sooprema</Source>,{" "}
          <Source href={S.inmowebPrices}>Inmoweb</Source>,{" "}
          <Source href={S.mobiliaPrices}>Mobilia</Source>,{" "}
          <Source href={S.vestaPrices}>Vesta CRM</Source>,{" "}
          <Source href={S.inmovillaPrices}>Inmovilla</Source>,{" "}
          <Source href={S.inmoprocrm}>InmoProCRM</Source>,{" "}
          <Source href={S.finctaPrices}>Fincta</Source>.
        </li>
        <li>
          Сети: Resales Online (<Source href={S.resalesFees}>стоимость</Source>,{" "}
          <Source href={S.resalesStandalone}>Standalone</Source>,{" "}
          <Source href={S.resalesViewings}>показы</Source>,{" "}
          <Source href={S.resalesLicence}>лицензия</Source>), PropertyList (
          <Source href={S.propertylistFree}>бесплатный тариф</Source>,{" "}
          <Source href={S.propertylistPrices}>цены</Source>).
        </li>
        <li>
          Универсальные CRM: <Source href={S.hubspotCrm}>HubSpot</Source> (
          <Source href={S.hubspotStarter}>Starter</Source>), <Source href={S.zohoFree}>Zoho CRM</Source>{" "}
          (<Source href={S.zohoPricing}>цены</Source>),{" "}
          <Source href={S.pipedrivePricing}>Pipedrive</Source>,{" "}
          <Source href={S.clientifyPrices}>Clientify</Source>.
        </li>
      </ul>
      <p>
        Сравниваете бесплатные тарифы? Посмотрите,{" "}
        <Link href={marketingPath("guideFreeCrm", L)}>что входит в каждую бесплатную CRM для недвижимости</Link>
        . Уходите с Witei или Inmovilla? Вот{" "}
        <Link href={marketingPath("guideCrmAlternatives", L)}>альтернативы и как на них перейти</Link>
        .
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Лучшая CRM для независимого риелтора в Испании (2026)",
  description:
    "Какая CRM подойдёт независимому риелтору в Испании: продажи для разных агентств, свои объекты, MLS Коста-дель-Соль или WhatsApp, с ценами самих компаний.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Руководство · CRM",
  heading: "Лучшая CRM для независимого риелтора в Испании зависит от того, чьи объекты вы продаёте",
  lead: `Единой лучшей CRM для всех независимых риелторов в Испании нет: всё зависит от того, чьи объекты вы продаёте и откуда приходят ваши клиенты. Если вы продаёте объекты других агентств, вам нужна собственная база клиентов, а не программа для учёта объектов: ${SITE_NAME}, таблица или бесплатная универсальная CRM. Если вы выставляете собственные объекты, нужны выгрузка на порталы и сайт: inmoGesco, Witei, Inmovilla, Sooprema, Inmoweb или Mobilia. Для общих объектов Коста-дель-Соль — Resales Online или PropertyList.`,
  Body,
  faq: [
    {
      q: "Какая CRM лучше всего подходит риелтору в Испании?",
      a: `Зависит от того, как вы работаете. Риелторам, которые продают объекты других агентств, нужна собственная база клиентов (${SITE_NAME}, таблица или бесплатная универсальная CRM). Тем, кто выставляет собственные объекты, нужны выгрузка на порталы и сайт (inmoGesco, Witei, Inmovilla, Sooprema, Inmoweb, Mobilia). На Коста-дель-Соль Resales Online и PropertyList идут вместе с сетью общих объектов.`,
    },
    {
      q: "Какая CRM подойдёт, если я продаю для нескольких агентств?",
      a: `Та, в которой хранятся ваши клиенты, а не объекты одного агентства. ${SITE_NAME} отмечает у каждого клиента агентство, через которое он пришёл, так что одна база охватывает все агентства; CRM для агентств построены вокруг объектов одного агентства, и аккаунт обычно принадлежит этому агентству.`,
    },
    {
      q: "Какие CRM выгружают объекты на idealista?",
      a: `Inmovilla и Inmoweb выгружают объекты на idealista в реальном времени, а Sooprema, Mobilia, Vesta, InmoProCRM и платные тарифы inmoGesco указывают его среди своих порталов. Witei с февраля 2022 года не может подключать новые выгрузки на idealista. Fincta и ${SITE_NAME} объекты не публикуют.`,
    },
    {
      q: "Какая CRM для недвижимости работает через официальный API WhatsApp?",
      a: "Mobilia подключается через официальный WhatsApp Business API от Meta, как и Clientify, тарифы Professional в HubSpot и платные тарифы Zoho CRM. А InmoProCRM и ящик входящих WhatsApp в Inmovilla вместо этого подключают ваш номер по QR-коду, как это делает WhatsApp Web.",
    },
    {
      q: "Хватит ли независимому риелтору таблицы?",
      a: "Для нескольких десятков клиентов — да, если обновлять её после каждого звонка и показа. Но она не напомнит, с кем пора снова связаться, и не подготовит сообщение, а именно здесь CRM начинает окупаться.",
    },
  ],
  related: ["guideFreeCrm", "guideCrmAlternatives", "crmSpain"],
  topic: { "@type": "Thing", name: "CRM-системы для недвижимости в Испании" },
};
