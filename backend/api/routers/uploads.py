from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from backend.services.file_service import save_upload, delete_upload

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/")
async def upload_files(files: List[UploadFile] = File(...)):
    results = []
    for file in files:
        try:
            meta = await save_upload(file)
            results.append(meta)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    return {"files": results}


@router.delete("/")
async def delete_file(path: str):
    delete_upload(path)
    return {"message": "Deleted"}
