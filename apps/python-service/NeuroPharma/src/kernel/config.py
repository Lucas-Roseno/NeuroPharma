import os
from pathlib import Path

# This dynamically calculates the absolute path to the NeuroPharma root directory.
# Since this file is located at apps/python-service/NeuroPharma/src/kernel/config.py
# The parent path resolution is as follows:
#   parent 1: kernel
#   parent 2: src
#   parent 3: NeuroPharma
NEUROPHARMA_ROOT = str(Path(__file__).resolve().parent.parent.parent) + "/"

# Historically, NeuroPharma represented package-relative directories with a
# leading slash (for example ``/datasets/PDB``).  A leading slash normally means
# an operating-system absolute path, which became ambiguous once users could
# choose a real absolute workspace path.  Keep the legacy virtual roots working
# while preserving genuine absolute paths such as /home/... and /tmp/....
LEGACY_VIRTUAL_ROOTS = frozenset({
    "apps",
    "datasets",
    "logs",
    "resultados",
    "src",
})


def resolve_neuropharma_path(path: str | os.PathLike | None) -> str:
    """Resolve a NeuroPharma directory and always return a trailing slash.

    - ``/datasets/...`` and other historical virtual roots are relative to
      ``NEUROPHARMA_ROOT``.
    - Genuine absolute paths remain absolute.
    - Relative paths are resolved below ``NEUROPHARMA_ROOT``.
    """
    if path is None or str(path).strip() == "":
        resolved = Path(NEUROPHARMA_ROOT)
    else:
        raw = Path(path).expanduser()
        parts = raw.parts
        is_legacy_virtual = raw.is_absolute() and len(parts) > 1 and parts[1] in LEGACY_VIRTUAL_ROOTS

        if raw.is_absolute() and not is_legacy_virtual:
            resolved = raw
        else:
            relative = str(raw).lstrip("/\\")
            resolved = Path(NEUROPHARMA_ROOT) / relative

    return os.path.join(str(resolved.resolve(strict=False)), "")
