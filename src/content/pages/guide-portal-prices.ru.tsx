import Link from "next/link";

import { intlTag } from "@/i18n/config";
import { marketingPath } from "@/lib/routes";
import { CHECKED, PUBLISHED } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { Callout } from "@/components/marketing/callout";
import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { SOURCES as S } from "@/content/pages/guide-portal-prices.sources";

const L = "ru";

/** День первой публикации страницы, он остаётся её datePublished. */
const FIRST_PUBLISHED = PUBLISHED.guidePortalPrices;

/**
 * День, когда каждую цену последний раз сверили с сайтом портала. Это же дата
 * «Обновлено», dateModified и lastmod в sitemap, поэтому ежеквартальная
 * проверка меняет CHECKED.guidePortalPrices, но никогда PUBLISHED.
 */
const LAST_CHECKED = CHECKED.guidePortalPrices ?? FIRST_PUBLISHED;

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
 * Названия порталов в первой колонке — бренды: в узкой таблице они могут
 * переноситься по пробелу, но не внутри слова, как разрешает правило для
 * русских таблиц в globals.css.
 */
const BRAND_CELL = "align-top [overflow-wrap:normal]! hyphens-manual!";

function Body() {
  return (
    <>
      <Callout title={`Цены проверены ${AS_OF}`}>
        <ul>
          <li>
            Ни один общенациональный портал Испании не публикует цены для агентств: Idealista,
            Fotocasa и habitaclia, pisos.com и yaencontre называют цену только по звонку.
          </li>
          <li>
            Из порталов, которыми пользуются агентства на побережье, цены для профессионалов
            публикуют только ThinkSpain, Properstar, Spainhouses и FINN.no.
          </li>
          <li>Kyero перестал быть бесплатным для агентств 31 декабря 2025 года.</li>
          <li>
            Цифры, которые ходят в интернете про Idealista, взяты из блогов и чужих CRM без
            источника. Мы приводим их отдельно и так и подписываем.
          </li>
        </ul>
        <p>
          Эта страница описывает, что публикует каждый портал. Она не советует какой-то из них и
          не оценивает качество заявок.
        </p>
      </Callout>

      <h2>Испанские порталы: что они публикуют</h2>
      <p>
        Все они продают агентствам пакеты объявлений с дополнительными услугами вроде
        выделенных объявлений. Разница в том, видна ли цена до звонка. На {AS_OF} её не
        показывал ни один из крупных порталов.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Портал</th>
            <th scope="col">Цена для агентств</th>
            <th scope="col">Бесплатно для профессионалов</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={BRAND_CELL}>Idealista</th>
            <td>По запросу</td>
            <td>Нет: агентства должны работать через профессиональный профиль</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Fotocasa и habitaclia</th>
            <td>По запросу (пакеты Start, Basic и Premium без опубликованной цены)</td>
            <td>Не указано</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>pisos.com</th>
            <td>По запросу</td>
            <td>Не указано</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>yaencontre</th>
            <td>По запросу</td>
            <td>Не указано</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Milanuncios</th>
            <td>С третьего объявления — через Fotocasa Pro</td>
            <td>Да: 2 объявления о недвижимости в каждой категории</td>
          </tr>
        </tbody>
      </table>

      <h3>Idealista</h3>
      <ul>
        <li>
          <strong>Цена:</strong> на странице для профессионалов говорится о «разных вариантах
          цен и услуг», есть телефон и форма обратного звонка, а цен нет (
          <Source href={S.idealistaPro}>idealista, новый профессионал</Source>).
        </li>
        <li>
          <strong>Бесплатного пути нет:</strong> агент должен размещаться через профессиональный
          профиль, а частный аккаунт, которым пользуется агент, idealista может заблокировать (
          <Source href={S.idealistaAgentAccount}>справка idealista</Source>).
        </li>
        <li>
          <strong>Осторожно с ценами из блогов:</strong> 43,90 € за 30 дней выделения или
          11,90 € за 24 часа, которые цитируют многие блоги, — это тарифы для частных лиц, как и
          два первых бесплатных объявления (
          <Source href={S.idealistaPrivate}>ценовая политика для частных лиц</Source>).
        </li>
        <li>
          <strong>Заявки:</strong> приходят во входящие idealista/tools с уведомлением на почту (
          <Source href={S.idealistaInbox}>справка idealista/tools</Source>).
        </li>
        <li>
          <strong>Объявления:</strong> как интеграции в реальном времени idealista рекомендует
          свой idealista/tools и Inmovilla, который тоже ему принадлежит (
          <Source href={S.idealistaSoftware}>рекомендуемые программы</Source>).
        </li>
      </ul>

      <h3>Fotocasa и habitaclia (Fotocasa Pro)</h3>
      <ul>
        <li>
          <strong>Цена:</strong> три пакета — Start, Basic и Premium — без цены, IVA и срока
          договора на сайте. Все публикуют без ограничений в Fotocasa, habitaclia и Milanuncios;
          Basic включает 20 выделенных объявлений в Milanuncios, Premium — 40 (
          <Source href={S.fotocasaPacks}>пакеты Fotocasa Pro</Source>).
        </li>
        <li>
          <strong>Заявленный размер:</strong> Fotocasa — 13 800 клиентов и 28 млн визитов в
          месяц, habitaclia — 5 600 клиентов и 18 млн (
          <Source href={S.fotocasaAbout}>Fotocasa</Source>,{" "}
          <Source href={S.habitacliaAbout}>habitaclia</Source>).
        </li>
        <li>
          <strong>Заявки:</strong> «менеджер возможностей» сообщает по почте назначенному
          агенту о каждом звонке, включая пропущенные (
          <Source href={S.fotocasaLeads}>менеджер возможностей</Source>).
        </li>
        <li>
          <strong>Объявления:</strong> ваша CRM подключается по ключу InmoFactory, и то же
          подключение работает для habitaclia (<Source href={S.witeiInmofactory}>справка Witei</Source>
          ).
        </li>
      </ul>

      <h3>pisos.com, yaencontre и Milanuncios</h3>
      <ul>
        <li>
          <strong>pisos.com</strong> продаёт «разные пакеты публикации» через отдел продаж,
          вместе со своей CRM и приложением (
          <Source href={S.pisosPro}>pisos.com, профессионалам</Source>).
        </li>
        <li>
          <strong>yaencontre</strong> тоже называет цену по запросу; заявки приходят личными
          сообщениями на платформе (<Source href={S.yaencontrePro}>yaencontre, новый профессионал</Source>
          ).
        </li>
        <li>
          <strong>Milanuncios</strong> разрешает профессионалам 2 бесплатных объявления о
          недвижимости в каждой категории. Для большего отправляет в Fotocasa Pro (
          <Source href={S.milanunciosPro}>справка Milanuncios</Source>). Его общие тарифы PRO —
          не цены для агентств недвижимости.
        </li>
      </ul>

      <h2>Что публикуют другие, без проверки</h2>
      <p>
        Поскольку порталы своих цен не публикуют, цифры в интернете — из блогов, агентств и
        чужих CRM. Ни одна не говорит, откуда взялась, и проверить их мы не смогли. Мы приводим
        их с источником и датой, потому что именно их вы прочитаете на других сайтах.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Портал</th>
            <th scope="col">Что опубликовано</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={BRAND_CELL}>Idealista</th>
            <td>
              «От 60 € в месяц + IVA», а в зависимости от зоны и услуг больше 300 € (
              <Source href={S.reportInmogesco}>inmoGesco</Source>, обновлено в апреле 2026 года)
            </td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Idealista</th>
            <td>
              От 150 € в месяц (<Source href={S.reportInmolovers}>Inmolovers</Source>, 11
              февраля 2026 года)
            </td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Idealista</th>
            <td>
              200–500 € в месяц только за присутствие, в среднем около 1 000 € (
              <Source href={S.reportPsi}>Diario de un PSI</Source>, 25 июня 2025 года,
              авторская колонка)
            </td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Fotocasa и habitaclia</th>
            <td>
              Fotocasa от 100 € в месяц, habitaclia от 80 € в месяц (
              <Source href={S.reportInmolovers}>Inmolovers</Source>, 11 февраля 2026 года)
            </td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>pisos.com</th>
            <td>
              От 50 € в месяц (<Source href={S.reportInmolovers}>Inmolovers</Source>, 11 февраля
              2026 года)
            </td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>yaencontre</th>
            <td>
              От 60 € в месяц (<Source href={S.reportInmolovers}>Inmolovers</Source>, 11 февраля
              2026 года)
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Цифры расходятся неслучайно: цена зависит от зоны, количества объявлений, дополнительных
        услуг (выделение, другие языки, другие порталы той же группы) и того, о чём вы
        договоритесь с менеджером, включая минимальный срок.
      </p>

      <h2>Международные порталы</h2>
      <p>
        На Коста-дель-Соль и Коста-Бланке многие покупатели приезжают из-за границы, и здесь
        часть порталов свои цены публикует.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Портал</th>
            <th scope="col">Цена для агентств</th>
            <th scope="col">Что заявляют</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={BRAND_CELL}>Kyero</th>
            <td>По запросу; бесплатных объявлений нет с 1 января 2026 года</td>
            <td>3 млн покупателей и 70 000 заявок в месяц</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>ThinkSpain</th>
            <td>Опубликована: от 118 € + IVA за 90 дней (25 объявлений)</td>
            <td>Более 1 млн посетителей и 50 000 заявок в месяц</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Properstar</th>
            <td>Опубликована: от 132,50 € в месяц (20 объявлений, оплата за год)</td>
            <td>35 стран и более 80 партнёрских порталов</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Spainhouses</th>
            <td>Опубликована: от 36 € в месяц (25 объявлений, предложение для Малаги)</td>
            <td>Скидки при оплате за квартал, полгода и год</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>FINN.no</th>
            <td>Опубликована: за объявление, от 2 360 до 571 норвежской кроны + НДС</td>
            <td>Норвежский раздел зарубежной недвижимости</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Rightmove Overseas</th>
            <td>По запросу</td>
            <td>Более 26 млн посетителей в год</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>Green-Acres</th>
            <td>По запросу; 30 дней бесплатно</td>
            <td>70 % посетителей из-за границы</td>
          </tr>
          <tr>
            <th scope="row" className={BRAND_CELL}>JamesEdition</th>
            <td>По запросу; жильё от 490 000 $</td>
            <td>Более 2,4 млн визитов в месяц</td>
          </tr>
        </tbody>
      </table>

      <h3>Kyero</h3>
      <ul>
        <li>
          <strong>Больше не бесплатно:</strong> бесплатные объявления закончились 31 декабря
          2025 года, и с 1 января 2026 года на сайте видны только платящие агентства (
          <Source href={S.kyeroEndsFree}>Kyero, ноябрь 2025 года</Source>).
        </li>
        <li>
          <strong>Цена:</strong> платная подписка без опубликованного прайс-листа: нужно связаться с Kyero (<Source href={S.kyeroFeatures}>Kyero</Source>).
        </li>
        <li>
          <strong>НДС:</strong> компания британская (Portal 47 Ltd). Она не берёт испанский IVA, а
          британский НДС не берёт с компаний, зарегистрированных в ЕС (
          <Source href={S.kyeroVat}>справка Kyero</Source>).
        </li>
        <li>
          <strong>Объявления и заявки:</strong> импортирует ваши объекты в своём формате XML,
          который умеют выгружать более 50 программ, и присылает заявки по почте, максимум на два
          адреса (<Source href={S.kyeroXml}>спецификация XML</Source>,{" "}
          <Source href={S.kyeroEmails}>адреса для заявок</Source>).
        </li>
        <li>
          <strong>Аудитория:</strong> уникальные визиты за 12 месяцев — в основном из
          Великобритании (4,2 млн), Испании (3,25), Нидерландов (1,7), Германии (1,55), Франции
          (1,35) и США (1,05) (<Source href={S.kyeroJoin}>Kyero для агентств</Source>).
        </li>
      </ul>

      <h3>ThinkSpain</h3>
      <p>
        Вводные пакеты на 90 дней для новых агентств или тех, кто не размещался больше года, без
        IVA. Фиксированная плата без комиссии, заявки приходят на почту и в личный кабинет (
        <Source href={S.thinkspain}>ThinkSpain для агентств</Source>):
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Объявлений</th>
            <th scope="col">Цена за 90 дней</th>
            <th scope="col">Выделенных</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>25</td>
            <td>118 €</td>
            <td>1</td>
          </tr>
          <tr>
            <td>50</td>
            <td>161 €</td>
            <td>2</td>
          </tr>
          <tr>
            <td>100</td>
            <td>227 €</td>
            <td>5</td>
          </tr>
          <tr>
            <td>250</td>
            <td>377 €</td>
            <td>10</td>
          </tr>
          <tr>
            <td>500</td>
            <td>625 €</td>
            <td>25</td>
          </tr>
        </tbody>
      </table>
      <p>
        На той же странице упоминается «от 25 евро в месяц» при годовой оплате, но годовой
        таблицы нет.
      </p>

      <h3>Properstar</h3>
      <p>
        Properstar, в который теперь входит ListGlobally, публикует три тарифа в евро, не
        уточняя, включён ли НДС; больше 100 объявлений — по запросу (
        <Source href={S.properstarPricing}>цены Properstar</Source>):
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Тариф</th>
            <th scope="col">Оплата за год</th>
            <th scope="col">Оплата за 6 месяцев</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Global 20</td>
            <td>132,50 € в месяц</td>
            <td>150 € в месяц</td>
          </tr>
          <tr>
            <td>Global 50</td>
            <td>225 € в месяц</td>
            <td>248,33 € в месяц</td>
          </tr>
          <tr>
            <td>Global 100</td>
            <td>366,67 € в месяц</td>
            <td>406,67 € в месяц</td>
          </tr>
        </tbody>
      </table>
      <p>
        Оплата вперёд с автопродлением: чтобы отказаться, предупредите минимум за 30 дней до
        продления (<Source href={S.properstarCancel}>справка Properstar</Source>). Читает XML
        Kyero и другие форматы, а заявки присылает на почту или прямо в вашу CRM.
      </p>

      <h3>Spainhouses.net</h3>
      <p>
        Публикует цены в калькуляторе по провинциям. С предложением для Малаги, без указания НДС
        (<Source href={S.spainhouses}>цены Spainhouses</Source>):
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Объявлений</th>
            <th scope="col">Помесячно</th>
            <th scope="col">За год</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>25</td>
            <td>36 € в месяц</td>
            <td>345,60 € (28,80 € в месяц)</td>
          </tr>
          <tr>
            <td>50</td>
            <td>54 € в месяц</td>
            <td>518,40 €</td>
          </tr>
          <tr>
            <td>100</td>
            <td>96 € в месяц</td>
            <td>921,60 €</td>
          </tr>
          <tr>
            <td>250</td>
            <td>126 € в месяц</td>
            <td>1 209,60 €</td>
          </tr>
          <tr>
            <td>500</td>
            <td>156 € в месяц</td>
            <td>1 497,60 €</td>
          </tr>
        </tbody>
      </table>

      <p>
        Предоплата снижает цену: на 10 % за квартал, на 15 % за полгода и на 20 % за
        год.
      </p>

      <h3>FINN.no (Норвегия)</h3>
      <p>
        Крупнейший норвежский портал, в разделе зарубежной недвижимости которого размещаются и
        испанские агентства. Берёт плату за объявление, тем дешевле, чем больше публикуете, в
        норвежских кронах без НДС; новые цены — с 5 января 2027 года (
        <Source href={S.finn}>цены FINN</Source>):
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Объявлений</th>
            <th scope="col">Крон за объявление</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1–10</td>
            <td>2 360</td>
          </tr>
          <tr>
            <td>11–50</td>
            <td>1 636</td>
          </tr>
          <tr>
            <td>51–100</td>
            <td>1 319</td>
          </tr>
          <tr>
            <td>101–250</td>
            <td>821</td>
          </tr>
          <tr>
            <td>250–499</td>
            <td>726</td>
          </tr>
          <tr>
            <td>500 и больше</td>
            <td>571</td>
          </tr>
        </tbody>
      </table>

      <h3>Rightmove Overseas, Green-Acres и JamesEdition</h3>
      <ul>
        <li>
          <strong>Rightmove Overseas</strong>: вы заполняете форму, и менеджер перезванивает в
          течение 3–5 рабочих дней (<Source href={S.rightmove}>Rightmove Overseas</Source>).
        </li>
        <li>
          <strong>Green-Acres</strong>: 30 дней бесплатно без обязательств, дальше цена под вас;
          70 % посетителей — из-за границы, в основном из Нидерландов, Германии, Великобритании и
          Бельгии (<Source href={S.greenAcres}>Green-Acres для профессионалов</Source>).
        </li>
        <li>
          <strong>JamesEdition</strong>, люкс: тарифы Elite и Elite Plus с индивидуальной ценой,
          жильё от 490 000 долларов (
          <Source href={S.jamesEdition}>JamesEdition для профессионалов</Source>).
        </li>
      </ul>
      <p>
        И не забывайте об охвате idealista за пределами Испании: у него 18 версий на других
        языках, и он автоматически переводит ваши объявления на английский (
        <Source href={S.idealistaTranslate}>справка idealista/tools</Source>).
      </p>

      <h2>Что изменилось в 2025 и 2026 годах</h2>
      <dl>
        <dt>Июнь 2024 года</dt>
        <dd>
          Фонд Cinven покупает контроль над idealista (
          <Source href={S.newsCinven}>elDiario.es</Source>).
        </dd>
        <dt>Март 2025 года</dt>
        <dd>
          Immobiliare.it покупает pisos.com у Vocento (
          <Source href={S.newsPisos}>Online Marketplaces</Source>).
        </dd>
        <dt>Сентябрь 2025 года</dt>
        <dd>
          Scout24, владелец ImmoScout24, договаривается о покупке Fotocasa и habitaclia; сделка
          закрывается в марте 2026 года, бренды остаются раздельными (
          <Source href={S.newsScout24}>Scout24</Source>,{" "}
          <Source href={S.newsScout24Close}>Online Marketplaces</Source>). В том же месяце
          idealista отказывается от покупки Kyero из-за условий антимонопольного ведомства CNMC (
          <Source href={S.newsKyeroDeal}>Forbes</Source>).
        </dd>
        <dt>31 декабря 2025 года</dt>
        <dd>Kyero перестаёт публиковать бесплатные объявления.</dd>
      </dl>

      <h2>Перед договором с порталом: что спросить</h2>
      <ol>
        <li>Цену для вашей зоны и вашего числа объявлений — письменно.</li>
        <li>Минимальный срок, есть ли автопродление и за сколько нужно предупредить об уходе.</li>
        <li>Включён ли в цену IVA.</li>
        <li>Что входит в пакет: выделение, другие языки, другие порталы той же группы.</li>
        <li>
          Как приходят заявки — почта, приложение или звонки — и можно ли пересылать их на другой
          адрес.
        </li>
        <li>Какой формат загрузки принимается и подключена ли уже ваша CRM.</li>
        <li>Сколько заявок в месяц получают похожие объявления в вашей зоне.</li>
      </ol>

      <h2>Заявки со всех порталов — в одном списке</h2>
      <p>
        С двумя-тремя порталами заявки приходят во входящие idealista, в уведомления Fotocasa,
        на почту от Kyero и в WhatsApp, и ни один из этих ящиков не подскажет, кому пора написать
        снова. {SITE_NAME} — CRM для независимых риелторов, которая собирает их в один список, у
        каждого — следующий шаг.
      </p>
      <p>
        Сейчас это работает через вставку: копируете заявку с портала, вставляете в поле для
        лидов и получаете заполненную карточку клиента на проверку. Автоматической связи с
        порталами нет. Бесплатно до 10 клиентов; подробности — на{" "}
        <Link href={marketingPath("pricing", L)}>странице тарифов</Link> и в руководстве{" "}
        <Link href={marketingPath("guideIdealista", L)}>как работать с лидами idealista</Link>.
      </p>

      <h2>Источники</h2>
      <p>Сайты самих порталов, проверены {AS_OF}.</p>
      <ul>
        <li>
          Idealista: <Source href={S.idealistaPro}>профессионалам</Source>,{" "}
          <Source href={S.idealistaPrivate}>цены для частных лиц</Source>,{" "}
          <Source href={S.idealistaAgentAccount}>аккаунты агентов</Source>,{" "}
          <Source href={S.idealistaInbox}>входящие</Source>,{" "}
          <Source href={S.idealistaSoftware}>рекомендуемые программы</Source>,{" "}
          <Source href={S.idealistaTranslate}>автоматический перевод</Source>.
        </li>
        <li>
          Fotocasa Pro: <Source href={S.fotocasaPacks}>пакеты</Source>,{" "}
          <Source href={S.fotocasaAbout}>Fotocasa</Source>,{" "}
          <Source href={S.habitacliaAbout}>habitaclia</Source>,{" "}
          <Source href={S.fotocasaLeads}>менеджер возможностей</Source>; подключение через
          InmoFactory, <Source href={S.witeiInmofactory}>справка Witei</Source>.
        </li>
        <li>
          <Source href={S.pisosPro}>pisos.com</Source>,{" "}
          <Source href={S.yaencontrePro}>yaencontre</Source>,{" "}
          <Source href={S.milanunciosPro}>Milanuncios</Source>.
        </li>
        <li>
          Kyero: <Source href={S.kyeroEndsFree}>конец бесплатных объявлений</Source>,{" "}
          <Source href={S.kyeroFeatures}>тарифы</Source>, <Source href={S.kyeroVat}>НДС</Source>,{" "}
          <Source href={S.kyeroXml}>XML</Source>,{" "}
          <Source href={S.kyeroEmails}>адреса для заявок</Source>,{" "}
          <Source href={S.kyeroJoin}>аудитория</Source>.
        </li>
        <li>
          <Source href={S.thinkspain}>ThinkSpain</Source>,{" "}
          <Source href={S.properstarPricing}>Properstar</Source> (и{" "}
          <Source href={S.properstarCancel}>его условия</Source>),{" "}
          <Source href={S.spainhouses}>Spainhouses.net</Source>,{" "}
          <Source href={S.finn}>FINN.no</Source>, <Source href={S.rightmove}>Rightmove Overseas</Source>
          , <Source href={S.greenAcres}>Green-Acres</Source>{" "}
          и <Source href={S.jamesEdition}>JamesEdition</Source>.
        </li>
        <li>
          Непроверенные цифры: <Source href={S.reportInmogesco}>inmoGesco</Source>,{" "}
          <Source href={S.reportInmolovers}>Inmolovers</Source>,{" "}
          <Source href={S.reportPsi}>Diario de un PSI</Source>.
        </li>
        <li>
          Новости: <Source href={S.newsCinven}>elDiario.es</Source>,{" "}
          <Source href={S.newsPisos}>Online Marketplaces (pisos.com)</Source>,{" "}
          <Source href={S.newsScout24}>Scout24</Source>,{" "}
          <Source href={S.newsScout24Close}>Online Marketplaces (Fotocasa)</Source>,{" "}
          <Source href={S.newsKyeroDeal}>Forbes</Source>.
        </li>
      </ul>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Цены Idealista, Fotocasa и Kyero для агентств (2026)",
  description:
    "Idealista и Fotocasa не публикуют цены для агентств. Сколько берут испанские и международные порталы и какие цены официальные, со ссылками на источники.",
  kind: "article",
  published: FIRST_PUBLISHED,
  modified: LAST_CHECKED,
  eyebrow: "Руководство · Порталы",
  heading: "Сколько Idealista, Fotocasa и международные порталы берут с агентства в Испании",
  lead: "Ни один общенациональный портал Испании не публикует цены для профессионалов: Idealista, Fotocasa и habitaclia, pisos.com и yaencontre называют цену по звонку, в зависимости от зоны и числа объявлений. Из порталов, которыми пользуются агентства на побережье, цены публикуют только ThinkSpain, Properstar, Spainhouses и FINN.no. Цифры про Idealista в интернете взяты из блогов без источника, а Kyero перестал быть бесплатным 31 декабря 2025 года.",
  Body,
  faq: [
    {
      q: "Сколько стоит Idealista для агентства недвижимости?",
      a: "Idealista не публикует цены для профессионалов: их называет отдел продаж в зависимости от зоны, числа объявлений и услуг. Цифры из интернета — от 60 или 150 € в месяц до средних 1 000 € — взяты из блогов и чужих CRM без источника и не проверены.",
    },
    {
      q: "Может ли риелтор размещаться на Idealista бесплатно?",
      a: "Нет. Idealista требует от агентств и агентов платный профессиональный профиль и может заблокировать частный аккаунт, которым пользуется агент. Два бесплатных объявления — для частных лиц.",
    },
    {
      q: "Сколько стоит Fotocasa Pro?",
      a: "Fotocasa Pro продаёт три пакета — Start, Basic и Premium — с публикацией в Fotocasa, habitaclia и Milanuncios, но цены не публикует: их называет отдел продаж.",
    },
    {
      q: "Kyero всё ещё бесплатен для агентств?",
      a: "Нет. Kyero перестал публиковать бесплатные объявления 31 декабря 2025 года, и с 1 января 2026 года на сайте видны только агентства с платной подпиской, цена по запросу.",
    },
    {
      q: "Какие международные порталы публикуют цены для агентств?",
      a: "Из тех, которыми пользуются агентства на побережье: ThinkSpain (пакеты на 90 дней от 118 € + IVA), Properstar (от 132,50 € в месяц при оплате за год), Spainhouses.net (от 36 € в месяц по предложению для Малаги) и норвежский FINN.no (за объявление). Kyero, Rightmove Overseas, Green-Acres и JamesEdition — по запросу.",
    },
  ],
  related: ["guideIdealista", "crmMarbella", "toolCommission"],
};
