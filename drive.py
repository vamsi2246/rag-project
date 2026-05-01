"""
drive.py — Google Drive Integration
====================================
Connects to Google Drive via a service account, lists files in a
shared folder, and downloads their content (PDF, TXT, DOCX, Google Docs).
"""

import os
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload


# ──────────────────────────────────────────────
# Supported MIME types and their file extensions
# ──────────────────────────────────────────────
SUPPORTED_MIME_TYPES = [
    "application/pdf",                                                      # .pdf
    "text/plain",                                                           # .txt
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "application/vnd.google-apps.document",                                 # Google Docs
]

# Google Docs need to be "exported" (not downloaded), so we map them
EXPORT_MIME_MAP = {
    "application/vnd.google-apps.document": "text/plain",
}

# Drive API scope — read-only access
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


# ──────────────────────────────────────────────
# Authentication
# ──────────────────────────────────────────────
def get_drive_service():
    """
    Authenticate with Google Drive using a service account JSON key file.
    The path to the key file is read from the GOOGLE_APPLICATION_CREDENTIALS
    environment variable.

    Returns:
        googleapiclient.discovery.Resource: Authorized Drive API client.

    Raises:
        FileNotFoundError: If the credentials file does not exist.
        ValueError: If the environment variable is not set.
    """
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not creds_path:
        raise ValueError(
            "GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. "
            "Set it to the path of your service account JSON file."
        )

    if not os.path.exists(creds_path):
        raise FileNotFoundError(
            f"Service account file not found: {creds_path}"
        )

    creds = service_account.Credentials.from_service_account_file(
        creds_path, scopes=SCOPES
    )
    return build("drive", "v3", credentials=creds)


# ──────────────────────────────────────────────
# List files in a Drive folder
# ──────────────────────────────────────────────
def list_drive_files(folder_id: str) -> list[dict]:
    """
    List all supported files inside a Google Drive folder.

    Args:
        folder_id: The ID of the Drive folder (from the URL).

    Returns:
        A list of dicts, each with keys: id, name, mimeType.
    """
    service = get_drive_service()

    # Build a query that matches any of our supported MIME types
    mime_queries = " or ".join(
        f"mimeType='{mime}'" for mime in SUPPORTED_MIME_TYPES
    )
    query = f"'{folder_id}' in parents and ({mime_queries}) and trashed=false"

    all_files = []
    page_token = None

    # Paginate through results (Drive returns max 100 per page by default)
    while True:
        response = service.files().list(
            q=query,
            fields="nextPageToken, files(id, name, mimeType)",
            pageSize=100,
            pageToken=page_token,
        ).execute()

        all_files.extend(response.get("files", []))
        page_token = response.get("nextPageToken")

        if not page_token:
            break

    return all_files


# ──────────────────────────────────────────────
# Download a single file
# ──────────────────────────────────────────────
def download_file(service, file_id: str, file_name: str, mime_type: str) -> bytes:
    """
    Download (or export) a single file from Google Drive.

    - Regular files (PDF, TXT, DOCX): downloaded directly.
    - Google Docs: exported as plain text.

    Args:
        service: Authorized Drive API client.
        file_id: The file's Drive ID.
        file_name: The file's name (for logging).
        mime_type: The file's MIME type.

    Returns:
        The file content as bytes.
    """
    buffer = io.BytesIO()

    if mime_type in EXPORT_MIME_MAP:
        # Google Docs — export as plain text
        export_mime = EXPORT_MIME_MAP[mime_type]
        request = service.files().export_media(
            fileId=file_id, mimeType=export_mime
        )
    else:
        # Regular files — direct download
        request = service.files().get_media(fileId=file_id)

    # Stream the download in chunks (handles large files)
    downloader = MediaIoBaseDownload(buffer, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()

    print(f"  ✓ Downloaded: {file_name} ({mime_type})")
    return buffer.getvalue()


# ──────────────────────────────────────────────
# Fetch all files from a folder
# ──────────────────────────────────────────────
def fetch_all_files(folder_id: str) -> list[tuple[str, bytes, str]]:
    """
    List and download all supported files from a Google Drive folder.

    Args:
        folder_id: The ID of the Drive folder.

    Returns:
        A list of tuples: (filename, content_bytes, mime_type).
        Returns an empty list if no files are found.

    Raises:
        Exception: If authentication or API calls fail.
    """
    print(f"\n📂 Fetching files from Drive folder: {folder_id}")

    # Step 1: List files
    files = list_drive_files(folder_id)
    if not files:
        print("  ⚠ No supported files found in the folder.")
        return []

    print(f"  Found {len(files)} file(s)")

    # Step 2: Download each file
    service = get_drive_service()
    downloaded = []

    for file_info in files:
        try:
            content = download_file(
                service,
                file_info["id"],
                file_info["name"],
                file_info["mimeType"],
            )
            downloaded.append((file_info["name"], content, file_info["mimeType"]))
        except Exception as e:
            # Log the error but continue with other files
            print(f"  ✗ Failed to download {file_info['name']}: {e}")

    print(f"  ✅ Successfully downloaded {len(downloaded)}/{len(files)} file(s)\n")
    return downloaded
