export type Task = {
  id: string;
  group: string;
  title: string;
  subtitle: string;
  prompt: string;
  bullets: string[];
  wordCount: string;
  isNew?: boolean;
  images?: string[];
  badge?: string;
};

export type WorkbookLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "business"
  | "just-for-fun"
  | "ielts-academic"
  | "ielts-general-training"
  | "b2-first";

export type Section = { slug: WorkbookLevel; label: string; newCount: number };

export const workbooks: Section[] = [
  { slug: "beginner", label: "Beginner", newCount: 10 },
  { slug: "intermediate", label: "Intermediate", newCount: 26 },
  { slug: "advanced", label: "Advanced", newCount: 12 },
  { slug: "business", label: "Business", newCount: 0 },
  { slug: "just-for-fun", label: "Just for Fun", newCount: 0 },
];

export const testZone: Section[] = [
  { slug: "ielts-academic", label: "IELTS Academic", newCount: 20 },
  { slug: "ielts-general-training", label: "IELTS General Training", newCount: 20 },
  { slug: "b2-first", label: "B2 First", newCount: 20 },
];

export const allSections: Section[] = [...workbooks, ...testZone];

export type TaskLanguage = "en" | "de" | "fr";

const sectionLabelsByLanguage: Record<TaskLanguage, Record<WorkbookLevel, string>> = {
  en: {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    business: "Business",
    "just-for-fun": "Just for Fun",
    "ielts-academic": "IELTS Academic",
    "ielts-general-training": "IELTS General Training",
    "b2-first": "B2 First",
  },
  de: {
    beginner: "Deutsch A1–A2",
    intermediate: "Deutsch B1",
    advanced: "Deutsch B2–C1",
    business: "Business-Deutsch",
    "just-for-fun": "Deutsch kreativ",
    "ielts-academic": "TestDaF",
    "ielts-general-training": "Goethe-Zertifikat",
    "b2-first": "telc Deutsch B2",
  },
  fr: {
    beginner: "Français A1–A2",
    intermediate: "Français B1",
    advanced: "Français B2–C1",
    business: "Français professionnel",
    "just-for-fun": "Français créatif",
    "ielts-academic": "DELF B2",
    "ielts-general-training": "DELF B1",
    "b2-first": "DALF C1",
  },
};

type LocalizedTaskTemplate = {
  title: string;
  subtitle: string;
  prompt: string;
  bullets: string[];
  badge?: string;
};

type LocalizedTaskType =
  | "email"
  | "story"
  | "article"
  | "formalLetter"
  | "essay"
  | "review"
  | "report"
  | "chart"
  | "process"
  | "proposal"
  | "coverLetter"
  | "description"
  | "opinion"
  | "letter";

function hashTaskId(id: string): number {
  return [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function pickTemplate(templates: LocalizedTaskTemplate[], taskId: string): LocalizedTaskTemplate {
  return templates[hashTaskId(taskId) % templates.length];
}

function localizedTaskType(task: Task): LocalizedTaskType {
  const haystack = `${task.group} ${task.title} ${task.badge ?? ""}`.toLowerCase();

  if (haystack.includes("process")) return "process";
  if (haystack.includes("chart") || haystack.includes("graph") || haystack.includes("table")) {
    return "chart";
  }
  if (haystack.includes("proposal")) return "proposal";
  if (haystack.includes("cover letter")) return "coverLetter";
  if (haystack.includes("formal letter") || haystack.includes("complaint")) return "formalLetter";
  if (haystack.includes("report")) return "report";
  if (haystack.includes("review")) return "review";
  if (haystack.includes("essay")) return "essay";
  if (haystack.includes("article")) return "article";
  if (haystack.includes("story")) return "story";
  if (haystack.includes("description")) return "description";
  if (haystack.includes("opinion")) return "opinion";
  if (haystack.includes("letter")) return "letter";
  return "email";
}

const localizedGroups: Record<TaskLanguage, Record<LocalizedTaskType, string>> = {
  en: {
    email: "Emails",
    story: "Stories",
    article: "Articles",
    formalLetter: "Formal letters",
    essay: "Essays",
    review: "Reviews",
    report: "Reports",
    chart: "Task 1",
    process: "Task 1",
    proposal: "Proposals",
    coverLetter: "Cover Letters",
    description: "Descriptions",
    opinion: "Opinions",
    letter: "Letters",
  },
  de: {
    email: "E-Mails",
    story: "Geschichten",
    article: "Artikel",
    formalLetter: "Formelle Briefe",
    essay: "Erörterungen",
    review: "Rezensionen",
    report: "Berichte",
    chart: "Grafikbeschreibung",
    process: "Prozessbeschreibung",
    proposal: "Vorschläge",
    coverLetter: "Bewerbungen",
    description: "Beschreibungen",
    opinion: "Meinungstexte",
    letter: "Briefe",
  },
  fr: {
    email: "E-mails",
    story: "Récits",
    article: "Articles",
    formalLetter: "Lettres formelles",
    essay: "Essais argumentés",
    review: "Critiques",
    report: "Rapports",
    chart: "Analyse de document",
    process: "Description de processus",
    proposal: "Propositions",
    coverLetter: "Candidatures",
    description: "Descriptions",
    opinion: "Textes d’opinion",
    letter: "Lettres",
  },
};

const wordCountsByLanguage: Record<TaskLanguage, Record<WorkbookLevel, string>> = {
  en: {
    beginner: "Write your answer in 25 words or more.",
    intermediate: "Write 80–120 words.",
    advanced: "Write 140–190 words.",
    business: "Write 120–180 words.",
    "just-for-fun": "Write 100–180 words.",
    "ielts-academic": "Write at least 150 words for Task 1 or 250 words for Task 2.",
    "ielts-general-training": "Write at least 150 words for Task 1 or 250 words for Task 2.",
    "b2-first": "Write 140–190 words.",
  },
  de: {
    beginner: "Schreibe mindestens 30 Wörter.",
    intermediate: "Schreibe 80–120 Wörter.",
    advanced: "Schreibe 140–190 Wörter.",
    business: "Schreibe 120–180 Wörter.",
    "just-for-fun": "Schreibe 100–180 Wörter.",
    "ielts-academic": "Schreibe 170–220 Wörter im Stil einer TestDaF-Aufgabe.",
    "ielts-general-training": "Schreibe 160–220 Wörter im Stil einer Goethe-Prüfungsaufgabe.",
    "b2-first": "Schreibe 150–200 Wörter im Stil von telc Deutsch B2.",
  },
  fr: {
    beginner: "Écris au moins 30 mots.",
    intermediate: "Écris 80–120 mots.",
    advanced: "Écris 140–190 mots.",
    business: "Écris 120–180 mots.",
    "just-for-fun": "Écris 100–180 mots.",
    "ielts-academic": "Écris 170–220 mots dans un format proche du DELF B2.",
    "ielts-general-training": "Écris 160–220 mots dans un format proche du DELF B1.",
    "b2-first": "Écris 220–280 mots dans un format proche du DALF C1.",
  },
};

const localizedTemplates: Record<
  Exclude<TaskLanguage, "en">,
  Record<LocalizedTaskType, LocalizedTaskTemplate[]>
> = {
  de: {
    email: [
      {
        title: "Eine E-Mail über ein Geschenk",
        subtitle: "Du hast ein Geschenk gekauft und schreibst einer Freundin.",
        prompt:
          "Du hast gestern ein Geschenk gekauft. Schreibe eine E-Mail an deine Freundin Lena.",
        bullets: [
          "Schreibe, für wen das Geschenk ist",
          "Beschreibe das Geschenk",
          "Erkläre, warum du es ausgewählt hast",
        ],
      },
      {
        title: "Eine E-Mail über einen neuen Kurs",
        subtitle: "Du nimmst seit Kurzem an einem Kurs teil.",
        prompt:
          "Du besuchst seit einem Monat einen neuen Kurs. Schreibe eine E-Mail an deinen Freund Noah.",
        bullets: [
          "Beschreibe den Kurs",
          "Erkläre, warum du mitmachst",
          "Schlage vor, dass Noah auch kommt",
        ],
      },
      {
        title: "Eine Einladung per E-Mail",
        subtitle: "Du möchtest jemanden zu einer Veranstaltung einladen.",
        prompt:
          "Du hast eine zusätzliche Eintrittskarte für eine Veranstaltung am Wochenende. Schreibe eine E-Mail an deine Freundin Mia.",
        bullets: [
          "Lade Mia ein",
          "Beschreibe die Veranstaltung",
          "Schlage einen Treffpunkt und eine Uhrzeit vor",
        ],
      },
    ],
    story: [
      {
        title: "Eine Geschichte über eine Überraschung",
        subtitle: "Erzähle, was an einem ungewöhnlichen Tag passiert ist.",
        prompt:
          "Schreibe eine kurze Geschichte über einen Tag, der ganz normal begann und mit einer Überraschung endete.",
        bullets: [
          "Beschreibe den Anfang",
          "Erkläre, was plötzlich anders war",
          "Schreibe ein klares Ende",
        ],
      },
      {
        title: "Eine Geschichte über eine falsche Tür",
        subtitle: "Jemand betritt einen Ort, an dem er nicht sein sollte.",
        prompt:
          "Schreibe eine kurze Geschichte, in der eine Person eine Tür öffnet und merkt, dass sie am falschen Ort ist.",
        bullets: [
          "Beschreibe den Ort",
          "Zeige die Reaktion der Person",
          "Erkläre, wie die Situation ausgeht",
        ],
      },
    ],
    article: [
      {
        title: "Ein Artikel über Freizeit",
        subtitle: "Schreibe für eine Schüler- oder Kurswebseite.",
        prompt:
          "Schreibe einen Artikel darüber, wie Jugendliche ihre Freizeit sinnvoll verbringen können.",
        bullets: [
          "Nenne zwei Beispiele",
          "Erkläre Vor- und Nachteile",
          "Gib den Leserinnen und Lesern einen Tipp",
        ],
      },
      {
        title: "Ein Artikel über Lernen",
        subtitle: "Gib praktische Ratschläge für andere Lernende.",
        prompt: "Schreibe einen Artikel mit Tipps, wie man eine Fremdsprache im Alltag üben kann.",
        bullets: [
          "Beschreibe zwei Lernmethoden",
          "Erkläre, warum sie helfen",
          "Schließe mit einer Empfehlung",
        ],
      },
    ],
    formalLetter: [
      {
        title: "Ein formeller Beschwerdebrief",
        subtitle: "Reagiere höflich auf ein Problem mit einem Service.",
        prompt:
          "Du hast an einem Kurs teilgenommen, aber mehrere Leistungen entsprachen nicht der Beschreibung. Schreibe einen formellen Beschwerdebrief.",
        bullets: [
          "Beschreibe das Problem sachlich",
          "Erkläre, welche Folgen es hatte",
          "Fordere eine passende Lösung",
        ],
      },
      {
        title: "Ein formeller Antrag",
        subtitle: "Bitte um Informationen oder eine Ausnahme.",
        prompt:
          "Du möchtest an einem Programm teilnehmen und brauchst zusätzliche Informationen. Schreibe einen formellen Brief an die Organisation.",
        bullets: [
          "Stelle dich kurz vor",
          "Erkläre dein Anliegen",
          "Bitte um eine konkrete Antwort",
        ],
      },
    ],
    essay: [
      {
        title: "Eine Erörterung über Online-Lernen",
        subtitle: "Diskutiere Vor- und Nachteile mit Beispielen.",
        prompt:
          "Viele Menschen lernen heute online statt in einem Klassenzimmer. Schreibe eine Erörterung zu diesem Thema.",
        bullets: ["Nenne Vorteile", "Nenne Nachteile", "Begründe deine eigene Meinung"],
      },
      {
        title: "Eine Erörterung über Stadtleben",
        subtitle: "Vergleiche verschiedene Lebensweisen.",
        prompt:
          "Manche Menschen möchten in einer Großstadt leben, andere lieber in einer kleineren Gemeinde. Schreibe eine begründete Erörterung.",
        bullets: ["Vergleiche beide Möglichkeiten", "Gib Beispiele", "Formuliere ein klares Fazit"],
      },
    ],
    review: [
      {
        title: "Eine Rezension über ein Café",
        subtitle: "Bewerte einen Ort für andere Besucher.",
        prompt: "Schreibe eine Rezension über ein Café, das du kürzlich besucht hast.",
        bullets: [
          "Beschreibe Atmosphäre und Angebot",
          "Bewerte den Service",
          "Erkläre, wem du den Ort empfehlen würdest",
        ],
      },
      {
        title: "Eine Rezension über eine App",
        subtitle: "Beurteile eine App aus deiner Erfahrung.",
        prompt:
          "Schreibe eine Rezension über eine App, die dir beim Lernen oder Organisieren hilft.",
        bullets: [
          "Beschreibe die wichtigsten Funktionen",
          "Nenne einen Vorteil und einen Nachteil",
          "Gib eine Empfehlung",
        ],
      },
    ],
    report: [
      {
        title: "Ein Bericht über eine Veranstaltung",
        subtitle: "Fasse Ergebnisse für eine Gruppe zusammen.",
        prompt:
          "Dein Kurs hat eine Veranstaltung organisiert. Schreibe einen Bericht für die Kursleitung.",
        bullets: [
          "Beschreibe Ziel und Ablauf",
          "Bewerte, was gut funktioniert hat",
          "Schlage Verbesserungen vor",
        ],
      },
      {
        title: "Ein Bericht über Arbeitsbedingungen",
        subtitle: "Analysiere eine Situation und mache Vorschläge.",
        prompt:
          "In deiner Firma wurde eine Umfrage zur Zufriedenheit am Arbeitsplatz durchgeführt. Schreibe einen Bericht für das Management.",
        bullets: [
          "Fasse wichtige Ergebnisse zusammen",
          "Erkläre mögliche Ursachen",
          "Empfiehl konkrete Maßnahmen",
        ],
      },
    ],
    chart: [
      {
        title: "Eine Grafikbeschreibung zum Medienkonsum",
        subtitle: "Beschreibe Daten sachlich und strukturiert.",
        prompt:
          "Beschreibe eine Grafik zum Medienkonsum verschiedener Altersgruppen in Deutschland.",
        bullets: [
          "Nenne die wichtigsten Tendenzen",
          "Vergleiche zwei Gruppen",
          "Ziehe ein kurzes Fazit",
        ],
      },
      {
        title: "Eine Grafikbeschreibung zur Mobilität",
        subtitle: "Analysiere Veränderungen über mehrere Jahre.",
        prompt:
          "Beschreibe eine Grafik zur Nutzung von Fahrrad, Auto und öffentlichen Verkehrsmitteln.",
        bullets: [
          "Beschreibe die auffälligsten Werte",
          "Erkläre mögliche Gründe",
          "Vergleiche die Entwicklungen",
        ],
      },
    ],
    process: [
      {
        title: "Eine Prozessbeschreibung zum Recycling",
        subtitle: "Erkläre einen Ablauf Schritt für Schritt.",
        prompt:
          "Beschreibe einen Prozess, bei dem Papier gesammelt, sortiert und wiederverwertet wird.",
        bullets: [
          "Nenne die einzelnen Schritte",
          "Verwende passende Reihenfolge-Wörter",
          "Fasse das Ergebnis zusammen",
        ],
      },
    ],
    proposal: [
      {
        title: "Ein Vorschlag für bessere Teamarbeit",
        subtitle: "Mache konkrete Empfehlungen für ein Unternehmen.",
        prompt:
          "Dein Unternehmen möchte die Zusammenarbeit im Team verbessern. Schreibe einen Vorschlag für die Geschäftsleitung.",
        bullets: [
          "Beschreibe die aktuelle Situation",
          "Schlage zwei Maßnahmen vor",
          "Erkläre den erwarteten Nutzen",
        ],
      },
    ],
    coverLetter: [
      {
        title: "Eine Bewerbung für ein Praktikum",
        subtitle: "Bewirb dich überzeugend und professionell.",
        prompt:
          "Du bewirbst dich für ein Praktikum in einem internationalen Unternehmen. Schreibe ein Bewerbungsschreiben.",
        bullets: [
          "Erkläre, warum dich die Stelle interessiert",
          "Beschreibe passende Erfahrungen",
          "Bitte um ein Vorstellungsgespräch",
        ],
      },
    ],
    description: [
      {
        title: "Eine Beschreibung einer besonderen Person",
        subtitle: "Beschreibe Wirkung, Charakter und Bedeutung.",
        prompt: "Beschreibe eine Person, die dich beeindruckt oder beeinflusst hat.",
        bullets: [
          "Beschreibe die Person",
          "Erkläre, was du von ihr gelernt hast",
          "Zeige, warum sie dir wichtig ist",
        ],
      },
    ],
    opinion: [
      {
        title: "Ein Meinungstext über Traditionen",
        subtitle: "Begründe deine Meinung mit Beispielen.",
        prompt:
          "Sollte man alte Traditionen bewahren oder sich stärker auf Neues konzentrieren? Schreibe deine Meinung.",
        bullets: [
          "Nenne deine Position",
          "Gib Gründe und Beispiele",
          "Gehe kurz auf eine Gegenmeinung ein",
        ],
      },
    ],
    letter: [
      {
        title: "Ein persönlicher Brief des Dankes",
        subtitle: "Schreibe an jemanden, dem du lange danken wolltest.",
        prompt:
          "Schreibe einen persönlichen Brief an eine Person, die dir geholfen hat und der du nie richtig gedankt hast.",
        bullets: [
          "Erinnere an die Situation",
          "Erkläre, warum die Hilfe wichtig war",
          "Drücke deinen Dank aus",
        ],
      },
    ],
  },
  fr: {
    email: [
      {
        title: "Un e-mail au sujet d’un cadeau",
        subtitle: "Tu as acheté un cadeau et tu écris à une amie.",
        prompt: "Hier, tu as acheté un cadeau. Écris un e-mail à ton amie Camille.",
        bullets: [
          "Dis pour qui tu as acheté le cadeau",
          "Décris le cadeau",
          "Explique pourquoi tu l’as choisi",
        ],
      },
      {
        title: "Un e-mail au sujet d’une nouvelle activité",
        subtitle: "Tu participes depuis peu à une activité.",
        prompt:
          "Depuis un mois, tu participes à une nouvelle activité. Écris un e-mail à ton ami Lucas.",
        bullets: [
          "Présente l’activité",
          "Explique pourquoi tu t’es inscrit",
          "Propose à Lucas de venir essayer",
        ],
      },
      {
        title: "Une invitation par e-mail",
        subtitle: "Tu veux inviter quelqu’un à une sortie.",
        prompt:
          "Tu as une place en plus pour une sortie ce week-end. Écris un e-mail à ton amie Inès.",
        bullets: ["Invite Inès", "Décris la sortie", "Propose une heure et un lieu de rendez-vous"],
      },
    ],
    story: [
      {
        title: "Un récit avec une surprise",
        subtitle: "Raconte une journée qui change brusquement.",
        prompt:
          "Écris un court récit sur une journée qui commence normalement et se termine par une surprise.",
        bullets: [
          "Présente la situation au début",
          "Explique ce qui change soudainement",
          "Donne une fin claire",
        ],
      },
      {
        title: "Un récit sur une mauvaise porte",
        subtitle: "Quelqu’un entre dans un lieu inattendu.",
        prompt:
          "Écris un court récit dans lequel une personne ouvre une porte et comprend qu’elle n’est pas au bon endroit.",
        bullets: [
          "Décris le lieu",
          "Montre la réaction du personnage",
          "Explique comment la situation se termine",
        ],
      },
    ],
    article: [
      {
        title: "Un article sur les loisirs",
        subtitle: "Écris pour le site d’un lycée ou d’un cours.",
        prompt: "Écris un article sur les façons utiles de passer son temps libre.",
        bullets: [
          "Donne deux exemples",
          "Explique les avantages et les limites",
          "Termine par un conseil aux lecteurs",
        ],
      },
      {
        title: "Un article sur l’apprentissage",
        subtitle: "Donne des conseils pratiques à d’autres apprenants.",
        prompt:
          "Écris un article avec des conseils pour pratiquer une langue étrangère au quotidien.",
        bullets: [
          "Présente deux méthodes",
          "Explique pourquoi elles sont efficaces",
          "Termine par une recommandation",
        ],
      },
    ],
    formalLetter: [
      {
        title: "Une lettre formelle de réclamation",
        subtitle: "Réagis poliment à un problème de service.",
        prompt:
          "Tu as suivi un cours, mais plusieurs services ne correspondaient pas à la description. Écris une lettre formelle de réclamation.",
        bullets: [
          "Décris le problème précisément",
          "Explique les conséquences",
          "Demande une solution concrète",
        ],
      },
      {
        title: "Une lettre formelle de demande",
        subtitle: "Demande des informations ou une exception.",
        prompt:
          "Tu veux participer à un programme et tu as besoin d’informations supplémentaires. Écris une lettre formelle à l’organisation.",
        bullets: ["Présente-toi brièvement", "Explique ta demande", "Demande une réponse précise"],
      },
    ],
    essay: [
      {
        title: "Un essai sur l’apprentissage en ligne",
        subtitle: "Discute les avantages et les limites avec des exemples.",
        prompt:
          "Aujourd’hui, beaucoup de personnes apprennent en ligne plutôt qu’en classe. Rédige un essai argumenté sur ce sujet.",
        bullets: [
          "Présente les avantages",
          "Présente les inconvénients",
          "Donne ton opinion personnelle",
        ],
      },
      {
        title: "Un essai sur la vie en ville",
        subtitle: "Compare plusieurs modes de vie.",
        prompt:
          "Certaines personnes préfèrent vivre dans une grande ville, d’autres dans une commune plus petite. Rédige un essai argumenté.",
        bullets: [
          "Compare les deux possibilités",
          "Donne des exemples",
          "Formule une conclusion claire",
        ],
      },
    ],
    review: [
      {
        title: "Une critique d’un café",
        subtitle: "Évalue un lieu pour de futurs clients.",
        prompt: "Écris une critique d’un café que tu as visité récemment.",
        bullets: [
          "Décris l’ambiance et l’offre",
          "Évalue le service",
          "Explique à qui tu recommanderais ce lieu",
        ],
      },
      {
        title: "Une critique d’une application",
        subtitle: "Donne ton avis à partir de ton expérience.",
        prompt: "Écris une critique d’une application qui t’aide à apprendre ou à t’organiser.",
        bullets: [
          "Décris les fonctions principales",
          "Donne un avantage et un inconvénient",
          "Formule une recommandation",
        ],
      },
    ],
    report: [
      {
        title: "Un rapport sur un événement",
        subtitle: "Résume les résultats pour un groupe.",
        prompt: "Ton cours a organisé un événement. Rédige un rapport pour la direction du cours.",
        bullets: [
          "Décris l’objectif et le déroulement",
          "Évalue ce qui a bien fonctionné",
          "Propose des améliorations",
        ],
      },
      {
        title: "Un rapport sur les conditions de travail",
        subtitle: "Analyse une situation et propose des mesures.",
        prompt:
          "Dans ton entreprise, une enquête a été menée sur la satisfaction au travail. Rédige un rapport pour la direction.",
        bullets: [
          "Résume les résultats importants",
          "Explique les causes possibles",
          "Recommande des mesures concrètes",
        ],
      },
    ],
    chart: [
      {
        title: "Une analyse de graphique sur les médias",
        subtitle: "Décris des données de manière structurée.",
        prompt:
          "Analyse un graphique sur l’utilisation des médias selon les groupes d’âge en France.",
        bullets: [
          "Présente les tendances principales",
          "Compare deux groupes",
          "Ajoute une courte conclusion",
        ],
      },
      {
        title: "Une analyse de graphique sur les transports",
        subtitle: "Analyse des évolutions sur plusieurs années.",
        prompt:
          "Analyse un graphique sur l’utilisation du vélo, de la voiture et des transports publics.",
        bullets: [
          "Décris les chiffres les plus importants",
          "Explique des raisons possibles",
          "Compare les évolutions",
        ],
      },
    ],
    process: [
      {
        title: "Une description de processus sur le recyclage",
        subtitle: "Explique un déroulement étape par étape.",
        prompt: "Décris un processus dans lequel le papier est collecté, trié puis recyclé.",
        bullets: [
          "Présente les étapes dans l’ordre",
          "Utilise des connecteurs chronologiques",
          "Résume le résultat final",
        ],
      },
    ],
    proposal: [
      {
        title: "Une proposition pour améliorer le travail d’équipe",
        subtitle: "Fais des recommandations concrètes à une entreprise.",
        prompt:
          "Ton entreprise veut améliorer la collaboration dans les équipes. Rédige une proposition pour la direction.",
        bullets: [
          "Décris la situation actuelle",
          "Propose deux mesures",
          "Explique les bénéfices attendus",
        ],
      },
    ],
    coverLetter: [
      {
        title: "Une lettre de motivation pour un stage",
        subtitle: "Présente ta candidature de manière professionnelle.",
        prompt:
          "Tu poses ta candidature pour un stage dans une entreprise internationale. Rédige une lettre de motivation.",
        bullets: [
          "Explique pourquoi le poste t’intéresse",
          "Présente des expériences pertinentes",
          "Demande un entretien",
        ],
      },
    ],
    description: [
      {
        title: "La description d’une personne importante",
        subtitle: "Décris son caractère, son influence et son importance.",
        prompt: "Décris une personne qui t’a impressionné ou influencé.",
        bullets: [
          "Présente cette personne",
          "Explique ce que tu as appris d’elle",
          "Montre pourquoi elle compte pour toi",
        ],
      },
    ],
    opinion: [
      {
        title: "Un texte d’opinion sur les traditions",
        subtitle: "Défends ton avis avec des exemples.",
        prompt:
          "Faut-il préserver les anciennes traditions ou se concentrer davantage sur la nouveauté ? Rédige ton opinion.",
        bullets: [
          "Présente ta position",
          "Donne des raisons et des exemples",
          "Réponds brièvement à un avis contraire",
        ],
      },
    ],
    letter: [
      {
        title: "Une lettre personnelle de remerciement",
        subtitle: "Écris à quelqu’un que tu voulais remercier depuis longtemps.",
        prompt:
          "Écris une lettre personnelle à une personne qui t’a aidé et que tu n’as jamais vraiment remerciée.",
        bullets: [
          "Rappelle la situation",
          "Explique pourquoi cette aide était importante",
          "Exprime ta gratitude",
        ],
      },
    ],
  },
};

function adaptTask(task: Task, level: WorkbookLevel, lang: TaskLanguage): Task {
  if (lang === "en") return task;

  const type = localizedTaskType(task);
  const section = sectionLabelsByLanguage[lang][level];
  const template = pickTemplate(localizedTemplates[lang][type], task.id);
  const group = localizedGroups[lang][type];

  return {
    ...task,
    group,
    title: `${section}: ${template.title}`,
    subtitle: template.subtitle,
    prompt: template.prompt,
    bullets: template.bullets,
    wordCount: wordCountsByLanguage[lang][level],
    badge: template.badge ?? group,
  };
}

const beginner: Task[] = [
  {
    id: "b-email-present",
    group: "Emails",
    title: "An email: Buying a present",
    subtitle: "You went shopping yesterday to buy a present.",
    prompt:
      "You went shopping yesterday to buy a present. Write an email to your English friend Blake.",
    bullets: [
      "Tell Blake who you bought the present for",
      "Describe the present",
      "Explain why you chose it",
    ],
    wordCount: "Write your email in 25 words or more.",
    isNew: true,
  },
  {
    id: "b-email-club",
    group: "Emails",
    title: "An email: A new club",
    subtitle: "You joined a new club last month.",
    prompt: "You joined a new club last month. Write an email to your English friend Lucy.",
    bullets: ["Tell Lucy about the club", "Explain why you joined", "Describe what you do there"],
    wordCount: "Write your email in 25 words or more.",
    isNew: true,
  },
  {
    id: "b-email-art",
    group: "Emails",
    title: "An email: An art exhibition",
    subtitle: "You have got an extra ticket for an art exhibition this weekend.",
    prompt:
      "You have got an extra ticket for an art exhibition this weekend. Write an email to your English friend Sam.",
    bullets: [
      "Invite Sam to come with you",
      "Explain what the exhibition is about",
      "Suggest a time to meet",
    ],
    wordCount: "Write your email in 25 words or more.",
    isNew: true,
  },
  {
    id: "b-email-birthday",
    group: "Emails",
    title: "An email: A birthday party",
    subtitle: "You are planning a birthday party for a friend.",
    prompt:
      "You are planning a birthday party for a friend. Write an email to your English friend Chris.",
    bullets: [
      "Describe the party plans",
      "Say where and when it will be",
      "Ask Chris to help with something",
    ],
    wordCount: "Write your email in 25 words or more.",
    isNew: true,
  },
  {
    id: "b-email-place",
    group: "Emails",
    title: "An email: A favourite place",
    subtitle: "You have a favourite place you like to visit near your home.",
    prompt:
      "You have a favourite place you like to visit near your home. Write an email to your English friend Jordan.",
    bullets: ["Describe the place", "Explain why you like it", "Suggest Jordan visits it"],
    wordCount: "Write your email in 25 words or more.",
    isNew: true,
  },
  {
    id: "b-story-weather",
    group: "Stories",
    title: "A story: Bad weather",
    subtitle: "Look at the three pictures.",
    prompt:
      "Look at the three pictures. They show a story about a day when the weather turned bad. Write the story shown in the pictures.",
    bullets: [],
    wordCount: "Write 35 words or more.",
    isNew: true,
  },
  {
    id: "b-story-cake",
    group: "Stories",
    title: "A story: A cake",
    subtitle: "Look at the three pictures.",
    prompt:
      "Look at the three pictures. They show a story about baking a cake. Write the story shown in the pictures.",
    bullets: [],
    wordCount: "Write 35 words or more.",
    isNew: true,
  },
  {
    id: "b-story-dog",
    group: "Stories",
    title: "A story: A lost dog",
    subtitle: "Look at the three pictures.",
    prompt:
      "Look at the three pictures. They show a story about finding a lost dog in the park. Write the story shown in the pictures.",
    bullets: [],
    wordCount: "Write 35 words or more.",
    isNew: true,
  },
  {
    id: "b-story-gift",
    group: "Stories",
    title: "A story: A surprise gift",
    subtitle: "Look at the three pictures.",
    prompt:
      "Look at the three pictures. They show a story about receiving an unexpected gift. Write the story shown in the pictures.",
    bullets: [],
    wordCount: "Write 35 words or more.",
    isNew: true,
  },
  {
    id: "b-story-bus",
    group: "Stories",
    title: "A story: A missed bus",
    subtitle: "Look at the three pictures.",
    prompt:
      "Look at the three pictures. They show a story about missing the last bus home. Write the story shown in the pictures.",
    bullets: [],
    wordCount: "Write 35 words or more.",
    isNew: true,
  },
];

const intermediate: Task[] = [
  {
    id: "i-email-complaint",
    group: "Emails",
    title: "An email: A complaint about a hotel",
    subtitle: "You recently stayed at a hotel and were not happy with the service.",
    prompt:
      "You recently stayed at a hotel and were not happy with the service. Write an email to the hotel manager.",
    bullets: [
      "Explain when you stayed",
      "Describe the problems",
      "Say what you would like them to do",
    ],
    wordCount: "Write your email in about 100 words.",
    isNew: true,
  },
  {
    id: "i-article-hometown",
    group: "Articles",
    title: "An article: Your hometown",
    subtitle: "Write an article about your hometown for a travel magazine.",
    prompt: "A travel magazine has asked readers to write an article about their hometown.",
    bullets: [
      "Describe your hometown",
      "Explain what makes it special",
      "Recommend things to do there",
    ],
    wordCount: "Write your article in about 100 words.",
    isNew: true,
  },
  {
    id: "i-story-opening",
    group: "Stories",
    title: "A story: An unexpected phone call",
    subtitle: "Your story must begin with this sentence:",
    prompt:
      'Your story must begin with this sentence: "As soon as Maria picked up the phone, she knew something was wrong."',
    bullets: [],
    wordCount: "Write your story in about 100 words.",
    isNew: true,
  },
  {
    id: "i-email-invite",
    group: "Emails",
    title: "An email: Inviting a friend abroad",
    subtitle: "Invite a friend who lives abroad to visit you.",
    prompt: "Write an email to a friend who lives in another country inviting them to visit you.",
    bullets: [
      "Suggest when they should come",
      "Explain what you can do together",
      "Tell them what to bring",
    ],
    wordCount: "Write your email in about 100 words.",
  },
];

const advanced: Task[] = [
  {
    id: "a-letter-formal",
    group: "Formal letters",
    title: "A formal letter: Applying for a scholarship",
    subtitle: "Write a formal letter to a university scholarship committee.",
    prompt:
      "You have seen an advertisement for a scholarship to study abroad. Write a formal letter to the scholarship committee applying for it.",
    bullets: [
      "Describe your background and achievements",
      "Explain why you deserve the scholarship",
      "Outline how you will use the opportunity",
    ],
    wordCount: "Write your letter in 180–220 words.",
    isNew: true,
  },
  {
    id: "a-essay-tech",
    group: "Essays",
    title: "An essay: Technology and society",
    subtitle: "Some people believe technology isolates us. Discuss.",
    prompt:
      "Some people believe modern technology is making us less social, while others argue it brings us closer together. Discuss both views and give your opinion.",
    bullets: ["Present both perspectives", "Provide examples", "State your own opinion clearly"],
    wordCount: "Write your essay in 180–220 words.",
    isNew: true,
  },
  {
    id: "a-review-restaurant",
    group: "Reviews",
    title: "A review: A new restaurant",
    subtitle: "Write a review of a restaurant you visited recently.",
    prompt:
      "An online magazine is collecting reviews of new restaurants. Write a review of a restaurant you have visited recently.",
    bullets: [
      "Describe the atmosphere and food",
      "Comment on the service and value",
      "Say whether you would recommend it",
    ],
    wordCount: "Write your review in 180–220 words.",
    isNew: true,
  },
  {
    id: "a-report-survey",
    group: "Reports",
    title: "A report: Student survey results",
    subtitle: "Summarise the results of a recent student survey.",
    prompt:
      "Your college conducted a survey about facilities. Write a report for the principal summarising the results and making recommendations.",
    bullets: [
      "Outline the survey findings",
      "Identify the main issues raised",
      "Suggest improvements",
    ],
    wordCount: "Write your report in 180–220 words.",
  },
];

const ieltsAcademic: Task[] = [
  {
    id: "ia-driving-test",
    group: "Task 1",
    title: "Driving test pass rates",
    subtitle: "The chart shows pass rates for women and men in an Asian country, 1980–2010.",
    prompt:
      "The chart below shows the percentage of women and men in one Asian country who passed their driving test between 1980 and 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Chart",
    isNew: true,
  },
  {
    id: "ia-further-education",
    group: "Task 1",
    title: "Men and women in further education",
    subtitle: "Number of men and women in further education in Britain across three periods.",
    prompt:
      "The chart below shows the number of men and women in further education in Britain in three periods and whether they were studying full-time or part-time. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Chart",
    isNew: true,
  },
  {
    id: "ia-school-travel",
    group: "Task 1",
    title: "How children travelled to school",
    subtitle: "Modes of transport used by children to and from school in 1990 and 2010.",
    prompt:
      "The chart below gives information about how children travelled to and from school in 1990 and 2010. The modes of transport shown are: car, walking, cycling, bus and walk, and bus only. Summarise the information, selecting and reporting the main features, and make comparisons where relevant.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Chart",
    isNew: true,
  },
  {
    id: "ia-pineapple",
    group: "Task 1",
    title: "Pineapple exports",
    subtitle: "World pineapple exports and a breakdown of consumer cost.",
    prompt:
      "The charts below show world pineapple exports by the top three pineapple-producing countries in 2009 and 2019, and a breakdown of the cost to the consumer of each pineapple sold in a typical western supermarket. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Chart",
    isNew: true,
  },
  {
    id: "ia-brick-process",
    group: "Task 1",
    title: "Brick manufacturing process",
    subtitle: "The process by which bricks are manufactured for the building industry.",
    prompt:
      "The diagram below shows the process by which bricks are manufactured for the building industry. Summarise the information by selecting and reporting the main features.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Process Diagram",
    isNew: true,
  },
  {
    id: "ia-radio-tv",
    group: "Task 1",
    title: "Radio and television audiences",
    subtitle: "Radio and television audiences throughout the day in 1992.",
    prompt:
      "The graph below shows radio and television audiences throughout the day in 1992. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Line Graph",
    isNew: true,
  },
  {
    id: "ia-london-sydney",
    group: "Task 1",
    title: "Temperatures and daylight in London and Sydney",
    subtitle: "Average temperatures and hours of daylight in both cities.",
    prompt:
      "The tables below give information about the average temperatures and hours of daylight in London and Sydney during the same months of the year. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Table",
    isNew: true,
  },
  {
    id: "ia-phones-school",
    group: "Task 1",
    title: "Using phones in school",
    subtitle: "Why teenagers in one African country used their phones, 2016–2019.",
    prompt:
      "The chart below shows the results of surveys in one African country asking teenagers the main reasons for using their phones between 2016 and 2019. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Bar Chart",
    isNew: true,
  },
  {
    id: "ia-water",
    group: "Task 1",
    title: "Water usage worldwide",
    subtitle: "Percentage of water used for different purposes in six areas of the world.",
    prompt:
      "The pie charts below show the percentage of water used for different purposes in six areas of the world. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Pie Chart",
    isNew: true,
  },
  {
    id: "ia-recycling",
    group: "Task 1",
    title: "Recycling rates in five countries",
    subtitle: "Percentage of waste recycled in five European countries, 2000–2020.",
    prompt:
      "The bar chart below shows the percentage of waste recycled in five European countries between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Bar Chart",
    isNew: true,
  },
  {
    id: "ia-children-money",
    group: "Task 2",
    title: "Children and money",
    subtitle: "Are children from less wealthy families better prepared for adult life?",
    prompt:
      "Some people think that children who are brought up in families that do not have large amounts of money are better prepared to deal with the problems of adult life than children brought up by wealthy parents. To what extent do you agree or disagree?",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ia-tourism",
    group: "Task 2",
    title: "International tourism",
    subtitle: "Do the disadvantages of international tourism outweigh the advantages?",
    prompt:
      "International tourism has brought enormous benefits to many places. At the same time, there is concern about its impact on local inhabitants and the environment. Do the disadvantages of international tourism outweigh the advantages? Give reasons for your answer and include any relevant examples from your own knowledge or experience.",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ia-tech-exercise",
    group: "Task 2",
    title: "Technology and exercise",
    subtitle: "Is technology making us less active, or can it encourage exercise?",
    prompt:
      "Some people believe that advances in technology are making people less active and that this will have negative effects on health in the future. Others argue that technology can actually encourage people to exercise more. Discuss both views and give your own opinion.",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ia-homeschooling",
    group: "Task 2",
    title: "Homeschooling",
    subtitle: "Do the advantages of homeschooling outweigh the disadvantages?",
    prompt:
      "Some parents choose to educate their children at home rather than sending them to school. Do you think the advantages of homeschooling outweigh the disadvantages? Give reasons for your answer and include any relevant examples from your own knowledge or experience.",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ia-green-spaces",
    group: "Task 2",
    title: "Cities and green spaces",
    subtitle: "Are urban green spaces essential, or should land be used more productively?",
    prompt:
      "As cities grow larger, green spaces such as parks and gardens are disappearing. Some people argue that urban green spaces are essential for quality of life, while others believe land should be used more productively. Discuss both views and give your own opinion.",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ia-ai-workplace",
    group: "Task 2",
    title: "Artificial intelligence in the workplace",
    subtitle: "Is AI replacing human workers a positive or negative development?",
    prompt:
      "Artificial intelligence and automation are increasingly replacing human workers in many industries. Some people view this as a positive development, while others are concerned about its consequences. Discuss both views and give your own opinion.",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ia-social-loneliness",
    group: "Task 2",
    title: "Social media and loneliness",
    subtitle: "Is social media making people lonelier, or strengthening connections?",
    prompt:
      "Some researchers claim that social media platforms are making people lonelier and less able to form meaningful relationships. Others disagree and argue that social media strengthens human connections. To what extent do you agree or disagree?",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ia-university",
    group: "Task 2",
    title: "University education",
    subtitle: "Are vocational skills more valuable than academic qualifications?",
    prompt:
      "In many countries, a university education is now seen as essential for a good career. However, some argue that vocational training and practical skills are more valuable than academic qualifications. Discuss both views and give your own opinion.",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ia-food-global",
    group: "Task 2",
    title: "Food and globalisation",
    subtitle: "Is the spread of global food a threat to local cultures?",
    prompt:
      "As a result of globalisation, many people are now eating the same foods across the world, which some see as a threat to local food cultures. Others argue that the spread of global food is simply a matter of personal choice. To what extent do you agree or disagree?",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ia-remote-work",
    group: "Task 2",
    title: "Remote work",
    subtitle: "Does working from home improve productivity, or create isolation?",
    prompt:
      "Remote working has become increasingly common in many industries. Some believe that working from home improves productivity and work-life balance, while others argue it creates isolation and reduces collaboration. Discuss both views and give your own opinion.",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
];

const ieltsGeneral: Task[] = [
  {
    id: "ig-shared-room",
    group: "Task 1",
    title: "Shared room problems",
    subtitle: "You share a room in college but find it very difficult to work.",
    prompt:
      "You live in a room in college which you share with another student. However, there are many problems with this arrangement and you find it very difficult to work. Write a letter to the accommodation officer at the college. In your letter: describe the situation, explain what the problems are, and say what you would like the accommodation officer to do. You do NOT need to write any addresses.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Formal Letter",
    isNew: true,
  },
  {
    id: "ig-library",
    group: "Task 1",
    title: "Library improvements",
    subtitle: "Your local public library wants ideas from users to improve services.",
    prompt:
      "Your local public library wants to make improvements to their services and facilities. In order to get ideas from the public, they have asked library users to write to them. Write a letter to the librarian. In your letter: describe how you use the library at the moment, explain what you find wrong with the current service, and suggest some improvements.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Formal Letter",
    isNew: true,
  },
  {
    id: "ig-flight",
    group: "Task 1",
    title: "Flight complaint",
    subtitle: "Your luggage was lost on a recent flight and never returned.",
    prompt:
      "You recently travelled by plane and your luggage was lost. You have still not received it. Write a letter to the airline's customer service department. In your letter: describe what happened, explain what problems you have experienced as a result, and say what action you would like the airline to take.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Complaint Letter",
    isNew: true,
  },
  {
    id: "ig-invite-friend",
    group: "Task 1",
    title: "Invitation to a friend",
    subtitle: "Invite an English-speaking friend to a concert next weekend.",
    prompt:
      "You have been given two free tickets to a concert next weekend. You want to invite an English-speaking friend to come with you. Write a letter to your friend. In your letter: explain how you got the tickets, describe what the concert will be like, and invite your friend to come.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Informal Letter",
    isNew: true,
  },
  {
    id: "ig-job-app",
    group: "Task 1",
    title: "Job application",
    subtitle: "Apply for a part-time job at an international company in your city.",
    prompt:
      "You have seen an advertisement for a part-time job at an international company in your city. Write a letter of application. In your letter: explain why you are interested in this job, describe your relevant experience and qualifications, and say when you would be available to start.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Formal Letter",
    isNew: true,
  },
  {
    id: "ig-noise",
    group: "Task 1",
    title: "Neighbour noise complaint",
    subtitle: "Write to a neighbour about a noise problem.",
    prompt:
      "You are experiencing problems with noise from a neighbour. Write a letter to your neighbour. In your letter: introduce yourself, describe the problem, and suggest how the situation could be improved.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Formal Letter",
    isNew: true,
  },
  {
    id: "ig-place-visit",
    group: "Task 1",
    title: "Recommending a place to visit",
    subtitle: "A friend is visiting your country and needs accommodation advice.",
    prompt:
      "A friend is planning to visit your country for the first time and has asked you to recommend somewhere to stay. Write a letter to your friend. In your letter: recommend a place to stay, explain what there is to do in the area, and offer to help with any arrangements.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Informal Letter",
    isNew: true,
  },
  {
    id: "ig-borrow",
    group: "Task 1",
    title: "Borrowing something from a friend",
    subtitle: "You need to borrow an important item from a friend for a few days.",
    prompt:
      "You need to borrow an important item from a friend for a few days. Write a letter to your friend. In your letter: explain why you need the item, explain how you will take care of it, and say when you will return it.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Informal Letter",
    isNew: true,
  },
  {
    id: "ig-reference",
    group: "Task 1",
    title: "Requesting a reference",
    subtitle: "Ask a former manager for a job reference.",
    prompt:
      "You are applying for a new job and need a reference from a former manager. Write a letter to your former manager. In your letter: remind them of your working relationship, explain what the new job involves, and ask them if they would be willing to provide a reference.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Formal Letter",
    isNew: true,
  },
  {
    id: "ig-faulty",
    group: "Task 1",
    title: "Returning a faulty product",
    subtitle: "An electrical item you bought recently has stopped working.",
    prompt:
      "You recently bought an electrical item from a shop and it has stopped working. Write a letter to the shop manager. In your letter: describe the item and when you bought it, explain what the problem is, and say what you want the manager to do.",
    bullets: [],
    wordCount: "Write at least 150 words. ~20 min.",
    badge: "Task 1 — Complaint Letter",
    isNew: true,
  },
  {
    id: "ig-shopping",
    group: "Task 2",
    title: "Shopping as a leisure activity",
    subtitle: "Discuss advantages and disadvantages of shopping for leisure.",
    prompt:
      "Shopping is becoming more and more popular as a leisure activity. However, some people argue that this has both positive and negative consequences for individuals and society. Discuss the advantages and disadvantages of shopping as a leisure activity and give your own opinion.",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ig-transport",
    group: "Task 2",
    title: "Public transport vs private cars",
    subtitle: "Should governments discourage private cars?",
    prompt:
      "Some people think that governments should discourage people from using private cars and invest more heavily in public transport. To what extent do you agree or disagree? Give reasons for your answer.",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ig-older-workers",
    group: "Task 2",
    title: "Older workers",
    subtitle: "Why do employers prefer younger workers? Is this positive or negative?",
    prompt:
      "Some employers prefer to hire younger workers rather than older employees. What do you think are the reasons for this? Do you think this is a positive or negative development?",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ig-arts",
    group: "Task 2",
    title: "The importance of arts education",
    subtitle: "Should art and music be compulsory in schools?",
    prompt:
      "Some people think that art and music should be compulsory subjects in all schools. Others believe that schools should focus only on academic subjects. Discuss both views and give your own opinion.",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ig-healthy",
    group: "Task 2",
    title: "Healthy eating",
    subtitle: "Why don't people eat well or exercise? What can be done?",
    prompt:
      "Many people today do not follow a healthy diet and do not take regular exercise. What do you think are the main causes of this problem? What measures could be taken to address it?",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ig-zoos",
    group: "Task 2",
    title: "Zoos",
    subtitle: "Are zoos cruel, or do they play an important role?",
    prompt:
      "Some people think that zoos are cruel and should be banned. Others argue that zoos play an important role in conservation and education. Discuss both views and give your own opinion.",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ig-travel",
    group: "Task 2",
    title: "Travelling abroad vs staying home",
    subtitle: "Is travelling abroad the best way to learn about cultures?",
    prompt:
      "Some people think that spending time travelling abroad is the best way to learn about other cultures. Others believe you can learn just as much about other cultures in your own country. To what extent do you agree or disagree?",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ig-children-tech",
    group: "Task 2",
    title: "Children and technology",
    subtitle: "Do digital devices benefit children more than they harm them?",
    prompt:
      "Many children today spend a great deal of time using smartphones and other devices. Some parents and teachers are concerned about the effects of this. Do you think the advantages of children using digital devices outweigh the disadvantages?",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ig-celebrity",
    group: "Task 2",
    title: "Celebrity culture",
    subtitle: "Is it unfair that celebrities earn more than other professions?",
    prompt:
      "In many countries, celebrities such as film stars and sports personalities receive far higher salaries than people in other important professions. Some people think this is unfair. To what extent do you agree or disagree?",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
  {
    id: "ig-long-hours",
    group: "Task 2",
    title: "Working long hours",
    subtitle: "Is working long hours positive or negative? How could it be reduced?",
    prompt:
      "In some countries, people work very long hours and have little time for leisure activities. Do you think this is a positive or negative development? What could be done to reduce working hours?",
    bullets: [],
    wordCount: "Write at least 250 words. ~40 min.",
    badge: "Task 2 — Essay",
    isNew: true,
  },
];

const b2First: Task[] = [
  {
    id: "b2-social-media",
    group: "Part 1",
    title: "Social media and teenagers",
    subtitle: "Does social media have more negative effects on teenagers than positive ones?",
    prompt:
      "In your English class, you have been discussing the effects of social media on young people. Now your English teacher has asked you to write an essay. Write your essay using all the notes and giving reasons for your point of view. 'Social media has more negative effects on teenagers than positive ones.' Notes: 1. mental health 2. staying connected 3. .......... (your own idea).",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 1 — Essay",
    isNew: true,
  },
  {
    id: "b2-homeschooling",
    group: "Part 1",
    title: "Homeschooling vs school",
    subtitle: "Is teaching children at home a good or bad thing?",
    prompt:
      "In your English class, you have been talking about education. Now your English teacher has asked you to write an essay. Write your essay using all the notes and giving reasons for your point of view. 'Some parents teach their children at home rather than sending them to school. Is this a good or bad thing for children?' Notes: 1. having a parent as a teacher 2. making friends 3. .......... (your own idea).",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 1 — Essay",
    isNew: true,
  },
  {
    id: "b2-modern-tech",
    group: "Part 1",
    title: "Modern technology",
    subtitle: "Has technology made our lives easier but also more complicated?",
    prompt:
      "In your English class, you have been discussing modern technology. Now your English teacher has asked you to write an essay. Write your essay using all the notes and giving reasons for your point of view. 'Technology has made our lives easier but also more complicated.' Notes: 1. communication 2. privacy 3. .......... (your own idea).",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 1 — Essay",
    isNew: true,
  },
  {
    id: "b2-environment",
    group: "Part 1",
    title: "The environment",
    subtitle: "Does every individual have a responsibility to protect the environment?",
    prompt:
      "In your English class, you have been talking about the environment. Now your English teacher has asked you to write an essay. Write your essay using all the notes and giving reasons for your point of view. 'Every individual has a responsibility to protect the environment.' Notes: 1. daily habits 2. government responsibility 3. .......... (your own idea).",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 1 — Essay",
    isNew: true,
  },
  {
    id: "b2-sport",
    group: "Part 1",
    title: "Sport and fitness",
    subtitle: "Does competitive sport teach important life skills?",
    prompt:
      "In your English class, you have been discussing sport and fitness. Now your English teacher has asked you to write an essay. Write your essay using all the notes and giving reasons for your point of view. 'Taking part in competitive sport teaches young people important life skills.' Notes: 1. teamwork 2. dealing with failure 3. .......... (your own idea).",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 1 — Essay",
    isNew: true,
  },
  {
    id: "b2-film",
    group: "Part 2",
    title: "Article: A film that changed you",
    subtitle: "Tell a magazine about a film that changed the way you think.",
    prompt:
      "You see this announcement in an international magazine: 'We want to hear about a film that changed the way you think about something. Write us an article telling us about the film, explaining what it made you think about, and saying whether you would recommend it to others.' Write your article.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Article",
    isNew: true,
  },
  {
    id: "b2-restaurant",
    group: "Part 2",
    title: "Review: A restaurant",
    subtitle: "Review a restaurant for an English-language travel website.",
    prompt:
      "You see this announcement on an English-language travel website: 'We are looking for reviews of restaurants in your area. Write a review of a restaurant you have visited recently. Tell us about the food, atmosphere, and service, and say whether you would recommend it.' Write your review.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Review",
    isNew: true,
  },
  {
    id: "b2-email-sam",
    group: "Part 2",
    title: "Email: Helping a friend plan a visit",
    subtitle: "Reply to your English-speaking friend Sam, who is visiting your city.",
    prompt:
      "You have received this email from your English-speaking friend Sam: 'I'm coming to visit your city next month for the first time. I'd love to know what there is to do there. What do you think I should see? Where should I eat? And what should I avoid?' Write your email reply to Sam.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Informal Email",
    isNew: true,
  },
  {
    id: "b2-report-school",
    group: "Part 2",
    title: "Report: Improving school facilities",
    subtitle: "Write a report on how school facilities could be improved.",
    prompt:
      "Your school's director has asked students to write a report on how school facilities could be improved. Write a report describing the current situation, identifying problems, and making recommendations.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Report",
    isNew: true,
  },
  {
    id: "b2-story-understood",
    group: "Part 2",
    title: "Story: It was only then that I understood",
    subtitle: "Your story must begin with the line above.",
    prompt:
      "Your English teacher has asked you to write a story for the school magazine. Your story must begin with the following words: 'It was only then that I understood.' Write your story.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Story",
    isNew: true,
  },
  {
    id: "b2-article-language",
    group: "Part 2",
    title: "Article: The best way to learn a language",
    subtitle: "Share your view on the best way to learn a foreign language.",
    prompt:
      "You see this announcement in an English-language student magazine: 'We want to hear your views on the best way to learn a foreign language. Write an article giving your opinion, supporting your ideas with reasons and examples.' Write your article.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Article",
    isNew: true,
  },
  {
    id: "b2-book-review",
    group: "Part 2",
    title: "Review: A book you loved",
    subtitle: "Review a book you loved for an English-language magazine.",
    prompt:
      "You see this notice in an English-language magazine: 'We are collecting reviews of books our readers have loved. Tell us what the book is about, why you enjoyed it, and whether you would recommend it to others.' Write your review.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Review",
    isNew: true,
  },
  {
    id: "b2-volunteer",
    group: "Part 2",
    title: "Formal letter: Applying for a volunteer position",
    subtitle: "Apply to help organise an annual international youth festival.",
    prompt:
      "You see this advertisement: 'We are looking for volunteers to help organise our annual international youth festival. If you are enthusiastic, reliable, and speak good English, write to us explaining why you would be a good volunteer.' Write your letter of application.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Formal Letter",
    isNew: true,
  },
  {
    id: "b2-report-town",
    group: "Part 2",
    title: "Report: A town improvement project",
    subtitle: "Report to the town council on improvements for teenagers.",
    prompt:
      "The town council has asked for suggestions from young people on how to improve the town for teenagers. Write a report for the council describing what young people currently think about the town, what changes they would like to see, and why these changes would be beneficial.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Report",
    isNew: true,
  },
  {
    id: "b2-story-nervous",
    group: "Part 2",
    title: "Story: She had never felt so nervous",
    subtitle: "Your story must end with the line below.",
    prompt:
      "Your English teacher has asked you to write a story for the school creative writing competition. Your story must end with the following words: 'She had never felt so nervous — and yet so ready.' Write your story.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Story",
    isNew: true,
  },
  {
    id: "b2-article-creativity",
    group: "Part 2",
    title: "Article: Is social media making us less creative?",
    subtitle: "Is social media stifling creativity, or inspiring new expression?",
    prompt:
      "You see this announcement in an online magazine for students: 'We want to know what you think — is social media making young people less creative, or does it inspire new forms of expression? Write an article giving your views with reasons and examples.' Write your article.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Article",
    isNew: true,
  },
  {
    id: "b2-email-complaint",
    group: "Part 2",
    title: "Email: Responding to a complaint",
    subtitle: "Reply to a disappointed customer at the sports centre where you work.",
    prompt:
      "You work part-time at a local sports centre. You have received this email from a customer: 'I visited your sports centre last week and was very disappointed with the facilities. The changing rooms were dirty and the equipment was broken. I would like an explanation.' Write an email responding to the customer's complaint.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Formal Email",
    isNew: true,
  },
  {
    id: "b2-music-review",
    group: "Part 2",
    title: "Review: A music event or concert",
    subtitle: "Review a recent music event for a student website.",
    prompt:
      "You see this announcement on an English-language student website: 'Have you been to a music event or concert recently? Write a review for our website. Tell us about the event, whether it met your expectations, and if you would recommend it to other students.' Write your review.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Review",
    isNew: true,
  },
  {
    id: "b2-canteen",
    group: "Part 2",
    title: "Report: Healthy eating at school",
    subtitle: "Report on canteen food and student preferences.",
    prompt:
      "Your school wants to improve the food served in the canteen. The head teacher has asked students to write a report on current eating habits at school, what students think about the food available, and what improvements they would suggest. Write your report.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Report",
    isNew: true,
  },
  {
    id: "b2-story-door",
    group: "Part 2",
    title: "Story: The door was open",
    subtitle: "Your story must begin with the line below.",
    prompt:
      "Your English teacher has asked you to write a story. Your story must begin with the following words: 'The door was open, which was strange — it was never open at this hour.' Write your story.",
    bullets: [],
    wordCount: "Write 140–190 words.",
    badge: "Part 2 — Story",
    isNew: true,
  },
];

const business: Task[] = [
  {
    id: "bus-meeting",
    group: "Emails",
    title: "Email: Requesting a meeting",
    subtitle: "Arrange a meeting with a client to discuss a new project proposal.",
    prompt:
      "You need to arrange a meeting with a client to discuss a new project proposal. Write a professional email to your client, Sarah Chen. In your email: introduce the reason for writing, suggest two possible meeting times, and briefly outline what you would like to discuss.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Business Email",
  },
  {
    id: "bus-complaint",
    group: "Emails",
    title: "Email: Responding to a complaint",
    subtitle: "A client complains about a recent software update.",
    prompt:
      "You manage a small software company. A client has written to complain that a recent software update has caused problems for their team. Write a professional reply apologising for the inconvenience, explaining what has caused the issue, and describing what steps you are taking to resolve it.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Business Email",
  },
  {
    id: "bus-survey",
    group: "Reports",
    title: "Report: Employee satisfaction survey",
    subtitle: "Summarise survey findings for senior management.",
    prompt:
      "Your company has completed an employee satisfaction survey. The results show that staff are happy with their colleagues but concerned about workload and career development. Write a short report for senior management summarising the findings and making two specific recommendations.",
    bullets: [],
    wordCount: "Write 150–200 words.",
    badge: "Report",
  },
  {
    id: "bus-flexible",
    group: "Proposals",
    title: "Proposal: Introducing flexible working",
    subtitle: "Recommend that the company introduce flexible working hours.",
    prompt:
      "Your manager has asked you to write a short proposal recommending that the company introduce flexible working hours. In your proposal: explain why flexible working would benefit employees, describe how it could be implemented, and address one potential concern.",
    bullets: [],
    wordCount: "Write 150–200 words.",
    badge: "Proposal",
  },
  {
    id: "bus-followup",
    group: "Emails",
    title: "Email: Following up after a job interview",
    subtitle: "Follow up on a marketing position interview from three days ago.",
    prompt:
      "You had a job interview three days ago for a marketing position at a media company. Write a professional follow-up email to the interviewer. In your email: thank them for the opportunity, briefly restate your interest in the role, and politely ask about the timeline for their decision.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Business Email",
  },
  {
    id: "bus-cancel",
    group: "Emails",
    title: "Email: Cancelling a business appointment",
    subtitle: "Cancel a meeting with a new business partner you have not met.",
    prompt:
      "An urgent matter has come up and you need to cancel a meeting scheduled for tomorrow with a new business partner you have not yet met. Write a professional email apologising for the cancellation, explaining the reason briefly, and proposing a new date and time.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Business Email",
  },
  {
    id: "bus-service",
    group: "Reports",
    title: "Report: Improving customer service",
    subtitle: "Address recurring complaints about response times and staff.",
    prompt:
      "You work for a retail company. Customer feedback over the last quarter has highlighted recurring complaints about slow response times and unhelpful staff. Write a report for your manager summarising the feedback, identifying the main problems, and recommending two practical improvements.",
    bullets: [],
    wordCount: "Write 150–200 words.",
    badge: "Report",
  },
  {
    id: "bus-marketing",
    group: "Cover Letters",
    title: "Cover letter: Marketing manager position",
    subtitle: "Apply for a Marketing Manager role at an international travel company.",
    prompt:
      "You have seen a job advertisement for a Marketing Manager at an international travel company. The role requires experience in digital marketing, strong communication skills, and the ability to manage a small team. Write a cover letter for this position.",
    bullets: [],
    wordCount: "Write 200–250 words.",
    badge: "Cover Letter",
  },
  {
    id: "bus-product-info",
    group: "Emails",
    title: "Email: Requesting information about a product",
    subtitle: "Request pricing and trial details for project management software.",
    prompt:
      "You are a purchasing manager interested in a product you saw advertised online — a project management software suite. Write a professional email to the sales team requesting more information about pricing, licensing options, and whether a free trial is available.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Business Email",
  },
  {
    id: "bus-team-event",
    group: "Proposals",
    title: "Proposal: Organising a team-building event",
    subtitle: "Propose a team-building event for 20 employees.",
    prompt:
      "Your manager has asked you to write a proposal for a team-building event for 20 employees. In your proposal: suggest a specific activity, explain why it would benefit the team, outline a rough budget, and suggest a date.",
    bullets: [],
    wordCount: "Write 150–200 words.",
    badge: "Proposal",
  },
  {
    id: "bus-introduce",
    group: "Emails",
    title: "Email: Introducing yourself to a new team",
    subtitle: "Introduce yourself to colleagues in three different countries.",
    prompt:
      "You have just started a new job in an international company with team members in three different countries. Write a professional introductory email to your new colleagues. In your email: introduce yourself, briefly describe your background and role, and express your enthusiasm for working with them.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Business Email",
  },
  {
    id: "bus-social",
    group: "Reports",
    title: "Report: Social media performance",
    subtitle: "Analyse a drop in engagement and recommend improvements.",
    prompt:
      "You manage the social media accounts for a small business. Over the last three months, follower growth has slowed and engagement has dropped by 20%. Write a short report for your manager analysing what might have caused this, and recommending two specific actions to improve performance.",
    bullets: [],
    wordCount: "Write 150–200 words.",
    badge: "Report",
  },
  {
    id: "bus-deadline",
    group: "Emails",
    title: "Email: Negotiating a deadline extension",
    subtitle: "Request a five-day extension from a client due to a personal issue.",
    prompt:
      "You are a freelance designer and you are working on a project for a client. You realise you will not be able to deliver the work by the agreed deadline due to an unexpected personal situation. Write a professional email to your client explaining the situation and requesting a five-day extension.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Business Email",
  },
  {
    id: "bus-newsletter",
    group: "Proposals",
    title: "Proposal: Launching a company newsletter",
    subtitle: "Propose a monthly internal employee newsletter.",
    prompt:
      "Your company currently has no internal communications channel. You believe a monthly employee newsletter would improve morale and keep staff informed. Write a proposal for your manager explaining the purpose of the newsletter, what it would contain, how it would be produced, and what benefits it would bring.",
    bullets: [],
    wordCount: "Write 150–200 words.",
    badge: "Proposal",
  },
  {
    id: "bus-analyst",
    group: "Cover Letters",
    title: "Cover letter: Junior data analyst position",
    subtitle: "Apply for a Junior Data Analyst role at a fintech company.",
    prompt:
      "You have seen an advertisement for a Junior Data Analyst role at a financial technology company. The company is looking for candidates with analytical skills, attention to detail, and some experience with data tools such as Excel or SQL. Write a cover letter for this position.",
    bullets: [],
    wordCount: "Write 200–250 words.",
    badge: "Cover Letter",
  },
  {
    id: "bus-thanks",
    group: "Emails",
    title: "Email: Thanking a client after a successful project",
    subtitle: "Thank a long-term client after a successful six-month project.",
    prompt:
      "You have just completed a successful six-month project with a long-term client. Write a professional email thanking them for their collaboration, highlighting one or two things that went particularly well, and expressing your hope to work together in the future.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Business Email",
  },
  {
    id: "bus-sustainability",
    group: "Reports",
    title: "Report: Office sustainability",
    subtitle: "Recommend three practical steps for a more sustainable office.",
    prompt:
      "Your company has committed to reducing its environmental impact. You have been asked to write a report assessing current waste and energy usage in the office and recommending three practical steps the company could take to become more sustainable.",
    bullets: [],
    wordCount: "Write 150–200 words.",
    badge: "Report",
  },
  {
    id: "bus-mentorship",
    group: "Proposals",
    title: "Proposal: Mentorship programme",
    subtitle: "Propose a formal mentorship programme for recent graduates.",
    prompt:
      "Your company employs many recent graduates who have expressed feeling unsupported in their first year. Write a proposal to HR recommending the introduction of a formal mentorship programme. Include: what the programme would involve, how it would be organised, and what benefits it would bring to both mentors and mentees.",
    bullets: [],
    wordCount: "Write 150–200 words.",
    badge: "Proposal",
  },
  {
    id: "bus-decline",
    group: "Emails",
    title: "Email: Declining a job offer professionally",
    subtitle: "Decline an offer, having accepted another position.",
    prompt:
      "You have received a job offer from a company but have decided to accept a different position elsewhere. Write a professional email declining the offer. In your email: thank them for the offer, explain briefly that you have accepted another position, and express your respect for their company.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Business Email",
  },
  {
    id: "bus-communications",
    group: "Cover Letters",
    title: "Cover letter: Communications officer position",
    subtitle: "Apply for a Communications Officer role at a non-profit.",
    prompt:
      "You have seen an advertisement for a Communications Officer at a non-profit organisation working on education policy. The role involves writing press releases, managing media relations, and producing internal reports. Write a cover letter for this position.",
    bullets: [],
    wordCount: "Write 200–250 words.",
    badge: "Cover Letter",
  },
];

const justForFun: Task[] = [
  {
    id: "fun-package",
    group: "Stories",
    title: "A story: The unexpected package",
    subtitle: "A mysterious package arrives on your doorstep with no sender's address.",
    prompt:
      "You arrive home one day to find a large, mysterious package on your doorstep with no sender's address. Write a short story describing what happens next.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Story",
  },
  {
    id: "fun-fav-place",
    group: "Descriptions",
    title: "A description: Your favourite place in the world",
    subtitle: "Make the reader feel as if they are there.",
    prompt:
      "Think of a place — a city, a room, a landscape, a corner of a café — that means something to you. Write a vivid description of this place that makes the reader feel as if they are there.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Description",
  },
  {
    id: "fun-travel-alone",
    group: "Opinions",
    title: "An opinion piece: Is it better to travel alone or with others?",
    subtitle: "Share your view with reasons and a personal example.",
    prompt:
      "Some people love the freedom of solo travel. Others prefer exploring with friends or family. Write a short opinion piece giving your view, with reasons and a personal example if possible.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Opinion",
  },
  {
    id: "fun-wrong-day",
    group: "Stories",
    title: "A story: The day everything went wrong",
    subtitle: "Something unexpected and positive comes from a chaotic day.",
    prompt:
      "Write a short story about a day when absolutely nothing went to plan — but something unexpected and positive came out of it.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Story",
  },
  {
    id: "fun-past-self",
    group: "Letters",
    title: "A letter to your past self",
    subtitle: "Write to yourself at age 15.",
    prompt:
      "Write a short letter to yourself at the age of 15. What would you tell yourself? What mistakes would you warn about? What would you want your younger self to know?",
    bullets: [],
    wordCount: "Write 120–160 words.",
    badge: "Creative Writing",
  },
  {
    id: "fun-best-meal",
    group: "Reviews",
    title: "A review: The best meal you have ever had",
    subtitle: "Describe what made the meal memorable.",
    prompt:
      "Write a review of the best meal you have ever eaten. Describe the food, where it was, what made it so memorable, and whether you would recommend the experience to others.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Review",
  },
  {
    id: "fun-cook",
    group: "Opinions",
    title: "An opinion piece: Should everyone learn to cook?",
    subtitle: "Is cooking an essential life skill or unnecessary today?",
    prompt:
      "Some people say cooking is an essential life skill. Others think it is unnecessary in a world of restaurants and ready meals. Write a short piece giving your opinion.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Opinion",
  },
  {
    id: "fun-last-train",
    group: "Stories",
    title: "A story: The last train",
    subtitle: "Begin with: 'She missed the last train by thirty seconds.'",
    prompt:
      "Write a short story that begins: 'She missed the last train by thirty seconds.' What happens next? Where is she going, and why does it matter so much?",
    bullets: [],
    wordCount: "Write 120–180 words.",
    badge: "Story",
  },
  {
    id: "fun-inspired",
    group: "Descriptions",
    title: "A description: A person who inspired you",
    subtitle: "Describe someone who influenced the way you think or act.",
    prompt:
      "Think of someone — a teacher, a family member, a stranger you once met — who influenced the way you think or act. Write a short description of this person and explain what you learned from them.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Description",
  },
  {
    id: "fun-traditions",
    group: "Opinions",
    title: "An opinion piece: Is it important to keep traditions alive?",
    subtitle: "Should old customs be preserved or let go?",
    prompt:
      "Some people believe that old traditions and customs are worth preserving. Others think society should move on and let old traditions disappear. Write your opinion with reasons and examples.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Opinion",
  },
  {
    id: "fun-wrong-door",
    group: "Stories",
    title: "A story: The wrong door",
    subtitle: "Begin with: 'He opened the door and immediately knew he was in the wrong place.'",
    prompt:
      "Write a short story that begins: 'He opened the door and immediately knew he was in the wrong place.'",
    bullets: [],
    wordCount: "Write 120–180 words.",
    badge: "Story",
  },
  {
    id: "fun-never-thanked",
    group: "Letters",
    title: "A letter: To someone you have never thanked",
    subtitle: "Write to someone who helped you but was never properly thanked.",
    prompt:
      "Think of someone who helped you at some point in your life — a person you never properly thanked. Write a letter to that person now.",
    bullets: [],
    wordCount: "Write 120–160 words.",
    badge: "Creative Writing",
  },
  {
    id: "fun-disappointed",
    group: "Reviews",
    title: "A review: A place you were disappointed by",
    subtitle: "Honest review of somewhere that failed to meet expectations.",
    prompt:
      "Write an honest review of a place — a restaurant, a city, a tourist attraction — that you were looking forward to but found disappointing. Explain what you expected, what you found, and what could be improved.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Review",
  },
  {
    id: "fun-mornings",
    group: "Opinions",
    title: "An opinion piece: Are mornings or evenings better?",
    subtitle: "Defend your preference with reasons and examples.",
    prompt:
      "Do you consider yourself a morning person or a night person? Write a lighthearted but well-argued piece defending your preference with reasons and examples.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Opinion",
  },
  {
    id: "fun-journey",
    group: "Descriptions",
    title: "A description: A journey you will never forget",
    subtitle: "Focus on what you saw, felt, or thought during the journey.",
    prompt:
      "Write a vivid description of a journey — by train, plane, car, or on foot — that you remember clearly. Focus on what you saw, felt, or thought during the journey, not just where you were going.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Description",
  },
  {
    id: "fun-photo",
    group: "Stories",
    title: "A story: The photograph",
    subtitle: "Someone finds an old photo of a stranger that unsettles them.",
    prompt:
      "Write a short story about someone who finds an old photograph of a person they do not recognise — but something about it unsettles them.",
    bullets: [],
    wordCount: "Write 120–180 words.",
    badge: "Story",
  },
  {
    id: "fun-future-self",
    group: "Letters",
    title: "A letter: To a future version of yourself",
    subtitle: "Write to yourself ten years from now.",
    prompt:
      "Write a letter to yourself ten years from now. What do you hope will have changed? What do you hope will have stayed the same? What questions do you want your future self to answer?",
    bullets: [],
    wordCount: "Write 120–160 words.",
    badge: "Creative Writing",
  },
  {
    id: "fun-great-city",
    group: "Opinions",
    title: "An opinion piece: What makes a great city to live in?",
    subtitle: "Argue for two or three essential factors.",
    prompt:
      "What do you think are the most important qualities of a great city to live in? Write a short opinion piece arguing for the two or three factors you consider most essential, with reasons and examples.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Opinion",
  },
  {
    id: "fun-sound",
    group: "Descriptions",
    title: "A description: A sound that takes you back",
    subtitle: "Describe a sound and the memory it carries.",
    prompt:
      "Think of a sound — music, rain on a window, a particular voice — that immediately takes you back to a specific moment in your life. Write a vivid description of that sound and the memory it carries.",
    bullets: [],
    wordCount: "Write 100–150 words.",
    badge: "Description",
  },
  {
    id: "fun-five-min",
    group: "Stories",
    title: "A story: Five more minutes",
    subtitle: "End with: 'If only I had asked for five more minutes.'",
    prompt:
      "Write a short story that ends with the words: 'If only I had asked for five more minutes.'",
    bullets: [],
    wordCount: "Write 120–180 words.",
    badge: "Story",
  },
];

export const tasksByLevel: Record<WorkbookLevel, Task[]> = {
  beginner,
  intermediate,
  advanced,
  business,
  "just-for-fun": justForFun,
  "ielts-academic": ieltsAcademic,
  "ielts-general-training": ieltsGeneral,
  "b2-first": b2First,
};

export const yourWriting: Record<WorkbookLevel, { title: string; description: string }[]> = {
  beginner: [],
  intermediate: [],
  advanced: [],
  business: [],
  "just-for-fun": [],
  "ielts-academic": [],
  "ielts-general-training": [],
  "b2-first": [],
};

export function getAllSectionsForLanguage(lang: TaskLanguage): Section[] {
  return allSections.map((section) => ({
    ...section,
    label: sectionLabelsByLanguage[lang][section.slug],
  }));
}

export function getTasksForLevel(level: WorkbookLevel, lang: TaskLanguage): Task[] {
  return tasksByLevel[level].map((task) => adaptTask(task, level, lang));
}

export function getTaskForLanguage(
  level: WorkbookLevel,
  taskId: string,
  lang: TaskLanguage,
): Task | undefined {
  return getTasksForLevel(level, lang).find((task) => task.id === taskId);
}
