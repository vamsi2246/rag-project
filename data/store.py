def load_text(path=None):
    from pathlib import Path

    # Allow explicit path
    if path:
        p = Path(path)
        if p.exists():
            return p.read_text(encoding="utf-8")
        raise FileNotFoundError(f"File not found: {p}")

    # Search common locations: data/sample.txt and project root/sample.txt
    here = Path(__file__).resolve().parent
    candidates = [here / "sample.txt", here.parent / "sample.txt"]
    for c in candidates:
        if c.exists():
            return c.read_text(encoding="utf-8")

    # Not found — create a sample file in project root for convenience
    target = here.parent / "sample.txt"
    content = "This is a sample document. Replace this text with your own content.\n"
    try:
        target.write_text(content, encoding="utf-8")
        print(f"Created sample file at {target}")
        return content
    except Exception as e:
        raise FileNotFoundError(
            "sample.txt not found in expected locations and could not be created; "
            "create a file named 'sample.txt' in the project root or data folder"
        ) from e