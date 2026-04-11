/**
 * Regenerates static SEO pillar pages under public/seo/.
 * Run: node scripts/generate-seo-pillar-pages.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "seo");

const BASE = "https://lista-crm.com";
const OG_IMAGE = `${BASE}/public/assets/pic1.jpg`;

const pillars = [
  {
    slug: "online-booking",
    file: "online-booking.html",
    navLabel: "זימון תורים אונליין",
    title: "זימון תורים אונליין ללקוחות — Lista CRM",
    description:
      "לקוחות קובעים תור לבד בקישור; רואים רק שעות פנויות, לא את כל היומן. פחות טלפונים, פחות בלבול.",
    h1: "זימון תורים אונליין ללקוחות",
    lead:
      "שולחים קישור — והלקוח בוחר שעה מהנייד. הוא לא רואה מי כבר נמצא אצלכם בחדר, ולא את כל רשת הפגישות; הוא רואה בעיקר מה שצריך כדי לסגור תור. אתם נשארים עם היומן המלא אצלכם.",
    body: `
<p>זה לא ״יומן גלוי לכולם״. הרעיון פשוט: הלקוח מקבל חלון זמן שמתאים לכללים שהגדרתם — אורך טיפול, הפסקות, ימים שבהם אתם בכלל עובדים, וכו׳.</p>

<h2>מה בפועל מופיע מול הלקוח?</h2>
<p>בדרך כלל <strong>שעות פנויות</strong>, לא רשימת שמות ולא מה קורה אחרי. זה מוריד כפל קביעות ומפחית שאלות מסוג ״אבל חשבתי שיש מקום״.</p>

<h2>מתי זה באמת עוזר?</h2>
<p>מישהי שרוצה לסגור תור ב־22:00 בלי להשאיר ״היי מה קורה״ בוואטסאפ. יום חלש שאתם רוצים למלא — והקישור יושב באתר, בסטורי או בתזכורת ישנה. וכשיש כמה מטפלים, כל אחד עם לוח משלו והלקוח בוחר מי מתאים לו.</p>

<h2>למה זה נושא רגיש לחלק מהעסקים</h2>
<p>יש מי שרוצה שהלקוח ידע בדיוק מתי אפשר להגיע, אבל לא רוצה שיראו שיש פגישה עם מישהו אחר או שיש חור באמצע היום מסיבה שמסבירה ללקוחות יותר מדי. הצגת שעות פנויות בלבד נותנת פשרה סבירה בין שני הצדדים.</p>

<h2>אחרי שסגרו — מה הלאה?</h2>
<p>אישור ללקוח, עדכון אוטומטי אצלכם ביומן, ואז אפשר להמשיך לתזכורת (למשל SMS יום לפני). פחות מצבים של ״שכחנו שיש תור״.</p>

<div class="note">איך בדיוק זה נראה אצלכם תלוי בהגדרות ובמסלול — שווה לעבור על זה עם הנציג: ביטולים, מקדמה, מדיניות — כדי שלא תופתעו אחרי שכבר פרסמתם את הקישור.</div>

<h2>הצד שלכם: ניהול היומן</h2>
<p>מחפשים תצוגת יום / שבוע / חודש ועבודה מהנייד כבעלי העסק? זה נכנס יותר ל<a href="/public/seo/calendar-management.html">ניהול יומן ותצוגות</a>.</p>
`,
  },
  {
    slug: "sms-reminders",
    file: "sms-reminders.html",
    navLabel: "תזכורות SMS",
    title: "תזכורות SMS לתורים ופגישות — Lista CRM",
    description:
      "SMS על אישור תור, שינוי שעה, ותזכורת לפני הפגישה. פחות ״שכחתי״, פחות רדיפה אחרי לקוחות בוואטסאפ.",
    h1: "תזכורות SMS לתורים ופגישות",
    lead:
      "טקסט קצר בזמן הנכון עושה הבדל: פחות ״חשבתי שזה מחר״, פחות חורים ביומן, ופחות תחושה שאתם המזכירות האישיות של כולם.",
    body: `
<p>סביב תור יש כמה נקודות שבהן הודעה עוזרת: אחרי קביעה (שיהיה מה לשמר בטלפון), כשמשהו זז, ויום לפני כשצריך נדנוד עדין.</p>

<h2>שלושת הסוגים שאתם הכי מכירים</h2>
<p><strong>אישור</strong> מיד אחרי שסגרו שעה. <strong>עדכון</strong> אם הזזתם או ביטלתם — כדי שלא יגיעו לפי הזיכרון הישן. <strong>תזכורת</strong> לפני — לא כי הלקוח ״לא אחראי״, פשוט כי לחיים יש סדר עדיפויות משלהם.</p>

<h2>זה לא מבטל הברזות לגמרי — אבל זה מסדר את השגרה</h2>
<p>אף מערכת לא מחליפה בן אדם שלא רוצה להגיע. כן אפשר לייצב ציפיות: יש תאריך ושעה בכתב, באותו ערוץ שהלקוח כבר רגיל אליו.</p>

<h2>תור לעומת קמפיין שיווקי</h2>
<p>כאן אנחנו מדברים בעיקר על הודעות שנוגעות ל<strong>תור או לשינוי פגישה</strong>. מבצעים לרשימת תפוצה, דברים המוניים, הסרות — זה עולם אחר מבחינת חוק, הסכמות וספק SMS. תבדקו את זה בנפרד עם יועץ או עם הספק, אל תסמכו רק על ״זה יצא מהמערכת״.</p>

<div class="note">ניסוחים, תזמון ומה בכלל אפשר לשלוח — תלוי במה שמוגדר אצלכם ובחבילה אצל ספק ה-SMS. אם משהו נראה ״לא עובד״, לפעמים זה לא באג אלא הגדרה.</div>

<p>ועוד שני דברים שעוזרים: <a href="/public/seo/online-booking.html">זימון נוח</a> בלי להסתובב על הטלפון, ו<a href="/public/seo/client-crm.html">כרטיס לקוח</a> עם טלפון מעודכן — אחרת התזכורת נוחתת לאן שלא צריך.</p>
`,
  },
  {
    slug: "client-crm",
    file: "client-crm.html",
    navLabel: "כרטיס לקוח וניהול",
    title: "כרטיס לקוח, היסטוריה וניהול פגישות — Lista CRM",
    description:
      "טלפון, היסטוריית טיפולים, מה שולם ומה פתוח, הצעות מחיר ותיעוד — במקום אחד, בלי לאבד שרשור בוואטסאפ או פתקים על השולחן.",
    h1: "כרטיס לקוח, היסטוריה וניהול מידע",
    lead:
      "על כל לקוח יש מה לזכור: מי זה, מה עשיתם בפעם הקודמת, כמה שילמה ומה עדיין פתוח, ומה כדאי לרשום לפני הפגישה הבאה. הרעיון הוא שכל זה יושב במקום אחד ונפתח גם כשאתם לא ליד המחשב.",
    body: `
<h2>מה בדרך כלל נכנס ל״כרטיס לקוח״?</h2>
<p>פרטי קשר והערות קבלה, <strong>מה קרה בכל פגישה</strong> (מתי, מה בוצע, באיזה מחיר), <strong>תשלומים ויתרות</strong> והצעות מחיר שכבר יצאו לדרך. מעבר לזה — שדות שאתם בונים לפי סוג העסק: לפעמים תמונות לפני/אחרי, לפעמים הערות שרק אתם צריכים לראות.</p>

<h2>תיעוד רפואי/רגיש — איך לחשוב על זה נכון</h2>
<p>שדות כמו ״רקע רפואי״ או ״אנמנזה״ הם כלים <strong>לתיעוד שבעל העסק בוחר להשתמש בהם</strong> לצורך ניהול העבודה. Lista אינה מחליפה ייעוץ מקצועי או כלי רגולטורי; האחריות על מה נשמר, איך נשמר ולמי מוצג נשארת אצל העסק ובהתאם לחוק החל.</p>

<h2>תמונות לפני ואחרי</h2>
<p>לעסקי יופי, קוסמטיקה ועוד, תמונות יכולות לעזור לזכור תוצאות ולהציג התקדמות. חשוב להסביר ללקוחות <strong>מתי ולמה</strong> מתעדים תמונה, ולשמור על נהלים מתאימים לאבטחת מידע ופרטיות.</p>

<h2>איך זה מתחבר לתורים ולסדרות?</h2>
<p>כרטיס חזק משלים <a href="/public/seo/online-booking.html">זימון עצמאי</a> (הלקוח כבר בפנים עם היסטוריה), <a href="/public/seo/series-and-memberships.html">סדרות ומנויים</a> (כמה ניצולים נשארו), ו<a href="/public/seo/vip-club.html">מועדון לקוחות</a> (סיווג והטבות).</p>
`,
  },
  {
    slug: "series-and-memberships",
    file: "series-and-memberships.html",
    navLabel: "סדרות ומנויים",
    title: "ניהול סדרות טיפולים, מנויים וכרטיסיות — Lista CRM",
    description:
      "סדרות, מנויים וחבילות — ברור כמה ניצולים נשארו לכל לקוח, בלי אקסל נפרד ובלי ויכוחים בקופה על ״כמה כבר השתמשנו״.",
    h1: "סדרות טיפולים, מנויים וכרטיסיות",
    lead:
      "השאלה שחוזרת על עצמה: כמה נשאר מהחבילה? כשזה רשום ליד הלקוחה, גם היא וגם אתם יודעים איפה עומדים — מחירים, הנחות וניצולים באותו מקום.",
    body: `
<h2>איך זה נראה ביום־יום</h2>
<p>סדרת שמונה טיפולים — בכל ביקור מסמנים ניצול והסטטוס ברור. מנוי חודשי עם תקרת ביקורים — קל לראות מתי הגיע זמן לחידוש. חבילת ״עשרה במחיר מיוחד״ — פחות ״אבל אמרת שעוד נשארו שלושה״.</p>

<h2>חיבור לתשלומים וחובות</h2>
<p>כשהמידע על חבילה יושב ליד <a href="/public/seo/client-crm.html">כרטיס הלקוח</a>, קל יותר להסביר ללקוח מה שולם, מה מגיע מראש ומה נשאר לגבות — בלי לחפש באקסל נפרד.</p>

<h2>הנחות ומבצעים בתוך המסלול</h2>
<p>אפשר לתעד מחירים והנחות בצורה שתהיה עקבית בין פגישות. המטרה היא <strong>שקיפות פנימית</strong>: מה המדיניות, ואיך היא מיושמת על כל לקוח.</p>

<h2>המשך טבעי: מועדון לקוחות</h2>
<p>כשסדרות עובדות חלק, הרבה עסקים מוסיפים שכבת <a href="/public/seo/vip-club.html">מועדון או VIP</a> כדי לתגמל לקוחות נאמנות ולנהל הטבות בצורה מסודרת.</p>
`,
  },
  {
    slug: "vip-club",
    file: "vip-club.html",
    navLabel: "מועדון VIP",
    title: "מועדון לקוחות, VIP וסיווג לקוחות — Lista CRM",
    description:
      "VIP, סיווג לקוחות והטבות ממוקדות — בלי רשימות באקסל. כולל אפשרויות לטפל בלקוחות שחוזרים על אי־הגעה בלי לערבב את כולם באותה סירה.",
    h1: "מועדון לקוחות, VIP וסיווג",
    lead:
      "מי נחשב VIP, מי מקבל הצעה אחרת מחדשים, ומי דווקא צריך תשומת לב מיוחדת — כשזה בתוך המערכת, לא צריך לזכור בראש מי זה מי.",
    body: `
<h2>מה זה נותן בעולם האמיתי?</h2>
<p><strong>תוויות וסיווג</strong> — חדש, נאמן, VIP, או ״דורש תשומת לב״. <strong>הטבות</strong> שמגיעות למי שמתאים, במקום מבצע אחד גדול לכולם. ועדיין — <strong>ניצולים בחבילות</strong> נשארים מסודרים יחד עם <a href="/public/seo/series-and-memberships.html">סדרות ומנויים</a>.</p>

<h2>צמצום הברזות ובעיות בתורים</h2>
<p>יש עסקים שרוצים <strong>להגביל קביעה עצמאית</strong> כשאותו אדם חוזר על אי־הגעה או מפריע לתהליך. אפשר לנהל את זה דרך המערכת — לפי מה שהגדרתם ולפי המדיניות שלכם.</p>
<div class="note">השימוש בחסימות או בהגבלות צריך להיות הוגן, שקוף ללקוח כנדרש, ותואם את תנאי השימוש והחוק.</div>

<h2>שיווק ותזכורות</h2>
<p>מועדון לקוחות יכול לחבר ל<a href="/public/seo/sms-reminders.html">הודעות סביב תורים</a> ול<a href="/public/seo/facebook-leads.html">השלמת פרטים בקישור</a> — כדי שהרשימה שלכם תהיה עדכנית וברת-פעולה.</p>
`,
  },
  {
    slug: "facebook-leads",
    file: "facebook-leads.html",
    navLabel: "השלמת פרטים (קישור)",
    title: "השלמת פרטי לקוח בקישור — Lista CRM",
    description:
      "קישור לנייד — הלקוח ממלא שם, טלפון והערות בעצמו. פחות הקלדה בקופה, פחות ספרות הפוכות, כרטיס שנפתח מהר יותר.",
    h1: "השלמת פרטי לקוח בקישור",
    lead:
      "במקום לשבת ולהעתיק מוואטסאפ לכרטיס, שולחים קישור והוא ממלא מהטלפון. זה לא קסם — זה פשוט מוריד טעויות ומקצר את הקליטה.",
    body: `
<h2>איך זה נראה מהצד של הלקוח?</h2>
<p>קישור, טלפון, שדות שבחרתם (שם, טלפון, הערות…). אנחנו לא מבטיחים כאן ״חיבור לכל פלטפורמה״ — הרעיון הוא <strong>השלמה עצמית פשוטה</strong> דרך מה ששלחתם.</p>

<h2>למה זה חוסך זמן בקליטה?</h2>
<p>פחות העתק־הדבק מצ׳אט. פחות טעויות בספרות. וכשכולם עונים על אותם שדות, גם הקבלה נראית אחידה — לא ״פעם שאלנו ככה ופעם אחרת״.</p>

<h2>פרטיות והסכמה</h2>
<p>כשמבקשים מידע מלקוחות, כדאי לציין במדיניות ובממשק <strong>למה נדרש כל שדה</strong> ואיך משתמשים בנתונים. Lista היא כלי לניהול העסק; האחריות על נהלי GDPR/פרטיות מקומית נשארת אצל בעל העסק.</p>

<h2>המשך מומלץ בזרימת העבודה</h2>
<p>אחרי שהפרטים נכנסים ל<a href="/public/seo/client-crm.html">כרטיס לקוח</a>, הטבעי הוא לאפשר <a href="/public/seo/online-booking.html">קביעת תור</a> ולשלוח <a href="/public/seo/sms-reminders.html">תזכורות SMS</a> סביב הפגישה.</p>

<div class="note">Lista CRM היא מוצר נפרד ממטא (Facebook) ואינה מייצגת את החברה. אין כאן אישור או שותפות רשמית.</div>
`,
  },
  {
    slug: "calendar-management",
    file: "calendar-management.html",
    navLabel: "יומן ותצוגות",
    title: "ניהול יומן פגישות מהנייד — Lista CRM",
    description:
      "יום / שבוע / חודש מהנייד, מותאם לאופן שבו אתם באמת עובדים — לא תבנית גנרית. לצד זה, זימון לקוחות בנפרד.",
    h1: "ניהול יומן פגישות לבעל העסק",
    lead:
      "רוב הזמן אתם רוצים לדעת מה קורה עכשיו, מה קורה השבוע, ומתי יש חור או עומס. אפשר לעבור בין זה ולעדכן גם כשאתם בין לקוחות — בלי לאבד את התמונה הגדולה.",
    body: `
<h2>תצוגות שונות לשאלות שונות</h2>
<p><strong>יומי</strong> — מי מגיע, מה רץ עכשיו, איפה יש רווח. <strong>שבועי</strong> — איפה היום נשבר ואיפה דווקא שקט מדי. <strong>חודשי</strong> — חופשות, אירועים, תכנון קדימה.</p>

<h2>התאמה לסוג העסק</h2>
<p>מספרה, קליניקה, סטודיו או סוכנות — משכי טיפול שונים, זמני הכנה שונים, ולפעמים כמה נותני שירות. המטרה היא שהיומן <strong>ישקף את האופן שבו אתם באמת עובדים</strong>, לא תבנית גנרית שלא מתאימה.</p>

<h2>זימון לקוחות לעומת ניהול פנימי</h2>
<p>כשמדובר ב<strong>מה הלקוח רואה כשהוא קובע תור</strong> ואיך מסתירים פגישות פנימיות — זה מתואר בפירוט ב<a href="/public/seo/online-booking.html">זימון תורים אונליין</a>. כאן המיקוד הוא ב<strong>כלי הניהול שלכם</strong> כבעלי העסק.</p>

<h2>חיבור לשאר המערכת</h2>
<p>יומן חזק עובד יחד עם <a href="/public/seo/client-crm.html">כרטיס לקוח</a>, <a href="/public/seo/sms-reminders.html">תזכורות</a>, <a href="/public/seo/series-and-memberships.html">סדרות</a> ו<a href="/public/seo/vip-club.html">מועדון לקוחות</a> — כדי שכל פגישה תהיה עם הקשר מלא.</p>
`,
  },
];

function escHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildNav(currentSlug) {
  const items = pillars
    .map((p) => {
      const current = p.slug === currentSlug ? ' aria-current="page"' : "";
      return `<li><a href="/public/seo/${p.file}"${current}>${p.navLabel}</a></li>`;
    })
    .join("\n          ");
  return `<nav class="pillar-nav" aria-label="מדריך מאפיינים Lista CRM">
        <ul>
          ${items}
        </ul>
      </nav>`;
}

function buildRelated(currentSlug) {
  const others = pillars.filter((p) => p.slug !== currentSlug);
  const items = others.map((p) => `<li><a href="/public/seo/${p.file}">${p.navLabel}</a></li>`).join("\n          ");
  return `<nav class="related" aria-labelledby="related-heading">
        <h2 id="related-heading">נושאים קשורים</h2>
        <ul>
          ${items}
        </ul>
      </nav>`;
}

function buildJsonLd(page) {
  const url = `${BASE}/public/seo/${page.file}`;
  const graph = [
    {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "Lista CRM",
      url: `${BASE}/`,
      logo: `${BASE}/public/assets/favicon.ico`,
    },
    {
      "@type": "WebSite",
      "@id": `${BASE}/#website`,
      name: "Lista CRM",
      url: `${BASE}/`,
      publisher: { "@id": `${BASE}/#organization` },
      inLanguage: "he-IL",
    },
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
      inLanguage: "he-IL",
      isPartOf: { "@id": `${BASE}/#website` },
    },
  ];
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

function buildPage(page) {
  const jsonLd = buildJsonLd(page);
  return `<!DOCTYPE html>
<html lang="he-IL" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escHtml(page.title)}</title>
  <meta name="description" content="${escHtml(page.description)}">
  <link rel="canonical" href="${BASE}/public/seo/${page.file}">
  <meta property="og:title" content="${escHtml(page.title)}">
  <meta property="og:description" content="${escHtml(page.description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${BASE}/public/seo/${page.file}">
  <meta property="og:site_name" content="Lista CRM">
  <meta property="og:locale" content="he_IL">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="Lista CRM">
  <link rel="stylesheet" href="/public/assets/opensanshebrew.css">
  <link rel="stylesheet" href="/public/seo/assets/seo.css">
  <script type="application/ld+json">
${jsonLd}
  </script>
</head>
<body>
  <a class="skip-link" href="#main">דילוג לתוכן</a>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="https://lista-crm.com/">
        <img class="brand__logo" src="/public/assets/lista-crm-wordmark.svg" width="117" height="24" alt="Lista CRM" decoding="async" />
      </a>
      ${buildNav(page.slug)}
    </div>
  </header>
  <div class="hero">
    <div class="hero__inner">
      <h1>${page.h1}</h1>
      <p class="lead">${page.lead}</p>
      <div class="cta-row">
        <a class="btn btn--primary" href="/public/contact_us.html">שבועיים ניסיון — דברו איתנו</a>
        <a class="btn btn--ghost" href="/public/pricing.html">מחירון</a>
      </div>
    </div>
  </div>
  <main id="main">
    <article>
      ${page.body.trim()}
    </article>
    ${buildRelated(page.slug)}
  </main>
  <footer class="site-footer">
    <p>© Lista Smart Manager · <a href="https://lista-crm.com/">האתר הראשי</a> · <a href="/public/pricing.html">מחירון</a> · <a href="/public/contact_us.html">צור קשר</a></p>
    <p><a href="https://atzma.im/public/legal/privacy_policy.html" rel="noopener noreferrer">מדיניות פרטיות</a> · <a href="https://atzma.im/public/legal/terms_of_use.html" rel="noopener noreferrer">תנאי שימוש</a></p>
  </footer>
  <script src="/public/assets/query-param-propagation.js" defer></script>
</body>
</html>
`;
}

fs.mkdirSync(path.join(outDir, "assets"), { recursive: true });

for (const p of pillars) {
  const html = buildPage(p);
  fs.writeFileSync(path.join(outDir, p.file), html, "utf8");
  console.log("wrote", p.file);
}
