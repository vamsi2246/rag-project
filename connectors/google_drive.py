from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
SERVICE_ACCOUNT_FILE = 'service_account.json'  # put new key here


def get_drive_service():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    return build('drive', 'v3', credentials=creds)


def fetch_files():
    service = get_drive_service()

    results = service.files().list(
        pageSize=10,
        fields="files(id, name)"
    ).execute()

    return results.get('files', [])


def get_file_content(file_id):
    service = get_drive_service()

    request = service.files().get_media(fileId=file_id)
    return request.execute().decode('utf-8')