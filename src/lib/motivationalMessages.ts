export const motivationalMessages: string[] = [
  "You are building something real here. Every check brings you one step closer to fluency.",
  "This is good work — now push it further. Small improvements compound into big results.",
  "Writing in another language takes courage. You just showed it again.",
  "Progress is rarely loud, but it is happening on this page. Keep going.",
  "You wrote, you tried, you finished a draft. That alone puts you ahead of yesterday.",
  "Take a breath and read it back slowly. Your next edit is usually your best one.",
  "Mistakes are not setbacks here, they are signals. Use them and move forward.",
  "Steady effort beats perfect effort. You are showing up, and it counts.",
  "Your ideas are clearer than you think. Now sharpen the words around them.",
  "Trust the process — every sentence you revise teaches you something permanent.",
  "Focus on one improvement at a time. Stacking small wins is how fluency is built.",
  "You are not just writing, you are training your ear for the language. Keep listening.",
  "Good writers rewrite. The fact that you are checking means you are already one of them.",
  "Slow down on the parts that felt hard. That is exactly where the growth lives.",
  "You showed up and put words on the page. That is the whole battle, every time.",
  "Be patient with yourself, but never bored. There is always one more thing to refine.",
  "Your draft has bones. Now go back and give it muscle.",
  "Every careful edit is a small promise to your future self. Keep making them.",
  "You are closer than you were an hour ago. That is the only direction that matters.",
  "Confidence comes from reps, not from luck. You just did another rep.",
];

export const motivationalMessagesDe: string[] = [
  "Du baust hier etwas Echtes auf. Jede Prüfung bringt dich einen Schritt näher an Sprachgewandtheit.",
  "Das ist gute Arbeit — jetzt geh noch weiter. Kleine Verbesserungen summieren sich zu großen Ergebnissen.",
  "In einer anderen Sprache zu schreiben erfordert Mut. Du hast ihn gerade wieder gezeigt.",
  "Fortschritt ist selten laut, aber er passiert auf dieser Seite. Mach weiter.",
  "Du hast geschrieben, du hast es versucht, du hast einen Entwurf fertig. Das allein bringt dich weiter als gestern.",
  "Atme durch und lies langsam zurück. Deine nächste Bearbeitung ist meist deine beste.",
  "Fehler sind hier keine Rückschläge, sondern Signale. Nutze sie und geh weiter.",
  "Stetiger Einsatz schlägt perfekten Einsatz. Du bist hier, und das zählt.",
  "Deine Ideen sind klarer, als du denkst. Schärfe jetzt die Worte drumherum.",
  "Vertraue dem Prozess — jeder überarbeitete Satz lehrt dich etwas Dauerhaftes.",
  "Konzentriere dich auf eine Verbesserung nach der anderen. So entsteht Sprachgewandtheit.",
  "Du schreibst nicht nur — du trainierst dein Sprachgefühl. Hör weiter zu.",
  "Gute Schreiber schreiben neu. Dass du prüfst, macht dich schon zu einem von ihnen.",
  "Verlangsame bei den schweren Stellen. Genau dort liegt das Wachstum.",
  "Du hast dich hingesetzt und Worte auf die Seite gebracht. Das ist jedes Mal der ganze Kampf.",
  "Sei geduldig mit dir, aber nie gelangweilt. Es gibt immer noch etwas zu verfeinern.",
  "Dein Entwurf hat Knochen. Jetzt gib ihm Muskeln.",
  "Jede sorgfältige Bearbeitung ist ein kleines Versprechen an dein zukünftiges Ich. Halte es.",
  "Du bist näher als vor einer Stunde. Das ist die einzige Richtung, die zählt.",
  "Vertrauen kommt von Wiederholung, nicht von Glück. Du hast gerade wieder eine gemacht.",
];

export const motivationalMessagesFr: string[] = [
  "Vous construisez quelque chose de réel ici. Chaque vérification vous rapproche de la maîtrise.",
  "C'est du bon travail — maintenant, allez plus loin. Les petites améliorations s'accumulent.",
  "Écrire dans une autre langue demande du courage. Vous venez de le prouver à nouveau.",
  "Le progrès est rarement bruyant, mais il se passe sur cette page. Continuez.",
  "Vous avez écrit, essayé, terminé un brouillon. Cela seul vous met en avance sur hier.",
  "Respirez et relisez lentement. Votre prochaine modification est souvent la meilleure.",
  "Les erreurs ne sont pas des reculs ici, ce sont des signaux. Utilisez-les et avancez.",
  "L'effort régulier l'emporte sur l'effort parfait. Vous êtes là, et cela compte.",
  "Vos idées sont plus claires que vous ne le pensez. Affinez maintenant les mots qui les portent.",
  "Faites confiance au processus — chaque phrase révisée vous apprend quelque chose de durable.",
  "Concentrez-vous sur une amélioration à la fois. C'est ainsi qu'on bâtit la maîtrise.",
  "Vous n'écrivez pas seulement, vous entraînez votre oreille à la langue. Continuez à écouter.",
  "Les bons rédacteurs réécrivent. Le fait que vous vérifiiez fait déjà de vous l'un d'eux.",
  "Ralentissez sur les parties difficiles. C'est exactement là que se trouve la progression.",
  "Vous vous êtes présenté et avez mis des mots sur la page. C'est tout le combat, à chaque fois.",
  "Soyez patient avec vous-même, mais jamais ennuyé. Il y a toujours une chose à affiner.",
  "Votre brouillon a une charpente. Maintenant, donnez-lui du muscle.",
  "Chaque modification soigneuse est une petite promesse à votre futur vous. Tenez-la.",
  "Vous êtes plus près qu'il y a une heure. C'est la seule direction qui compte.",
  "La confiance vient de la répétition, pas de la chance. Vous venez d'en faire une de plus.",
];

export function getMotivationalMessages(lang: string): string[] {
  if (lang === "de") return motivationalMessagesDe;
  if (lang === "fr") return motivationalMessagesFr;
  return motivationalMessages;
}
