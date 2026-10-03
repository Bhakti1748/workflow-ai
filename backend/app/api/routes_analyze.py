from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.app.schemas.extraction import AnalyzeRequest, ExtractionResult
from backend.app.services.file_parser import extract_text_from_file
from backend.app.ai.gemini_service import extract_tasks_with_gemini

router = APIRouter(prefix="/api", tags=["Analysis & Ingestion"])

@router.post("/analyze", response_model=ExtractionResult)
def analyze_text(payload: AnalyzeRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    try:
        result = extract_tasks_with_gemini(payload.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    auto_analyze: bool = Form(True)
):
    try:
        content_bytes = await file.read()
        extracted_text = extract_text_from_file(file.filename, content_bytes)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract readable text from document. Ensure it's not a scanned image PDF.")

        if auto_analyze:
            extraction_result = extract_tasks_with_gemini(extracted_text)
            return {
                "filename": file.filename,
                "extracted_text": extracted_text,
                "analysis": extraction_result
            }
        else:
            return {
                "filename": file.filename,
                "extracted_text": extracted_text
            }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document upload processing failed: {str(e)}")
