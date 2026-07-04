"""
Ru'ya Business OS Module — Sprint 5 (Round 1)

Contains: Workspaces + RBAC + Events + CRM (Contacts, Pipelines, Deals, Invoices).

Design notes:
- Every business resource has `workspace_id` for multi-tenancy.
- RBAC via `require(user, workspace_id, permission)`.
- Events published to `db.events` collection for future Automation/Analytics.
- Personal workspace is auto-created for every user (migration + signup hook).
- All routes mounted under /api/business.
"""
from fastapi import APIRouter, HTTPException, Depends, Header, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
import jwt
import os
import logging

logger = logging.getLogger(__name__)

# ==================== SHARED HELPERS ====================
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def new_id() -> str:
    return str(uuid.uuid4())

# db handle injected by server.py at import time
_db: Optional[AsyncIOMotorDatabase] = None

def bind_db(db: AsyncIOMotorDatabase):
    global _db
    _db = db

def db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("business_os db not bound. Call bind_db(db) first.")
    return _db


# ==================== AUTH DEPENDENCY ====================
security = HTTPBearer(auto_error=False)

def _jwt_secret() -> str:
    return os.environ.get('JWT_SECRET', 'change-me')

async def current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(401, "غير مسجل الدخول")
    try:
        payload = jwt.decode(credentials.credentials, _jwt_secret(), algorithms=["HS256"])
        user = await db().users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(401, "المستخدم غير موجود")
        return user
    except jwt.PyJWTError:
        raise HTTPException(401, "توكن غير صالح")


# ==================== RBAC ====================
# Roles within a workspace
ROLES = ["owner", "admin", "manager", "member", "client", "guest"]

# Permission → allowed roles
PERMISSIONS: Dict[str, List[str]] = {
    # Workspace
    "workspace.view": ["owner", "admin", "manager", "member", "client", "guest"],
    "workspace.edit": ["owner", "admin"],
    "workspace.delete": ["owner"],
    "workspace.member.add": ["owner", "admin"],
    "workspace.member.remove": ["owner", "admin"],
    "workspace.member.role.change": ["owner"],
    # CRM contacts
    "crm.contact.view": ["owner", "admin", "manager", "member"],
    "crm.contact.create": ["owner", "admin", "manager", "member"],
    "crm.contact.edit": ["owner", "admin", "manager", "member"],
    "crm.contact.delete": ["owner", "admin", "manager"],
    # CRM pipelines
    "crm.pipeline.view": ["owner", "admin", "manager", "member"],
    "crm.pipeline.create": ["owner", "admin", "manager"],
    "crm.pipeline.edit": ["owner", "admin", "manager"],
    "crm.pipeline.delete": ["owner", "admin"],
    # CRM deals
    "crm.deal.view": ["owner", "admin", "manager", "member"],
    "crm.deal.create": ["owner", "admin", "manager", "member"],
    "crm.deal.edit": ["owner", "admin", "manager", "member"],
    "crm.deal.delete": ["owner", "admin", "manager"],
    # CRM invoices
    "crm.invoice.view": ["owner", "admin", "manager", "member"],
    "crm.invoice.create": ["owner", "admin", "manager"],
    "crm.invoice.edit": ["owner", "admin", "manager"],
    "crm.invoice.mark_paid": ["owner", "admin", "manager"],
    "crm.invoice.delete": ["owner", "admin"],
}

async def get_member_role(workspace_id: str, user_id: str) -> Optional[str]:
    m = await db().workspace_members.find_one(
        {"workspace_id": workspace_id, "user_id": user_id}
    )
    return m["role"] if m else None

async def require(user: dict, workspace_id: str, permission: str) -> str:
    if not workspace_id:
        raise HTTPException(400, "workspace_id مطلوب")
    ws = await db().workspaces.find_one({"id": workspace_id})
    if not ws:
        raise HTTPException(404, "الـ Workspace غير موجود")
    role = await get_member_role(workspace_id, user["id"])
    if not role:
        raise HTTPException(403, "لست عضواً في هذا الـ Workspace")
    allowed = PERMISSIONS.get(permission)
    if allowed is None:
        raise HTTPException(500, f"صلاحية غير معرّفة: {permission}")
    if role not in allowed:
        raise HTTPException(403, f"لا تملك صلاحية: {permission}")
    return role


async def get_workspace_id(
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    user: dict = Depends(current_user),
) -> str:
    """Resolve workspace from header. Falls back to user's personal workspace."""
    if x_workspace_id:
        return x_workspace_id
    # Fallback: personal workspace
    ws = await db().workspaces.find_one({"owner_id": user["id"], "kind": "personal"})
    if not ws:
        raise HTTPException(400, "لا يوجد workspace محدد")
    return ws["id"]


# ==================== EVENTS BUS ====================
async def emit_event(
    workspace_id: str,
    actor_id: str,
    event_type: str,
    payload: Optional[Dict[str, Any]] = None,
):
    """Publish an event to db.events. Automation/Analytics consume this later."""
    try:
        await db().events.insert_one({
            "id": new_id(),
            "workspace_id": workspace_id,
            "actor_id": actor_id,
            "type": event_type,
            "payload": payload or {},
            "created_at": now_iso(),
        })
    except Exception as e:
        logger.error(f"emit_event failed: {e}")


# ==================== MODELS ====================
# Workspace
class WorkspaceCreate(BaseModel):
    name: str
    kind: str = "personal"  # personal | agency | company | community
    slug: Optional[str] = None

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    kind: Optional[str] = None

class MemberAdd(BaseModel):
    username: str
    role: str = "member"

class MemberRoleUpdate(BaseModel):
    role: str

# CRM
class ContactCreate(BaseModel):
    name: str
    kind: str = "lead"  # lead | customer | partner
    email: Optional[EmailStr] = None
    phone: Optional[str] = ""
    company: Optional[str] = ""
    source: Optional[str] = ""
    tags: List[str] = []
    notes: Optional[str] = ""
    score: Optional[int] = 0

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    kind: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    source: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    score: Optional[int] = None
    owner_id: Optional[str] = None

class PipelineStage(BaseModel):
    id: str
    name: str
    order: int
    probability: int = 50  # win probability %

class PipelineCreate(BaseModel):
    name: str
    stages: Optional[List[Dict[str, Any]]] = None  # if None, default stages

class PipelineUpdate(BaseModel):
    name: Optional[str] = None
    stages: Optional[List[Dict[str, Any]]] = None

class DealCreate(BaseModel):
    title: str
    contact_id: str
    pipeline_id: str
    stage_id: str
    value: float = 0
    currency: str = "USD"
    expected_close: Optional[str] = None
    notes: Optional[str] = ""

class DealUpdate(BaseModel):
    title: Optional[str] = None
    stage_id: Optional[str] = None
    value: Optional[float] = None
    currency: Optional[str] = None
    expected_close: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None  # open | won | lost

class InvoiceItem(BaseModel):
    description: str
    quantity: float = 1
    unit_price: float = 0

class InvoiceCreate(BaseModel):
    contact_id: str
    deal_id: Optional[str] = None
    items: List[InvoiceItem]
    tax_percent: float = 0
    currency: str = "USD"
    due_at: Optional[str] = None
    notes: Optional[str] = ""

class InvoiceUpdate(BaseModel):
    items: Optional[List[InvoiceItem]] = None
    tax_percent: Optional[float] = None
    due_at: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


# ==================== DEFAULT PIPELINE ====================
DEFAULT_PIPELINE_STAGES = [
    {"id": "lead", "name": "عميل محتمل", "order": 1, "probability": 10},
    {"id": "qualified", "name": "مؤهّل", "order": 2, "probability": 25},
    {"id": "proposal", "name": "عرض سعر", "order": 3, "probability": 50},
    {"id": "negotiation", "name": "تفاوض", "order": 4, "probability": 75},
    {"id": "won", "name": "مكتمل", "order": 5, "probability": 100},
    {"id": "lost", "name": "مفقود", "order": 6, "probability": 0},
]


# ==================== ROUTER ====================
router = APIRouter(prefix="/api/business", tags=["business_os"])


# ---------- Workspaces ----------
@router.post("/workspaces")
async def create_workspace(data: WorkspaceCreate, user=Depends(current_user)):
    slug = data.slug or f"{data.kind}-{user['username']}-{uuid.uuid4().hex[:6]}"
    if await db().workspaces.find_one({"slug": slug}):
        raise HTTPException(400, "الاسم المختصر مستخدم")
    ws_id = new_id()
    ws = {
        "id": ws_id, "slug": slug, "name": data.name,
        "kind": data.kind, "owner_id": user["id"], "plan": "free",
        "created_at": now_iso(),
    }
    await db().workspaces.insert_one(ws)
    await db().workspace_members.insert_one({
        "id": new_id(), "workspace_id": ws_id, "user_id": user["id"],
        "role": "owner", "joined_at": now_iso(),
    })
    # Seed default pipeline
    await db().crm_pipelines.insert_one({
        "id": new_id(), "workspace_id": ws_id,
        "name": "المسار الافتراضي", "stages": DEFAULT_PIPELINE_STAGES,
        "is_default": True, "created_at": now_iso(),
    })
    await emit_event(ws_id, user["id"], "workspace.created", {"kind": data.kind})
    ws.pop("_id", None)
    ws["role"] = "owner"
    return ws


@router.get("/workspaces/my")
async def my_workspaces(user=Depends(current_user)):
    members = await db().workspace_members.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).to_list(200)
    result = []
    for m in members:
        ws = await db().workspaces.find_one({"id": m["workspace_id"]}, {"_id": 0})
        if ws:
            ws["role"] = m["role"]
            result.append(ws)
    # sort personal first, then created_at desc
    result.sort(key=lambda w: (0 if w.get("kind") == "personal" else 1, w.get("created_at", "")), reverse=False)
    return result


@router.get("/workspaces/{ws_id}")
async def get_workspace(ws_id: str, user=Depends(current_user)):
    await require(user, ws_id, "workspace.view")
    ws = await db().workspaces.find_one({"id": ws_id}, {"_id": 0})
    if not ws:
        raise HTTPException(404, "غير موجود")
    role = await get_member_role(ws_id, user["id"])
    ws["role"] = role
    ws["members_count"] = await db().workspace_members.count_documents({"workspace_id": ws_id})
    return ws


@router.put("/workspaces/{ws_id}")
async def update_workspace(ws_id: str, data: WorkspaceUpdate, user=Depends(current_user)):
    await require(user, ws_id, "workspace.edit")
    update = {k: v for k, v in data.dict().items() if v is not None}
    if update:
        await db().workspaces.update_one({"id": ws_id}, {"$set": update})
    await emit_event(ws_id, user["id"], "workspace.updated", update)
    return await db().workspaces.find_one({"id": ws_id}, {"_id": 0})


@router.get("/workspaces/{ws_id}/members")
async def list_members(ws_id: str, user=Depends(current_user)):
    await require(user, ws_id, "workspace.view")
    members = await db().workspace_members.find({"workspace_id": ws_id}, {"_id": 0}).to_list(500)
    for m in members:
        u = await db().users.find_one({"id": m["user_id"]}, {"_id": 0, "password": 0})
        m["user"] = u
    return members


@router.post("/workspaces/{ws_id}/members")
async def add_member(ws_id: str, data: MemberAdd, user=Depends(current_user)):
    await require(user, ws_id, "workspace.member.add")
    if data.role not in ROLES:
        raise HTTPException(400, "دور غير صالح")
    if data.role == "owner":
        raise HTTPException(400, "لا يمكن إضافة مالك آخر بهذه الطريقة")
    target = await db().users.find_one({"username": data.username})
    if not target:
        raise HTTPException(404, "المستخدم غير موجود")
    existing = await db().workspace_members.find_one({"workspace_id": ws_id, "user_id": target["id"]})
    if existing:
        raise HTTPException(400, "العضو موجود مسبقاً")
    doc = {
        "id": new_id(), "workspace_id": ws_id, "user_id": target["id"],
        "role": data.role, "invited_by": user["id"], "joined_at": now_iso(),
    }
    await db().workspace_members.insert_one(doc)
    await emit_event(ws_id, user["id"], "workspace.member.added",
                     {"user_id": target["id"], "role": data.role})
    doc.pop("_id", None)
    doc["user"] = {k: v for k, v in target.items() if k not in ("_id", "password")}
    return doc


@router.put("/workspaces/{ws_id}/members/{user_id}/role")
async def change_member_role(ws_id: str, user_id: str, data: MemberRoleUpdate, user=Depends(current_user)):
    await require(user, ws_id, "workspace.member.role.change")
    if data.role not in ROLES or data.role == "owner":
        raise HTTPException(400, "دور غير صالح")
    m = await db().workspace_members.find_one({"workspace_id": ws_id, "user_id": user_id})
    if not m:
        raise HTTPException(404, "العضو غير موجود")
    if m["role"] == "owner":
        raise HTTPException(400, "لا يمكن تغيير دور المالك")
    await db().workspace_members.update_one({"_id": m["_id"]}, {"$set": {"role": data.role}})
    await emit_event(ws_id, user["id"], "workspace.member.role_changed",
                     {"user_id": user_id, "role": data.role})
    return {"ok": True, "role": data.role}


@router.delete("/workspaces/{ws_id}/members/{user_id}")
async def remove_member(ws_id: str, user_id: str, user=Depends(current_user)):
    await require(user, ws_id, "workspace.member.remove")
    m = await db().workspace_members.find_one({"workspace_id": ws_id, "user_id": user_id})
    if not m:
        raise HTTPException(404, "العضو غير موجود")
    if m["role"] == "owner":
        raise HTTPException(400, "لا يمكن إزالة المالك")
    await db().workspace_members.delete_one({"_id": m["_id"]})
    await emit_event(ws_id, user["id"], "workspace.member.removed", {"user_id": user_id})
    return {"ok": True}


# ---------- CRM: Contacts ----------
@router.post("/crm/contacts")
async def create_contact(data: ContactCreate, user=Depends(current_user),
                         ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.contact.create")
    doc = {
        "id": new_id(), "workspace_id": ws_id,
        "kind": data.kind, "name": data.name,
        "email": data.email, "phone": data.phone or "",
        "company": data.company or "", "source": data.source or "",
        "tags": data.tags or [], "notes": data.notes or "",
        "score": data.score or 0, "owner_id": user["id"],
        "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db().crm_contacts.insert_one(doc)
    await emit_event(ws_id, user["id"], "crm.contact.created",
                     {"contact_id": doc["id"], "kind": data.kind})
    doc.pop("_id", None)
    return doc


@router.get("/crm/contacts")
async def list_contacts(user=Depends(current_user),
                        ws_id: str = Depends(get_workspace_id),
                        kind: Optional[str] = None,
                        q: Optional[str] = None,
                        limit: int = 200):
    await require(user, ws_id, "crm.contact.view")
    query: Dict[str, Any] = {"workspace_id": ws_id}
    if kind:
        query["kind"] = kind
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"company": {"$regex": q, "$options": "i"}},
        ]
    items = await db().crm_contacts.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return items


@router.get("/crm/contacts/{cid}")
async def get_contact(cid: str, user=Depends(current_user),
                      ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.contact.view")
    c = await db().crm_contacts.find_one({"id": cid, "workspace_id": ws_id}, {"_id": 0})
    if not c:
        raise HTTPException(404, "غير موجود")
    # Attach deals + invoices
    c["deals"] = await db().crm_deals.find(
        {"workspace_id": ws_id, "contact_id": cid}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    c["invoices"] = await db().crm_invoices.find(
        {"workspace_id": ws_id, "contact_id": cid}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return c


@router.put("/crm/contacts/{cid}")
async def update_contact(cid: str, data: ContactUpdate, user=Depends(current_user),
                         ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.contact.edit")
    c = await db().crm_contacts.find_one({"id": cid, "workspace_id": ws_id})
    if not c:
        raise HTTPException(404, "غير موجود")
    update = {k: v for k, v in data.dict().items() if v is not None}
    update["updated_at"] = now_iso()
    await db().crm_contacts.update_one({"id": cid}, {"$set": update})
    await emit_event(ws_id, user["id"], "crm.contact.updated", {"contact_id": cid})
    return await db().crm_contacts.find_one({"id": cid}, {"_id": 0})


@router.delete("/crm/contacts/{cid}")
async def delete_contact(cid: str, user=Depends(current_user),
                         ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.contact.delete")
    r = await db().crm_contacts.delete_one({"id": cid, "workspace_id": ws_id})
    if r.deleted_count == 0:
        raise HTTPException(404, "غير موجود")
    await emit_event(ws_id, user["id"], "crm.contact.deleted", {"contact_id": cid})
    return {"ok": True}


# ---------- CRM: Pipelines ----------
@router.get("/crm/pipelines")
async def list_pipelines(user=Depends(current_user),
                         ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.pipeline.view")
    items = await db().crm_pipelines.find({"workspace_id": ws_id}, {"_id": 0}).to_list(50)
    return items


@router.post("/crm/pipelines")
async def create_pipeline(data: PipelineCreate, user=Depends(current_user),
                          ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.pipeline.create")
    stages = data.stages or DEFAULT_PIPELINE_STAGES
    doc = {
        "id": new_id(), "workspace_id": ws_id,
        "name": data.name, "stages": stages,
        "is_default": False, "created_at": now_iso(),
    }
    await db().crm_pipelines.insert_one(doc)
    await emit_event(ws_id, user["id"], "crm.pipeline.created", {"pipeline_id": doc["id"]})
    doc.pop("_id", None)
    return doc


@router.put("/crm/pipelines/{pid}")
async def update_pipeline(pid: str, data: PipelineUpdate, user=Depends(current_user),
                          ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.pipeline.edit")
    update = {k: v for k, v in data.dict().items() if v is not None}
    if update:
        await db().crm_pipelines.update_one({"id": pid, "workspace_id": ws_id}, {"$set": update})
    return await db().crm_pipelines.find_one({"id": pid}, {"_id": 0})


@router.delete("/crm/pipelines/{pid}")
async def delete_pipeline(pid: str, user=Depends(current_user),
                          ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.pipeline.delete")
    p = await db().crm_pipelines.find_one({"id": pid, "workspace_id": ws_id})
    if not p:
        raise HTTPException(404, "غير موجود")
    if p.get("is_default"):
        raise HTTPException(400, "لا يمكن حذف المسار الافتراضي")
    # Also prevent delete if deals exist
    if await db().crm_deals.count_documents({"pipeline_id": pid}) > 0:
        raise HTTPException(400, "توجد صفقات على هذا المسار")
    await db().crm_pipelines.delete_one({"id": pid})
    return {"ok": True}


# ---------- CRM: Deals ----------
@router.post("/crm/deals")
async def create_deal(data: DealCreate, user=Depends(current_user),
                      ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.deal.create")
    # Validate contact + pipeline + stage
    contact = await db().crm_contacts.find_one({"id": data.contact_id, "workspace_id": ws_id})
    if not contact:
        raise HTTPException(404, "جهة الاتصال غير موجودة")
    pipeline = await db().crm_pipelines.find_one({"id": data.pipeline_id, "workspace_id": ws_id})
    if not pipeline:
        raise HTTPException(404, "المسار غير موجود")
    stage_ids = [s["id"] for s in pipeline["stages"]]
    if data.stage_id not in stage_ids:
        raise HTTPException(400, "المرحلة غير موجودة في هذا المسار")
    doc = {
        "id": new_id(), "workspace_id": ws_id,
        "contact_id": data.contact_id, "pipeline_id": data.pipeline_id,
        "stage_id": data.stage_id, "title": data.title,
        "value": float(data.value), "currency": data.currency,
        "expected_close": data.expected_close, "notes": data.notes or "",
        "status": "open", "owner_id": user["id"],
        "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db().crm_deals.insert_one(doc)
    # Auto-mark contact as customer once it has a deal (idempotent bump)
    if contact.get("kind") == "lead":
        await db().crm_contacts.update_one(
            {"id": data.contact_id},
            {"$set": {"kind": "customer", "updated_at": now_iso()}}
        )
    await emit_event(ws_id, user["id"], "crm.deal.created",
                     {"deal_id": doc["id"], "value": doc["value"]})
    doc.pop("_id", None)
    return doc


@router.get("/crm/deals")
async def list_deals(user=Depends(current_user),
                     ws_id: str = Depends(get_workspace_id),
                     pipeline_id: Optional[str] = None,
                     stage_id: Optional[str] = None,
                     status: Optional[str] = None,
                     limit: int = 500):
    await require(user, ws_id, "crm.deal.view")
    q: Dict[str, Any] = {"workspace_id": ws_id}
    if pipeline_id:
        q["pipeline_id"] = pipeline_id
    if stage_id:
        q["stage_id"] = stage_id
    if status:
        q["status"] = status
    items = await db().crm_deals.find(q, {"_id": 0}).sort("updated_at", -1).to_list(limit)
    # attach minimal contact
    for d in items:
        c = await db().crm_contacts.find_one(
            {"id": d["contact_id"]}, {"_id": 0, "name": 1, "company": 1, "id": 1}
        )
        d["contact"] = c
    return items


@router.get("/crm/deals/{did}")
async def get_deal(did: str, user=Depends(current_user),
                   ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.deal.view")
    d = await db().crm_deals.find_one({"id": did, "workspace_id": ws_id}, {"_id": 0})
    if not d:
        raise HTTPException(404, "غير موجودة")
    d["contact"] = await db().crm_contacts.find_one({"id": d["contact_id"]}, {"_id": 0})
    d["pipeline"] = await db().crm_pipelines.find_one({"id": d["pipeline_id"]}, {"_id": 0})
    d["invoices"] = await db().crm_invoices.find(
        {"workspace_id": ws_id, "deal_id": did}, {"_id": 0}
    ).to_list(100)
    return d


@router.put("/crm/deals/{did}")
async def update_deal(did: str, data: DealUpdate, user=Depends(current_user),
                      ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.deal.edit")
    d = await db().crm_deals.find_one({"id": did, "workspace_id": ws_id})
    if not d:
        raise HTTPException(404, "غير موجودة")
    update = {k: v for k, v in data.dict().items() if v is not None}
    update["updated_at"] = now_iso()
    # Track stage transition
    if "stage_id" in update and update["stage_id"] != d.get("stage_id"):
        await emit_event(ws_id, user["id"], "crm.deal.stage_changed", {
            "deal_id": did, "from": d.get("stage_id"), "to": update["stage_id"],
        })
        if update["stage_id"] == "won":
            update["status"] = "won"
        elif update["stage_id"] == "lost":
            update["status"] = "lost"
    await db().crm_deals.update_one({"id": did}, {"$set": update})
    await emit_event(ws_id, user["id"], "crm.deal.updated", {"deal_id": did})
    return await db().crm_deals.find_one({"id": did}, {"_id": 0})


@router.delete("/crm/deals/{did}")
async def delete_deal(did: str, user=Depends(current_user),
                      ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.deal.delete")
    r = await db().crm_deals.delete_one({"id": did, "workspace_id": ws_id})
    if r.deleted_count == 0:
        raise HTTPException(404, "غير موجودة")
    await emit_event(ws_id, user["id"], "crm.deal.deleted", {"deal_id": did})
    return {"ok": True}


# ---------- CRM: Invoices ----------
async def _next_invoice_number(ws_id: str) -> str:
    year = datetime.now(timezone.utc).year
    count = await db().crm_invoices.count_documents({"workspace_id": ws_id})
    return f"INV-{year}-{count + 1:04d}"


def _calc_invoice_totals(items: List[dict], tax_percent: float) -> Dict[str, float]:
    subtotal = round(sum(float(i["quantity"]) * float(i["unit_price"]) for i in items), 2)
    tax = round(subtotal * (tax_percent / 100.0), 2)
    total = round(subtotal + tax, 2)
    return {"subtotal": subtotal, "tax": tax, "total": total}


@router.post("/crm/invoices")
async def create_invoice(data: InvoiceCreate, user=Depends(current_user),
                         ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.invoice.create")
    contact = await db().crm_contacts.find_one({"id": data.contact_id, "workspace_id": ws_id})
    if not contact:
        raise HTTPException(404, "جهة الاتصال غير موجودة")
    items = [i.dict() for i in data.items]
    if not items:
        raise HTTPException(400, "الفاتورة تحتاج بنداً واحداً على الأقل")
    totals = _calc_invoice_totals(items, data.tax_percent)
    doc = {
        "id": new_id(), "workspace_id": ws_id,
        "number": await _next_invoice_number(ws_id),
        "contact_id": data.contact_id, "deal_id": data.deal_id,
        "items": items, "tax_percent": data.tax_percent, "currency": data.currency,
        **totals,
        "due_at": data.due_at, "notes": data.notes or "",
        "status": "draft",  # draft | sent | paid | overdue | cancelled
        "created_by": user["id"], "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db().crm_invoices.insert_one(doc)
    await emit_event(ws_id, user["id"], "crm.invoice.created",
                     {"invoice_id": doc["id"], "total": totals["total"]})
    doc.pop("_id", None)
    return doc


@router.get("/crm/invoices")
async def list_invoices(user=Depends(current_user),
                        ws_id: str = Depends(get_workspace_id),
                        status: Optional[str] = None,
                        contact_id: Optional[str] = None,
                        limit: int = 300):
    await require(user, ws_id, "crm.invoice.view")
    q: Dict[str, Any] = {"workspace_id": ws_id}
    if status:
        q["status"] = status
    if contact_id:
        q["contact_id"] = contact_id
    items = await db().crm_invoices.find(q, {"_id": 0}).sort("created_at", -1).to_list(limit)
    for inv in items:
        inv["contact"] = await db().crm_contacts.find_one(
            {"id": inv["contact_id"]}, {"_id": 0, "name": 1, "company": 1, "id": 1}
        )
    return items


@router.get("/crm/invoices/{iid}")
async def get_invoice(iid: str, user=Depends(current_user),
                      ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.invoice.view")
    inv = await db().crm_invoices.find_one({"id": iid, "workspace_id": ws_id}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "غير موجودة")
    inv["contact"] = await db().crm_contacts.find_one({"id": inv["contact_id"]}, {"_id": 0})
    return inv


@router.put("/crm/invoices/{iid}")
async def update_invoice(iid: str, data: InvoiceUpdate, user=Depends(current_user),
                         ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.invoice.edit")
    inv = await db().crm_invoices.find_one({"id": iid, "workspace_id": ws_id})
    if not inv:
        raise HTTPException(404, "غير موجودة")
    if inv.get("status") == "paid":
        raise HTTPException(400, "لا يمكن تعديل فاتورة مدفوعة")
    update: Dict[str, Any] = {}
    if data.items is not None:
        update["items"] = [i.dict() for i in data.items]
    if data.tax_percent is not None:
        update["tax_percent"] = data.tax_percent
    if data.due_at is not None:
        update["due_at"] = data.due_at
    if data.notes is not None:
        update["notes"] = data.notes
    if data.status is not None:
        update["status"] = data.status
    # Recalculate totals if items or tax changed
    if "items" in update or "tax_percent" in update:
        items = update.get("items", inv["items"])
        tax_percent = update.get("tax_percent", inv.get("tax_percent", 0))
        update.update(_calc_invoice_totals(items, tax_percent))
    update["updated_at"] = now_iso()
    await db().crm_invoices.update_one({"id": iid}, {"$set": update})
    return await db().crm_invoices.find_one({"id": iid}, {"_id": 0})


@router.post("/crm/invoices/{iid}/mark-paid")
async def mark_invoice_paid(iid: str, user=Depends(current_user),
                            ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.invoice.mark_paid")
    inv = await db().crm_invoices.find_one({"id": iid, "workspace_id": ws_id})
    if not inv:
        raise HTTPException(404, "غير موجودة")
    if inv.get("status") == "paid":
        raise HTTPException(400, "الفاتورة مدفوعة مسبقاً")
    await db().crm_invoices.update_one(
        {"id": iid},
        {"$set": {"status": "paid", "paid_at": now_iso(), "updated_at": now_iso()}}
    )
    await emit_event(ws_id, user["id"], "crm.invoice.paid",
                     {"invoice_id": iid, "total": inv.get("total", 0)})
    return await db().crm_invoices.find_one({"id": iid}, {"_id": 0})


@router.delete("/crm/invoices/{iid}")
async def delete_invoice(iid: str, user=Depends(current_user),
                         ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.invoice.delete")
    inv = await db().crm_invoices.find_one({"id": iid, "workspace_id": ws_id})
    if not inv:
        raise HTTPException(404, "غير موجودة")
    if inv.get("status") == "paid":
        raise HTTPException(400, "لا يمكن حذف فاتورة مدفوعة")
    await db().crm_invoices.delete_one({"id": iid})
    await emit_event(ws_id, user["id"], "crm.invoice.deleted", {"invoice_id": iid})
    return {"ok": True}


# ---------- CRM: Dashboard Stats ----------
@router.get("/crm/stats")
async def crm_stats(user=Depends(current_user),
                    ws_id: str = Depends(get_workspace_id)):
    await require(user, ws_id, "crm.contact.view")
    leads = await db().crm_contacts.count_documents({"workspace_id": ws_id, "kind": "lead"})
    customers = await db().crm_contacts.count_documents({"workspace_id": ws_id, "kind": "customer"})
    open_deals = await db().crm_deals.count_documents({"workspace_id": ws_id, "status": "open"})
    won_deals_cursor = db().crm_deals.find(
        {"workspace_id": ws_id, "status": "won"}, {"_id": 0, "value": 1}
    )
    won_value = 0.0
    won_count = 0
    async for d in won_deals_cursor:
        won_value += float(d.get("value", 0))
        won_count += 1
    open_deals_cursor = db().crm_deals.find(
        {"workspace_id": ws_id, "status": "open"}, {"_id": 0, "value": 1}
    )
    open_value = 0.0
    async for d in open_deals_cursor:
        open_value += float(d.get("value", 0))
    unpaid_invoices = await db().crm_invoices.count_documents(
        {"workspace_id": ws_id, "status": {"$in": ["draft", "sent", "overdue"]}}
    )
    paid_invoices_cursor = db().crm_invoices.find(
        {"workspace_id": ws_id, "status": "paid"}, {"_id": 0, "total": 1}
    )
    paid_total = 0.0
    async for i in paid_invoices_cursor:
        paid_total += float(i.get("total", 0))
    return {
        "leads": leads,
        "customers": customers,
        "open_deals": open_deals,
        "open_value": round(open_value, 2),
        "won_deals": won_count,
        "won_value": round(won_value, 2),
        "unpaid_invoices": unpaid_invoices,
        "paid_total": round(paid_total, 2),
    }


# ---------- Recent Events (for activity feed) ----------
@router.get("/events/recent")
async def recent_events(user=Depends(current_user),
                        ws_id: str = Depends(get_workspace_id),
                        limit: int = 30):
    await require(user, ws_id, "workspace.view")
    items = await db().events.find(
        {"workspace_id": ws_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    for e in items:
        u = await db().users.find_one(
            {"id": e.get("actor_id")}, {"_id": 0, "name": 1, "username": 1, "id": 1}
        )
        e["actor"] = u
    return items


# ==================== STARTUP MIGRATION ====================
async def ensure_personal_workspace(user: dict):
    """Idempotent: create a personal workspace for user if missing."""
    existing = await db().workspaces.find_one({"owner_id": user["id"], "kind": "personal"})
    if existing:
        return existing
    ws_id = new_id()
    ws = {
        "id": ws_id, "slug": f"personal-{user['username']}-{uuid.uuid4().hex[:4]}",
        "name": f"مساحة {user.get('name', user['username'])}",
        "kind": "personal", "owner_id": user["id"], "plan": "free",
        "created_at": now_iso(),
    }
    await db().workspaces.insert_one(ws)
    await db().workspace_members.insert_one({
        "id": new_id(), "workspace_id": ws_id, "user_id": user["id"],
        "role": "owner", "joined_at": now_iso(),
    })
    await db().crm_pipelines.insert_one({
        "id": new_id(), "workspace_id": ws_id,
        "name": "المسار الافتراضي", "stages": DEFAULT_PIPELINE_STAGES,
        "is_default": True, "created_at": now_iso(),
    })
    return ws


async def migrate_existing_users():
    """Ensure every user has a personal workspace + default pipeline."""
    users = await db().users.find({}, {"_id": 0, "password": 0}).to_list(10000)
    created = 0
    for u in users:
        existing = await db().workspaces.find_one({"owner_id": u["id"], "kind": "personal"})
        if not existing:
            await ensure_personal_workspace(u)
            created += 1
    logger.info(f"business_os migration: personal workspaces created={created}, total_users={len(users)}")
    # Ensure indexes
    try:
        await db().workspaces.create_index("owner_id")
        await db().workspaces.create_index("slug", unique=True, sparse=True)
        await db().workspace_members.create_index([("workspace_id", 1), ("user_id", 1)], unique=True)
        await db().workspace_members.create_index("user_id")
        await db().crm_contacts.create_index([("workspace_id", 1), ("kind", 1)])
        await db().crm_deals.create_index([("workspace_id", 1), ("pipeline_id", 1), ("stage_id", 1)])
        await db().crm_pipelines.create_index("workspace_id")
        await db().crm_invoices.create_index([("workspace_id", 1), ("status", 1)])
        await db().events.create_index([("workspace_id", 1), ("created_at", -1)])
    except Exception as e:
        logger.warning(f"business_os index setup: {e}")
