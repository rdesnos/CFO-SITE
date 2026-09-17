# Pierre de Maere — catalogue audit

Date: 2026-09-17
Status: VALIDATED / FROZEN
Soundcharts artist UUID: `d2f3f360-8862-11e9-807e-801844edfa71`

## Materialization

- 37 Pierre de Maere-owned Soundcharts objects materialized in `acquisition.tracks`.
- Soundcharts ISRC and Spotify identifiers imported for all 37 objects.
- 34 objects included in CFO metrics; 3 secondary objects retained but deduplicated from CFO metrics.
- `Grand Soleil` is a collective Sidaction recording and is excluded from Pierre de Maere's individual catalogue scope; raw/shared object retained for traceability.

## Human arbitration

- `Je pense à vous`: `FR6F32600550` and `FR6F32600641` retained as two distinct masters pending no evidence of duplicate recording; both included.
- `Lolita`: `FR6F32102530` and `FR6F32102660` are distinct recordings/masters; both included.
- `These Walls (feat. Pierre de Maere)`: `GBAHT2400326`, `GB1302400895`, `GBAHT2400847` represent the same recording. Canonical CFO object: Soundcharts `de94100b-a62a-4edf-8bda-2f47ac697b7d`, ISRC `GBAHT2400847`. Other two objects retained as `include_dedup`, excluded from CFO metric summation.
- `Mercredi`: canonical master `FR6F32202680` / Soundcharts `685e913c-b9b3-4425-a23d-ecf2c7428f90`. Secondary object `FR6F32300170` / Soundcharts `42c1f76d-6a6f-4f4d-9cdd-86271a4e978f` retained as `include_dedup`, excluded from CFO metric summation.
- `Enfant de` `FR6F32202630` and `Enfant de (Enregistré à Paris)` `FR6F32300210`: distinct masters. The latter is the Deezer Sessions / Paris recording. Both included.

## Database freeze

Qualification result for Pierre de Maere-owned rows:
- 34 `include` / `include_in_cfo_metrics=true`
- 3 `include_dedup` / `include_in_cfo_metrics=false`

SNEP scope was not altered during this audit unless already established elsewhere; the catalogue audit controls CFO analytical inclusion and master deduplication.
