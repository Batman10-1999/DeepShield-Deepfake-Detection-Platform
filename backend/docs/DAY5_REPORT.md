# DeepShield — Day 5 Engineering Report

Dataset readiness, backend reliability, regression protection.
All statements below reflect verified behaviour, not intent.

## 1. Binary decision output (REAL / FAKE only)

- `Verdict` is now `Literal["REAL", "FAKE"]`. `SUSPICIOUS` and
  `NEEDS_MANUAL_REVIEW` survive only as an internal `analytical_band`,
  never as a user-facing prediction.
- The user-facing call is a single configurable threshold:
  `fake_pct >= DECISION_BINARY_FAKE_PCT (50%) -> FAKE`, else `REAL`.
- Every decision carries `binary_decision_validated` and a
  `validation_note`. With no verified deepfake-trained checkpoint present,
  the note states plainly that the verdict is **not scientifically
  validated**.
- Video frame statistics now count analytical bands, not verdicts, so the
  binary change did not silently zero out the suspicious/manual-review
  counters.

## 2. Upload reliability (large files)

- `await file.read()` is gone from every endpoint (verified: 0 remaining
  occurrences).
- New `stream_upload_to_disk()` writes in bounded chunks, hashes while
  streaming, enforces the size limit **during** transfer, and deletes the
  partial file on any failure.
- Format/MIME are checked before a single byte is written
  (`validate_upload_envelope`), so unsupported uploads never touch disk.
- On-disk validators (`validate_image_path`, `validate_video_path`)
  replaced the in-memory byte validators.

## 3. Dataset readiness

- `ManifestRecord` now records the full provenance chain: `sample_id`,
  `timestamp_sec`, face box (`face_x/y/width/height`), `detector_score`
  and a `sha256` content hash, alongside the original fields. Legacy
  manifests still load (unknown/missing fields tolerated).
- Face extraction propagates the source-frame timestamp and the detected
  bounding box in source coordinates.
- Splitting stays source-level (no frames of one video across splits) and
  now additionally reports `duplicate_hashes_across_splits`: byte-identical
  crops that appear in two splits are flagged as leakage instead of being
  assumed away.
- Splits are reproducible for a fixed seed (test-verified).
- Statistics are counted from the manifest and from files on disk — no
  estimates.

## 4. Real bug found and fixed

Face detection silently failed whenever the installed OpenCV build shipped
without its bundled `cv2/data` cascade XML — every image request returned
`503 FACE_DETECTION_FAILED`. The detector now searches, in order: an
explicit `DEEPSHIELD_FACE_CASCADE` override, the OpenCV data directory, and
a **vendored copy at `weights/haarcascade_frontalface_default.xml`**.
Verified: detection loads and runs after the fix.

## 5. Regression protection

`backend/tests/` — 37 tests, all passing (`python -m pytest` from
`backend/`).

| Suite | Protects |
| --- | --- |
| `test_binary_decision.py` | Verdict can never become non-binary again; thresholds, clamping, honest validation flag |
| `test_upload_reliability.py` | Chunked streaming, 12 MB multi-chunk read, oversize rejection with no leftover file, cleanup, corrupt/empty detection |
| `test_dataset_integrity.py` | Manifest round-trip incl. provenance, legacy rows, source-level split, duplicate-hash leakage, seed reproducibility, counted statistics |
| `test_model_provenance.py` | Unverified checkpoints are never labelled deepfake-trained; verified checkpoints win; preprocessing contract exposed |
| `test_api_contract.py` | Live FastAPI: health + provenance, rejection paths, 413, end-to-end REAL/FAKE analysis of a real face photo, determinism |

## 6. Honest state of the model

- Running weights: ImageNet-pretrained EfficientNet-B0 backbone.
- **No deepfake-trained checkpoint exists in this repository.** Therefore
  every verdict — although binary and fully formed — is *not* a validated
  deepfake judgement. `/health` now returns the full provenance block so
  this cannot be misread from the outside.
- Confidence is the posterior probability of the predicted class; the
  calibration temperature is reported with its source and whether it was
  actually fitted on validation data.

## 7. Not done (deliberately)

- No training run was performed; no dataset is bundled (licensing).
- Day 6 work was not started.
