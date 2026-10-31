# Eleven Music — piano pilote RudyLadit

## Origine
Supabase CFO Marine : projet `fjpcuxsezeuajhlotzij`, clé existante `ELEVENLABS_API_KEY` employée dans les fonctions actives `cfo-elevenlabs-tts` et `cfo-elevenlabs-article`. Ne jamais modifier ces fonctions pour produire de la musique.

## Endpoint
Code source : `supabase/functions/cfo-elevenlabs-music-pilot/index.ts`.
Génération de 8 secondes de piano acoustique instrumental via `POST https://api.elevenlabs.io/v1/music`, modèle `music_v2_5`.
L'endpoint ne reçoit pas de prompt libre ; la durée est fixée pour contrôler le coût.
Déploiement avec `verify_jwt=true` ; ne jamais exposer de clé ElevenLabs dans GitHub, WordPress ou le navigateur.

## Prudence
Chaque appel POST qui aboutit consomme des crédits ElevenLabs. Ne pas ouvrir publiquement cette fonction ni la faire appeler automatiquement. Avant un usage répétitif, ajouter contrôle de rôle, limitation serveur des appels et journalisation. Prévoir un stockage privé des MP3 et un suivi des coûts.

## Direction artistique
0–8 piano mélodique; 8–16 violons; 16–24 violoncelle et contrebasse pizzicato; 24–26 silence; 26–31 batterie seule; 31–40 climax orchestre + guitare électrique.

La génération pilote n'atteste pas encore de la qualité sonore. Validation d'écoute requise avant de poursuivre.

Documentation : https://elevenlabs.io/docs/api-reference/music/compose
