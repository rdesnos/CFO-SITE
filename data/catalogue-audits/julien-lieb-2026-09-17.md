# Julien Lieb — catalogue audit

Date: 2026-09-17
Status: VALIDATED / FROZEN
Soundcharts artist UUID: `0f0839b6-5e44-4382-9e6f-bcce5f442eab`

## CFO rules validated

- Soundcharts raw scope: 22 objects.
- 21 Julien Lieb track objects materialized in `acquisition.tracks`.
- `Les p'tits soleils` is a shared Soundcharts object already materialized under Héléna; excluded from individual Julien/Héléna metrics because it is a collective charity recording.
- Multi-release Spotify identifiers do not create additional masters when the ISRC/recording is identical.
- `Encore une fois`: original 31 May 2024 release and Sony/Twin/TGIT reissue are the same recording. Canonical master: ISRC `FRDBD2400081`; the Soundcharts object without ISRC is `include_dedup` and excluded from CFO/SNEP aggregation.
- `Encore une fois (Wolfgvng Rework)`: distinct master, ISRC `FRDBD2400290`, included.
- `Comme tout le monde (Julien)`: individual Star Academy performance, ISRC `FRZ052400077`, included (same rule as Héléna / `Aimée pour de vrai`).
- `Dis-moi où (feat. OTTA)` `FRDBD2500050`, `Questions (feat. marilou)` `FRDBD2500100`, `Ça va (quand même) (feat. Soprano)` `FRDBD2500070`, `Autrement` `FRDBD2500010`, `L'horloge brûle` `FRDBD2500030`, `BPM` `FRDBD2500020`, and `Le jeu` `FRDBD2400300`: validated as one master each despite multiple commercial releases / Spotify IDs.

## Database freeze

For Julien Lieb-owned rows: 20 `include` + 1 `include_dedup`. The deduplicated object is excluded from CFO and SNEP aggregation. The shared `Les p'tits soleils` object is `exclude_non_scope` and excluded from metrics.
