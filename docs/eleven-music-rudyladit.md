# Eleven Music — pilote RudyLadit

Fonction isolée : `supabase/functions/cfo-elevenlabs-music-pilot/index.ts`.
Projet Supabase : `fjpcuxsezeuajhlotzij`.

## API vérifiée

POST https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192
Modèle `music_v2_5`, `music_length_ms: 8000`, `force_instrumental: true`.
Prompt fixe de piano acoustique mélodique et expressif, sans instrument additionnel.
Source : https://elevenlabs.io/docs/api-reference/music/compose

## Sécurité et exécution

Déployer uniquement cette fonction avec `verify_jwt=true`. Le handler exige aussi une égalité avec le secret serveur `SUPABASE_SERVICE_ROLE_KEY` ; les clés publiques et les JWT utilisateur ordinaires ne suffisent pas. Ne jamais désactiver les contrôles pour invoquer ce pilote.

Le bucket dédié `rudyladit-music-pilot` est privé. Une réservation atomique persistante, créée sans upsert avant l'appel ElevenLabs, limite ce pilote à une tentative totale. Le verrou est conservé après toute erreur ou délai d'attente pour éviter une double facturation. Ne pas supprimer le verrou pour réessayer sans vérification et nouvelle autorisation.

Si le MP3 existe, un nouvel appel administrateur renvoie un lien signé valable sept jours sans nouvelle génération. Le lien signé est un accès temporaire au fichier : ne pas le versionner. Aucun secret n'est retourné ni journalisé. Aucun prompt ni durée du client n'est utilisé.

## État du 31 octobre 2026

Fonction déployée ACTIVE, version 1, JWT activé. Les 44 fonctions préexistantes sont inchangées (identifiants, versions et empreintes comparés).

Tests locaux : `node supabase/functions/cfo-elevenlabs-music-pilot/check.mjs` avec Node 24, tous les appels fournisseur simulés. Tests réussis : autorisation, paramètres fixes, cache, erreurs expurgées et verrou concurrent/persistant.

**Aucun MP3 produit, aucun appel ElevenLabs lancé.** Le contrôle automatique a refusé l'action « Add secret key » dans le formulaire de test du tableau de bord Supabase, car cet usage du secret privilégié dans le navigateur exige une autorisation spécifique ; il a également relevé la compatibilité JWT à vérifier. Aucun contournement ni désactivation des protections n'a été effectué. La disponibilité musicale effective de la clé reste donc non testée.

Résultat structuré : `docs/results/eleven-music-pilot-2026-10-31.json`.
