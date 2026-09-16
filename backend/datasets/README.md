# DeepShield Datasets

This directory holds **operator-supplied** deepfake datasets. Nothing here is
downloaded automatically, nothing is generated, and nothing is committed to
Git (see `.gitignore`).

## Supported sources

| Source | Media | Label convention |
| --- | --- | --- |
| FaceForensics++ | video | `original_sequences` -> real, `manipulated_sequences/*` -> fake |
| Celeb-DF (v2) | video | `Celeb-real`, `YouTube-real` -> real, `Celeb-synthesis` -> fake |
| DFDC | video | `metadata.json` label REAL/FAKE |
| FakeAVCeleb | video | `RealVideo-RealAudio` -> real, `Fake*` -> fake |

Each dataset requires an accepted research licence. Obtain the data yourself
and copy it in.

## Expected structure

```
datasets/
  raw/
    real/<source>/<file>.mp4|jpg
    fake/<source>/<file>.mp4|jpg
  processed/
    real/  fake/            face crops written by the preprocessing pipeline
    manifest.jsonl          label + provenance + split for every crop
  train/       real/ fake/
  validation/  real/ fake/
  test/        real/ fake/
  dataset_statistics.json
  split_report.json
```

`<source>` should be one of `faceforensics`, `celebdf`, `dfdc`, `fakeavceleb`
so provenance is recorded; any other folder name is logged as `unspecified`.

## Workflow

```bash
cd backend
python -m scripts.dataset init         # create the skeleton
# copy licensed media into datasets/raw/real and datasets/raw/fake
python -m scripts.dataset preprocess   # face detection + crops + statistics
python -m scripts.dataset split        # leakage-safe split
python -m scripts.dataset status       # counts, class balance, readiness
python -m scripts.train --confirm      # explicit opt-in, never automatic
python -m scripts.evaluate             # isolated test split only
```

## Leakage policy

Splitting happens at **source level**: every crop derived from one image or
one video carries the same `source_id`, and a `source_id` is assigned to
exactly one split. `split_report.json` records the result and the leakage
check. The test split is written once and is never used for model selection —
training selects its best checkpoint on validation loss only.
