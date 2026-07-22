import io

from docx import Document
from pypdf import PdfReader


class UnsupportedFileType(Exception):
    """Raised for any file extension other than .txt/.docx/.pdf."""


class NoTextExtracted(Exception):
    """Raised when extraction succeeds mechanically but yields no usable text
    (empty file, scanned PDF with no text layer, blank docx)."""


def _extension(filename: str) -> str:
    if "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower()


def extract_text(filename: str, raw_bytes: bytes) -> str:
    """
    Extract raw text from an uploaded file's bytes, based on its extension.

    filename: the original filename (used only to read the extension).
    raw_bytes: the file's full contents.

    Raises UnsupportedFileType for anything other than .txt/.docx/.pdf
    (including legacy .doc -- not supported, see design non-goals).
    Raises NoTextExtracted if extraction produced no non-whitespace text.
    """
    ext = _extension(filename)

    if ext == "txt":
        text = raw_bytes.decode("utf-8-sig", errors="replace")
    elif ext == "docx":
        try:
            document = Document(io.BytesIO(raw_bytes))
        except Exception as exc:
            raise UnsupportedFileType(f"Could not read {filename} as a .docx file: {exc}") from exc
        text = "\n".join(paragraph.text for paragraph in document.paragraphs)
    elif ext == "pdf":
        try:
            reader = PdfReader(io.BytesIO(raw_bytes))
        except Exception as exc:
            raise UnsupportedFileType(f"Could not read {filename} as a .pdf file: {exc}") from exc
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    else:
        label = f".{ext}" if ext else "no extension"
        raise UnsupportedFileType(f"Unsupported file type ({label}) -- use .txt, .docx, or .pdf")

    text = text.strip()
    if not text:
        raise NoTextExtracted(f"No extractable text found in {filename}")
    return text
