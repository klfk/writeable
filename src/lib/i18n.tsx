import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "de" | "fr";

export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
};

// UI language names. The learning/assessment target is English unless a future setting changes it.
export const LANG_TARGET: Record<Lang, string> = {
  en: "English",
  de: "German",
  fr: "French",
};

const LANG_KEY = "app_lang";

// Translation dictionary. Keys are the English source strings.
// Missing entries fall back to the English source.
const DICT: Record<Lang, Record<string, string>> = {
  en: {},
  de: {
    // Sidebar
    "Welcome,": "Willkommen,",
    "Sign out": "Abmelden",
    Workbooks: "Arbeitsbücher",
    "Test Zone": "Testbereich",
    Settings: "Einstellungen",
    "Help centre": "Hilfecenter",
    Language: "Sprache",
    new: "neu",
    // Section labels
    Beginner: "Anfänger",
    Intermediate: "Mittelstufe",
    Advanced: "Fortgeschritten",
    Business: "Business",
    "Just for Fun": "Just for Fun",
    "IELTS Academic": "IELTS Academic",
    "IELTS General Training": "IELTS General Training",
    "B2 First": "B2 First",
    // Auth
    there: "willkommen",
    "Sign in": "Anmelden",
    "Sign up": "Registrieren",
    "Create your account": "Konto erstellen",
    "Create account": "Konto erstellen",
    "Welcome back. Sign in to continue.": "Willkommen zurück. Melde dich an, um fortzufahren.",
    "Start practising in seconds.": "Starte in Sekunden mit dem Üben.",
    "Continue with Google": "Mit Google fortfahren",
    or: "oder",
    Name: "Name",
    "Your name": "Dein Name",
    "No account?": "Noch kein Konto?",
    "Already have an account?": "Bereits ein Konto?",
    "Back home": "Zurück zur Startseite",
    // Workbook list
    "New tasks": "Neue Aufgaben",
    "Your Writing": "Deine Texte",
    "Your completed and in-progress tasks will appear here.":
      "Deine erledigten und laufenden Aufgaben erscheinen hier.",
    "Just now": "Gerade eben",
    Yesterday: "Gestern",
    "minute ago": "Minute her",
    "minutes ago": "Minuten her",
    "hour ago": "Stunde her",
    "hours ago": "Stunden her",
    "days ago": "Tage her",
    "month ago": "Monat her",
    "months ago": "Monate her",
    "year ago": "Jahr her",
    "years ago": "Jahre her",
    // Task detail chrome
    "Back to": "Zurück zu",
    "Do not write your real name or email address in your answer.":
      "Schreibe in deiner Antwort nicht deinen echten Namen oder deine E-Mail-Adresse.",
    "Write your text here.": "Schreibe deinen Text hier.",
    "words entered (the word count for this task is about":
      "Wörter eingegeben (die Wortzahl für diese Aufgabe beträgt etwa",
    "words).": "Wörter).",
    Check: "Prüfen",
    "Checking…": "Prüfe…",
    "Edit again": "Erneut bearbeiten",
    "Task Help": "Aufgabenhilfe",
    Images: "Bilder",
    Feedback: "Feedback",
    Changes: "Änderungen",
    "Your automatic feedback will appear here after we finish checking your work.":
      "Dein automatisches Feedback erscheint hier, nachdem wir deine Arbeit geprüft haben.",
    "Task Timer": "Aufgaben-Timer",
    "Start timer": "Timer starten",
    "Stop timer": "Timer stoppen",
    "Reset timer": "Timer zurücksetzen",
    "Click on 'Start timer' to time your writing.":
      "Klicke auf 'Timer starten', um deine Schreibzeit zu messen.",
    "Click on 'Stop timer' when you are ready to Check your writing.":
      "Klicke auf 'Timer stoppen', wenn du bereit bist, deinen Text zu prüfen.",
    "You have used this much time:": "Du hast so viel Zeit verbraucht:",
    "Your progress": "Dein Fortschritt",
    Checks: "Prüfungen",
    "Your progress graph will appear here after your first check.":
      "Deine Fortschrittsgrafik erscheint hier nach deiner ersten Prüfung.",
    "This graph shows your CEFR level estimate for your last 10 checks.":
      "Diese Grafik zeigt die GER-Niveauschätzung deiner letzten 10 Prüfungen.",
    "Correction Cards": "Korrekturkarten",
    "Run a check to see detailed correction cards.":
      "Führe eine Prüfung durch, um detaillierte Korrekturkarten zu sehen.",
    "Could not load correction cards. Please try again.":
      "Korrekturkarten konnten nicht geladen werden. Bitte erneut versuchen.",
    "No issues found. Great work!": "Keine Fehler gefunden. Tolle Arbeit!",
    "Most important": "Am wichtigsten",
    "See rule →": "Regel ansehen →",
    "Show suggestion ▾": "Vorschlag zeigen ▾",
    "Hide suggestion ▴": "Vorschlag verbergen ▴",
    "AI Chat": "KI-Chat",
    Send: "Senden",
    "Ask about your writing…": "Frag etwas zu deinem Text…",
    "Sorry, I couldn't reply just now. Please try again.":
      "Entschuldige, ich konnte gerade nicht antworten. Bitte erneut versuchen.",
    "Could not save": "Konnte nicht gespeichert werden",
    "Unsaved changes": "Ungespeicherte Änderungen",
    "Saving…": "Speichere…",
    Saved: "Gespeichert",
    Level: "Niveau",
    "AI Feedback": "KI-Feedback",
    "Press Check to receive your writing assessment.":
      "Drücke Prüfen, um deine Schreibbewertung zu erhalten.",
    "Could not generate AI feedback. Press Check to try again.":
      "KI-Feedback konnte nicht erstellt werden. Drücke Prüfen, um es erneut zu versuchen.",
    "What you are doing well": "Was du gut machst",
    "What to prioritise": "Was du priorisieren solltest",
    "Next step": "Nächster Schritt",
    "Keep editing and press Check again to improve your score.":
      "Bearbeite weiter und drücke erneut Prüfen, um deine Punktzahl zu verbessern.",
    "Did you write about the task? (5 is best)":
      "Hast du zur Aufgabe geschrieben? (5 ist am besten)",
    "Scoring relevance…": "Bewerte Relevanz…",
    "Could not score relevance.": "Relevanz konnte nicht bewertet werden.",
    "Checking your writing…": "Prüfe deinen Text…",
    "Could not parse feedback. Please try again.":
      "Feedback konnte nicht gelesen werden. Bitte erneut versuchen.",
    issue: "Fehler",
    issues: "Fehler",
    "found:": "gefunden:",
    "No issues found. Well done.": "Keine Fehler gefunden. Gut gemacht.",
    "Rewrite Challenge": "Umschreibe-Aufgabe",
    "Run a check to see your rewrite challenge.":
      "Führe eine Prüfung durch, um deine Umschreibe-Aufgabe zu sehen.",
    "Before / After": "Vorher / Nachher",
    "Run a check to see the before/after comparison.":
      "Führe eine Prüfung durch, um den Vorher-Nachher-Vergleich zu sehen.",
    "Inline Highlighting is disabled. Enable it in Settings.":
      "Inline-Markierung ist deaktiviert. Aktiviere sie in den Einstellungen.",
    Grammar: "Grammatik",
    "Task not found.": "Aufgabe nicht gefunden.",
    "Workbook not found.": "Arbeitsbuch nicht gefunden.",
    Back: "Zurück",
    "Skip tutorial": "Tutorial überspringen",
    "Get started": "Loslegen",
    Next: "Weiter",
    "Welcome to Writable": "Willkommen bei Wrieable",
    "Show me around": "Zeig es mir",
    "Skip to exercise": "Direkt zur Übung",
    Product: "Produkt",
    Legal: "Rechtliches",
    "Privacy Policy": "Datenschutzerklärung",
    "Terms of Service": "Nutzungsbedingungen",
    "Cookie Policy": "Cookie-Richtlinie",
    Contact: "Kontakt",
    "All rights reserved.": "Alle Rechte vorbehalten.",
    Privacy: "Datenschutz",
    Terms: "Bedingungen",
    Cookies: "Cookies",
    "Not signed in": "Nicht angemeldet",
    Original: "Original",
    Corrected: "Korrigiert",
    "No corrections available yet.": "Noch keine Korrekturen verfügbar.",
    "Try rewriting this phrase:": "Versuche, diese Phrase umzuschreiben:",
    "Your rewrite": "Deine Umschreibung",
    "Suggested correction": "Vorgeschlagene Korrektur",
    "No content.": "Kein Inhalt.",
    "Your progress chart": "Dein Fortschrittsdiagramm",
    English: "Englisch",
    Spanish: "Spanisch",
    French: "Französisch",
    German: "Deutsch",
    Russian: "Russisch",
    Mandarin: "Mandarin",
    Style: "Stil",
    Vocabulary: "Wortschatz",
    "Practice a new language by writing with task-based exercises.":
      "Übe eine neue Sprache mit schreibbasierten Aufgaben.",
    "Pick a writing task": "Wähle eine Schreibaufgabe",
    "Browse workbooks by level or topic and choose a prompt that fits what you want to practice.":
      "Durchsuche Arbeitsbücher nach Niveau oder Thema und wähle eine Aufgabe, die zu deinem Übungsziel passt.",
    "Write in the target language": "Schreibe in der Zielsprache",
    "Type your response in the editor. Word count and prompt stay in view while you write.":
      "Tippe deine Antwort im Editor. Wortzahl und Aufgabe bleiben beim Schreiben sichtbar.",
    "Get instant AI feedback": "Erhalte sofortiges KI-Feedback",
    "Hit Check and receive corrections, explanations, and a relevance score for your text.":
      "Klicke auf Prüfen und erhalte Korrekturen, Erklärungen und eine Relevanzbewertung für deinen Text.",
    "Learn from your mistakes": "Lerne aus deinen Fehlern",
    "Review correction cards, rewrite, and watch your writing improve over time.":
      "Prüfe Korrekturkarten, formuliere neu und sieh, wie dein Schreiben besser wird.",
    "Would you like a quick tour of how the app works, or jump straight into your first exercise?":
      "Möchtest du eine kurze Einführung oder direkt mit der ersten Übung starten?",
    "Close tutorial": "Tutorial schließen",
    "Requires Correction Cards.": "Benötigt Korrekturkarten.",
    // Settings page
    Account: "Konto",
    "First name": "Vorname",
    "Last name": "Nachname",
    "What is your first language?": "Was ist deine Muttersprache?",
    "Which best describes you?": "Was beschreibt dich am besten?",
    "A learner of English": "Ein Lernender von Englisch",
    "A teacher of English": "Ein Lehrer für Englisch",
    "A native English speaker": "Englischer Muttersprachler",
    "What is your main reason for learning English?":
      "Was ist dein Hauptgrund, Englisch zu lernen?",
    "Save →": "Speichern →",
    Email: "E-Mail",
    "Main email address": "Hauptadresse",
    "Add a new email address": "Neue E-Mail-Adresse hinzufügen",
    Add: "Hinzufügen",
    Plugins: "Plugins",
    "Enable or disable learning plugins. Changes apply instantly.":
      "Aktiviere oder deaktiviere Lern-Plugins. Änderungen wirken sofort.",
    Password: "Passwort",
    "Password now": "Aktuelles Passwort",
    "New password": "Neues Passwort",
    "Confirm password": "Passwort bestätigen",
    "at least 8 characters": "mindestens 8 Zeichen",
    "Change password": "Passwort ändern",
    "Remove account": "Konto löschen",
    "You can remove your account at any time. If you do this:":
      "Du kannst dein Konto jederzeit löschen. Wenn du das tust:",
    "Your profile will be removed.": "Dein Profil wird entfernt.",
    "Your work will disappear.": "Deine Arbeit verschwindet.",
    "Your tasks will be removed.": "Deine Aufgaben werden entfernt.",
    "Your workbooks will be removed.": "Deine Arbeitsbücher werden entfernt.",
    "Yes! Remove my account": "Ja! Konto löschen",
    // Display Settings popover
    "Display Settings": "Anzeigeeinstellungen",
    "Show Task Help panel": "Aufgabenhilfe anzeigen",
    "Show Your Progress panel": "Fortschritt anzeigen",
    "Show Task Timer": "Aufgaben-Timer anzeigen",
    "Show Your Writing panel": "Texte-Panel anzeigen",
    "Press Esc to close. Changes apply instantly.":
      "Drücke Esc zum Schließen. Änderungen wirken sofort.",
    // 404 / error
    "Page not found": "Seite nicht gefunden",
    "The page you're looking for doesn't exist or has been moved.":
      "Die gesuchte Seite existiert nicht oder wurde verschoben.",
    "Go home": "Zur Startseite",
    "This page didn't load": "Diese Seite konnte nicht geladen werden",
    "Something went wrong on our end. You can try refreshing or head back home.":
      "Bei uns ist etwas schiefgelaufen. Versuche es neu zu laden oder zurück zur Startseite.",
    "Try again": "Erneut versuchen",
  },
  fr: {
    // Sidebar
    "Welcome,": "Bienvenue,",
    "Sign out": "Se déconnecter",
    Workbooks: "Cahiers",
    "Test Zone": "Zone de tests",
    Settings: "Paramètres",
    "Help centre": "Centre d'aide",
    Language: "Langue",
    new: "nouv.",
    // Section labels
    Beginner: "Débutant",
    Intermediate: "Intermédiaire",
    Advanced: "Avancé",
    Business: "Affaires",
    "Just for Fun": "Pour le plaisir",
    "IELTS Academic": "IELTS Academic",
    "IELTS General Training": "IELTS General Training",
    "B2 First": "B2 First",
    // Auth
    there: "bienvenue",
    "Sign in": "Se connecter",
    "Sign up": "S'inscrire",
    "Create your account": "Créez votre compte",
    "Create account": "Créer un compte",
    "Welcome back. Sign in to continue.": "Bon retour. Connectez-vous pour continuer.",
    "Start practising in seconds.": "Commencez à pratiquer en quelques secondes.",
    "Continue with Google": "Continuer avec Google",
    or: "ou",
    Name: "Nom",
    "Your name": "Votre nom",
    "No account?": "Pas de compte ?",
    "Already have an account?": "Vous avez déjà un compte ?",
    "Back home": "Retour à l'accueil",
    // Workbook list
    "New tasks": "Nouvelles tâches",
    "Your Writing": "Vos écrits",
    "Your completed and in-progress tasks will appear here.":
      "Vos tâches terminées et en cours apparaîtront ici.",
    "Just now": "À l'instant",
    Yesterday: "Hier",
    "minute ago": "minute",
    "minutes ago": "minutes",
    "hour ago": "heure",
    "hours ago": "heures",
    "days ago": "jours",
    "month ago": "mois",
    "months ago": "mois",
    "year ago": "an",
    "years ago": "ans",
    // Task detail chrome
    "Back to": "Retour à",
    "Do not write your real name or email address in your answer.":
      "N'écrivez pas votre vrai nom ou adresse e-mail dans votre réponse.",
    "Write your text here.": "Écrivez votre texte ici.",
    "words entered (the word count for this task is about":
      "mots saisis (le nombre de mots pour cette tâche est d'environ",
    "words).": "mots).",
    Check: "Vérifier",
    "Checking…": "Vérification…",
    "Edit again": "Modifier à nouveau",
    "Task Help": "Aide pour la tâche",
    Images: "Images",
    Feedback: "Retour",
    Changes: "Modifications",
    "Your automatic feedback will appear here after we finish checking your work.":
      "Votre retour automatique apparaîtra ici après la vérification de votre travail.",
    "Task Timer": "Minuteur",
    "Start timer": "Démarrer",
    "Stop timer": "Arrêter",
    "Reset timer": "Réinitialiser",
    "Click on 'Start timer' to time your writing.":
      "Cliquez sur 'Démarrer' pour chronométrer votre écriture.",
    "Click on 'Stop timer' when you are ready to Check your writing.":
      "Cliquez sur 'Arrêter' lorsque vous êtes prêt à vérifier votre texte.",
    "You have used this much time:": "Temps écoulé :",
    "Your progress": "Vos progrès",
    Checks: "Vérif.",
    "Your progress graph will appear here after your first check.":
      "Votre graphique de progression apparaîtra ici après votre première vérification.",
    "This graph shows your CEFR level estimate for your last 10 checks.":
      "Ce graphique montre votre niveau CECR estimé pour vos 10 dernières vérifications.",
    "Correction Cards": "Cartes de correction",
    "Run a check to see detailed correction cards.":
      "Lancez une vérification pour voir les cartes de correction détaillées.",
    "Could not load correction cards. Please try again.":
      "Impossible de charger les cartes. Veuillez réessayer.",
    "No issues found. Great work!": "Aucun problème trouvé. Excellent travail !",
    "Most important": "Le plus important",
    "See rule →": "Voir la règle →",
    "Show suggestion ▾": "Afficher la suggestion ▾",
    "Hide suggestion ▴": "Masquer la suggestion ▴",
    "AI Chat": "Chat IA",
    Send: "Envoyer",
    "Ask about your writing…": "Posez une question sur votre écrit…",
    "Sorry, I couldn't reply just now. Please try again.":
      "Désolé, je n'ai pas pu répondre. Veuillez réessayer.",
    "Could not save": "Échec de l'enregistrement",
    "Unsaved changes": "Modifications non enregistrées",
    "Saving…": "Enregistrement…",
    Saved: "Enregistré",
    Level: "Niveau",
    "AI Feedback": "Retour IA",
    "Press Check to receive your writing assessment.":
      "Appuyez sur Vérifier pour recevoir votre évaluation.",
    "Could not generate AI feedback. Press Check to try again.":
      "Impossible de générer le retour IA. Appuyez sur Vérifier pour réessayer.",
    "What you are doing well": "Ce que vous faites bien",
    "What to prioritise": "À prioriser",
    "Next step": "Prochaine étape",
    "Keep editing and press Check again to improve your score.":
      "Continuez à modifier et appuyez à nouveau sur Vérifier pour améliorer votre score.",
    "Did you write about the task? (5 is best)":
      "Avez-vous écrit sur la tâche ? (5 est le meilleur)",
    "Scoring relevance…": "Évaluation de la pertinence…",
    "Could not score relevance.": "Impossible d'évaluer la pertinence.",
    "Checking your writing…": "Vérification de votre texte…",
    "Could not parse feedback. Please try again.":
      "Impossible de lire le retour. Veuillez réessayer.",
    issue: "problème",
    issues: "problèmes",
    "found:": "trouvés :",
    "No issues found. Well done.": "Aucun problème trouvé. Bravo.",
    "Rewrite Challenge": "Défi de réécriture",
    "Run a check to see your rewrite challenge.":
      "Lancez une vérification pour voir votre défi de réécriture.",
    "Before / After": "Avant / Après",
    "Run a check to see the before/after comparison.":
      "Lancez une vérification pour voir la comparaison avant/après.",
    "Inline Highlighting is disabled. Enable it in Settings.":
      "La mise en évidence est désactivée. Activez-la dans les Paramètres.",
    Grammar: "Grammaire",
    "Task not found.": "Tâche introuvable.",
    "Workbook not found.": "Cahier introuvable.",
    Back: "Retour",
    "Skip tutorial": "Ignorer le tutoriel",
    "Get started": "Commencer",
    Next: "Suivant",
    "Welcome to Writable": "Bienvenue sur Wrieable",
    "Show me around": "Faire la visite",
    "Skip to exercise": "Aller à l’exercice",
    Product: "Produit",
    Legal: "Mentions légales",
    "Privacy Policy": "Politique de confidentialité",
    "Terms of Service": "Conditions d’utilisation",
    "Cookie Policy": "Politique relative aux cookies",
    Contact: "Contact",
    "All rights reserved.": "Tous droits réservés.",
    Privacy: "Confidentialité",
    Terms: "Conditions",
    Cookies: "Cookies",
    "Not signed in": "Non connecté",
    Original: "Original",
    Corrected: "Corrigé",
    "No corrections available yet.": "Aucune correction disponible pour le moment.",
    "Try rewriting this phrase:": "Essayez de réécrire cette expression :",
    "Your rewrite": "Votre réécriture",
    "Suggested correction": "Correction suggérée",
    "No content.": "Aucun contenu.",
    "Your progress chart": "Votre graphique de progression",
    English: "Anglais",
    Spanish: "Espagnol",
    French: "Français",
    German: "Allemand",
    Russian: "Russe",
    Mandarin: "Mandarin",
    Style: "Style",
    Vocabulary: "Vocabulaire",
    "Practice a new language by writing with task-based exercises.":
      "Entraînez une nouvelle langue avec des exercices d’écriture guidés par tâches.",
    "Pick a writing task": "Choisissez une tâche d’écriture",
    "Browse workbooks by level or topic and choose a prompt that fits what you want to practice.":
      "Parcourez les cahiers par niveau ou sujet et choisissez une consigne adaptée à votre objectif.",
    "Write in the target language": "Écrivez dans la langue cible",
    "Type your response in the editor. Word count and prompt stay in view while you write.":
      "Saisissez votre réponse dans l’éditeur. Le nombre de mots et la consigne restent visibles.",
    "Get instant AI feedback": "Recevez un retour IA instantané",
    "Hit Check and receive corrections, explanations, and a relevance score for your text.":
      "Cliquez sur Vérifier pour recevoir des corrections, des explications et un score de pertinence.",
    "Learn from your mistakes": "Apprenez de vos erreurs",
    "Review correction cards, rewrite, and watch your writing improve over time.":
      "Consultez les cartes de correction, réécrivez et suivez vos progrès.",
    "Would you like a quick tour of how the app works, or jump straight into your first exercise?":
      "Voulez-vous une courte visite de l’application ou passer directement au premier exercice ?",
    "Close tutorial": "Fermer le tutoriel",
    "Requires Correction Cards.": "Nécessite les cartes de correction.",
    // Settings
    Account: "Compte",
    "First name": "Prénom",
    "Last name": "Nom",
    "What is your first language?": "Quelle est votre langue maternelle ?",
    "Which best describes you?": "Qu'est-ce qui vous décrit le mieux ?",
    "A learner of English": "Un apprenant d'anglais",
    "A teacher of English": "Un enseignant d'anglais",
    "A native English speaker": "Un anglophone natif",
    "What is your main reason for learning English?":
      "Quelle est votre principale raison d'apprendre l'anglais ?",
    "Save →": "Enregistrer →",
    Email: "E-mail",
    "Main email address": "Adresse principale",
    "Add a new email address": "Ajouter une nouvelle adresse e-mail",
    Add: "Ajouter",
    Plugins: "Plugins",
    "Enable or disable learning plugins. Changes apply instantly.":
      "Activez ou désactivez les plugins d'apprentissage. Les changements s'appliquent immédiatement.",
    Password: "Mot de passe",
    "Password now": "Mot de passe actuel",
    "New password": "Nouveau mot de passe",
    "Confirm password": "Confirmer le mot de passe",
    "at least 8 characters": "au moins 8 caractères",
    "Change password": "Changer le mot de passe",
    "Remove account": "Supprimer le compte",
    "You can remove your account at any time. If you do this:":
      "Vous pouvez supprimer votre compte à tout moment. Si vous le faites :",
    "Your profile will be removed.": "Votre profil sera supprimé.",
    "Your work will disappear.": "Votre travail disparaîtra.",
    "Your tasks will be removed.": "Vos tâches seront supprimées.",
    "Your workbooks will be removed.": "Vos cahiers seront supprimés.",
    "Yes! Remove my account": "Oui ! Supprimer mon compte",
    // Display Settings popover
    "Display Settings": "Paramètres d'affichage",
    "Show Task Help panel": "Afficher Aide pour la tâche",
    "Show Your Progress panel": "Afficher Vos progrès",
    "Show Task Timer": "Afficher le minuteur",
    "Show Your Writing panel": "Afficher Vos écrits",
    "Press Esc to close. Changes apply instantly.":
      "Appuyez sur Échap pour fermer. Les changements s'appliquent immédiatement.",
    // 404 / error
    "Page not found": "Page non trouvée",
    "The page you're looking for doesn't exist or has been moved.":
      "La page que vous cherchez n'existe pas ou a été déplacée.",
    "Go home": "Accueil",
    "This page didn't load": "Cette page ne s'est pas chargée",
    "Something went wrong on our end. You can try refreshing or head back home.":
      "Une erreur est survenue. Essayez de rafraîchir ou retournez à l'accueil.",
    "Try again": "Réessayer",
  },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (s: string) => string;
};

const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const v = localStorage.getItem(LANG_KEY) as Lang | null;
      if (v === "en" || v === "de" || v === "fr") setLangState(v);
    } catch {
      // ignore
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      // ignore
    }
  };

  const t = (s: string) => DICT[lang][s] ?? s;

  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

export function useT() {
  return useLang().t;
}
