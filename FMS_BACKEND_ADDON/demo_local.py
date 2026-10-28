"""Local demo only: SQLite identity store. NOT bank production authorization."""
import json
import sqlite3
from pathlib import Path
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from app.core.gpu import run_on_gpu
from app.utils.image_decode import decode_bytes_to_bgr
from app.utils.embed_faces import embed
from app.utils.ensure_live_face import ensure_live_face
from app.services.match_embed_img import _match_sync

router = APIRouter(prefix="/demo", tags=["Local FaceTrust Integration"])
DB = Path(__file__).resolve().parents[2] / "facetrust_local_demo.sqlite3"
MAX_IMAGE_BYTES = 5 * 1024 * 1024

def connect():
    con = sqlite3.connect(DB, timeout=10)
    con.execute("CREATE TABLE IF NOT EXISTS subjects (kind TEXT NOT NULL, subject_id TEXT NOT NULL, name TEXT NOT NULL, branch TEXT NOT NULL, embedding TEXT NOT NULL, PRIMARY KEY(kind, subject_id))")
    con.execute("CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, subject_id TEXT NOT NULL, action TEXT NOT NULL, at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
    return con

async def read_image(image):
    raw=await image.read(MAX_IMAGE_BYTES+1)
    if not raw or len(raw)>MAX_IMAGE_BYTES:
        raise HTTPException(400, "Image is empty or larger than 5 MB")
    return raw

def generate(raw):
    img=decode_bytes_to_bgr(raw)
    # This demo enrollment does not claim liveness; uploaded files are allowed.
    return embed(img,1)[0].tolist()

@router.post('/enroll')
async def enroll(kind: str=Form(...), subject_id: str=Form(...), name: str=Form(...), branch: str=Form(...), image: UploadFile=File(...)):
    if kind not in ('customer','employee'):raise HTTPException(400,'Invalid kind')
    subject_id=subject_id.strip();name=name.strip();branch=branch.strip()
    if not subject_id or not name or not branch or len(subject_id)>100:raise HTTPException(400,'Invalid profile fields')
    raw=await read_image(image)
    vector=await run_on_gpu(generate,raw)
    with connect() as con:
        if con.execute('SELECT 1 FROM subjects WHERE kind=? AND subject_id=?',(kind,subject_id)).fetchone():
            raise HTTPException(409,'ID already enrolled; use another ID')
        con.execute('INSERT INTO subjects(kind,subject_id,name,branch,embedding) VALUES(?,?,?,?,?)',(kind,subject_id,name,branch,json.dumps(vector)))
    return {'saved':True,'kind':kind,'subject_id':subject_id,'embedding_dimensions':len(vector),'mode':'LOCAL_DEMO'}

@router.post('/verify')
async def verify(kind: str=Form(...), subject_id: str=Form(...), image: UploadFile=File(...), threshold: float=Form(0.5), check_liveness: bool=Form(False), action: str=Form('check-in')):
    if kind not in ('customer','employee'):raise HTTPException(400,'Invalid kind')
    if not 0.0 < threshold < 1.0:raise HTTPException(400,'Invalid threshold')
    subject_id=subject_id.strip()
    with connect() as con:
        row=con.execute('SELECT name,embedding FROM subjects WHERE kind=? AND subject_id=?',(kind,subject_id)).fetchone()
    if row is None:raise HTTPException(404,'ID not enrolled; enroll first')
    raw=await read_image(image)
    result=await run_on_gpu(_match_sync,raw,row[1],threshold,check_liveness)
    if kind=='employee' and result['verified']:
        if action not in ('check-in','check-out'):raise HTTPException(400,'Invalid attendance action')
        with connect() as con:
            con.execute('INSERT INTO attendance(subject_id,action) VALUES(?,?)',(subject_id,action))
    return {**result,'kind':kind,'subject_id':subject_id,'name':row[0],'mode':'LOCAL_DEMO','attendance_saved':kind=='employee' and result['verified']}

@router.get('/attendance')
def attendance():
    with connect() as con:
        rows=con.execute('SELECT a.subject_id,s.name,a.action,a.at FROM attendance a LEFT JOIN subjects s ON s.subject_id=a.subject_id AND s.kind="employee" ORDER BY a.id DESC LIMIT 500').fetchall()
    return [{'id':r[0],'name':r[1],'action':r[2],'at':r[3]} for r in rows]
