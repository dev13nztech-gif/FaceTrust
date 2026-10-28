"""Local-only FaceTrust demo with Supabase storage. Do not expose to untrusted networks."""
import os
from functools import lru_cache
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from supabase import create_client
from app.core.gpu import run_on_gpu
from app.utils.image_decode import decode_bytes_to_bgr
from app.utils.embed_faces import embed
from app.services.match_embed_img import _match_sync

router = APIRouter(prefix="/demo", tags=["FaceTrust Supabase Integration"])
MAX_IMAGE_BYTES = 5 * 1024 * 1024

@lru_cache(maxsize=1)
def db():
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SECRET_KEY", "").strip()
    if not url or not key:
        raise HTTPException(503, "Set SUPABASE_URL and SUPABASE_SECRET_KEY in backend .env")
    return create_client(url, key)

async def read_image(image):
    raw = await image.read(MAX_IMAGE_BYTES + 1)
    if not raw or len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(400, "Image is empty or larger than 5 MB")
    return raw

def generate(raw):
    img = decode_bytes_to_bgr(raw)
    return embed(img, 1)[0].tolist()

@router.get("/db-status")
def db_status():
    try:
        db().table("fms_enrollments").select("id").limit(1).execute()
        return {"connected": True, "database": "Supabase", "table": "fms_enrollments"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(503, "Supabase connection or table permission failed; check backend logs")

@router.post("/enroll")
async def enroll(kind: str=Form(...), subject_id: str=Form(...), name: str=Form(...), branch: str=Form(...), image: UploadFile=File(...)):
    if kind not in ("customer", "employee"):
        raise HTTPException(400, "Invalid kind")
    subject_id, name, branch = subject_id.strip(), name.strip(), branch.strip()
    if not subject_id or not name or not branch or len(subject_id)>100:
        raise HTTPException(400, "Invalid profile fields")
    vector = await run_on_gpu(generate, await read_image(image))
    payload = {"person_type": kind, "person_id": subject_id, "full_name": name, "branch": branch,
               "face_embedding": "[" + ",".join(str(float(x)) for x in vector) + "]", "model_name": "buffalo_l"}
    try:
        exists = db().table("fms_enrollments").select("id").eq("person_type",kind).eq("person_id",subject_id).limit(1).execute().data
        if exists:
            raise HTTPException(409, "ID already enrolled")
        db().table("fms_enrollments").insert(payload).execute()
    except HTTPException:
        raise
    except Exception as exc:
        # Avoid returning database credentials or internal exception detail.
        raise HTTPException(503, "Supabase enrollment failed; check backend logs") from exc
    return {"saved": True, "kind": kind, "subject_id": subject_id, "embedding_dimensions": len(vector), "storage": "SUPABASE"}

@router.post("/verify")
async def verify(kind: str=Form(...), subject_id: str=Form(...), image: UploadFile=File(...), threshold: float=Form(0.5), check_liveness: bool=Form(False), action: str=Form("check-in")):
    if kind not in ("customer", "employee"):
        raise HTTPException(400, "Invalid kind")
    if not 0.0 < threshold < 1.0:
        raise HTTPException(400, "Invalid threshold")
    if action not in ("check-in", "check-out"):
        raise HTTPException(400, "Invalid attendance action")
    try:
        rows = db().table("fms_enrollments").select("full_name,face_embedding").eq("person_type",kind).eq("person_id",subject_id.strip()).limit(1).execute().data
    except Exception as exc:
        raise HTTPException(503, "Supabase lookup failed; check backend logs") from exc
    if not rows:
        raise HTTPException(404, "ID not enrolled; enroll first")
    result = await run_on_gpu(_match_sync, await read_image(image), rows[0]["face_embedding"], threshold, check_liveness)
    saved = False
    if kind == "employee" and result["verified"]:
        try:
            db().table("fms_attendance").insert({"employee_id":subject_id.strip(),"event_type":action,"similarity":result["similarity"]}).execute()
            saved = True
        except Exception as exc:
            raise HTTPException(503, "Matching passed but attendance save failed; check backend logs") from exc
    return {**result, "kind":kind, "subject_id":subject_id.strip(), "name":rows[0]["full_name"], "storage":"SUPABASE", "attendance_saved":saved}

@router.get("/attendance")
def attendance():
    try:
        data = db().table("fms_attendance").select("employee_id,event_type,created_at,similarity").order("created_at",desc=True).limit(500).execute().data
        return [{"id":r["employee_id"],"action":r["event_type"],"at":r["created_at"],"similarity":r["similarity"]} for r in data]
    except Exception as exc:
        raise HTTPException(503, "Supabase attendance query failed; check backend logs") from exc
