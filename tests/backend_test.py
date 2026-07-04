#!/usr/bin/env python3
"""Backend API smoke tests for TikTok-style Arabic platform."""
import os, sys, json, uuid, time, io, struct
import requests

BASE = "https://creator-hub-1543.preview.emergentagent.com/api"

results = {"passed": [], "failed": []}

def log(name, ok, detail=""):
    if ok:
        results["passed"].append(name)
        print(f"[PASS] {name} {detail}")
    else:
        results["failed"].append({"test": name, "detail": detail})
        print(f"[FAIL] {name} {detail}")

# ---------- Auth ----------
uid = uuid.uuid4().hex[:8]
new_email = f"tester_{uid}@test.com"
new_username = f"tester_{uid}"
new_password = "pass1234"

# 1. Signup new
r = requests.post(f"{BASE}/auth/signup", json={
    "email": new_email, "password": new_password,
    "name": "Tester", "username": new_username
})
ok = r.status_code == 200 and "token" in r.json() and r.json()["user"]["username"] == new_username
log("signup_new_user", ok, f"status={r.status_code}")
token = r.json().get("token") if ok else None
user_id = r.json().get("user", {}).get("id") if ok else None

# 2. Duplicate signup
r = requests.post(f"{BASE}/auth/signup", json={
    "email": new_email, "password": new_password,
    "name": "Tester", "username": new_username
})
log("signup_duplicate_400", r.status_code == 400, f"status={r.status_code}")

# 3. Login existing
r = requests.post(f"{BASE}/auth/login", json={"email": "test2@test.com", "password": "password123"})
ok = r.status_code == 200 and "token" in r.json()
log("login_existing", ok, f"status={r.status_code}")
sarah_token = r.json().get("token") if ok else None

# 4. Login wrong pw
r = requests.post(f"{BASE}/auth/login", json={"email": "test2@test.com", "password": "wrong"})
log("login_wrong_pw_401", r.status_code == 401, f"status={r.status_code}")

# 5. /auth/me
r = requests.get(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {token}"})
log("auth_me", r.status_code == 200 and r.json().get("username") == new_username, f"status={r.status_code}")

# 6. Get user profile
r = requests.get(f"{BASE}/users/sarah")
log("get_user_profile", r.status_code == 200 and r.json().get("username") == "sarah", f"status={r.status_code}")
sarah_id = r.json().get("id") if r.status_code == 200 else None

# 7. Unknown user 404
r = requests.get(f"{BASE}/users/nonexistent_xyz_{uid}")
log("get_user_unknown_404", r.status_code == 404, f"status={r.status_code}")

# 8. Follow sarah (uses username in path; field is "followers")
if token:
    r0 = requests.get(f"{BASE}/users/sarah")
    before = r0.json().get("followers", 0)
    r = requests.post(f"{BASE}/users/sarah/follow", headers={"Authorization": f"Bearer {token}"})
    r2 = requests.get(f"{BASE}/users/sarah")
    after = r2.json().get("followers", 0)
    log("follow_user", r.status_code == 200 and r.json().get("following") is True and after == before + 1,
        f"before={before} after={after} resp={r.json()}")

    # unfollow
    r = requests.post(f"{BASE}/users/sarah/follow", headers={"Authorization": f"Bearer {token}"})
    r3 = requests.get(f"{BASE}/users/sarah")
    after2 = r3.json().get("followers", 0)
    log("unfollow_user", r.status_code == 200 and r.json().get("following") is False and after2 == before,
        f"final={after2} resp={r.json()}")

# 9. Video upload — tiny synthetic mp4 (field name is "file", form field "category")
mp4_bytes = b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2avc1mp41" + b"\x00" * 512
files = {"file": ("test.mp4", mp4_bytes, "video/mp4")}
data = {"caption": "hello test", "category": "عام"}
r = requests.post(f"{BASE}/videos/upload", files=files, data=data,
                  headers={"Authorization": f"Bearer {token}"}, timeout=120)
video_id = None
if r.status_code == 200:
    j = r.json()
    video_id = j.get("id")
    ok = video_id is not None and j.get("creator", {}).get("username") == new_username
    log("video_upload", ok, f"video_id={video_id}")
else:
    log("video_upload", False, f"status={r.status_code} body={r.text[:200]}")

# 10. Video feed
r = requests.get(f"{BASE}/videos/feed", headers={"Authorization": f"Bearer {token}"})
if r.status_code == 200:
    feed = r.json()
    ok = isinstance(feed, list) and (video_id is None or any(v.get("id") == video_id for v in feed))
    has_creator = feed and "creator" in feed[0] and "liked" in feed[0] if feed else False
    log("videos_feed", ok and (not feed or has_creator), f"count={len(feed)}")
else:
    log("videos_feed", False, f"status={r.status_code}")

# 11. Videos by user
r = requests.get(f"{BASE}/videos/user/{new_username}")
if r.status_code == 200:
    lst = r.json()
    ok = isinstance(lst, list) and all(v.get("creator", {}).get("username") == new_username for v in lst)
    log("videos_by_user", ok, f"count={len(lst)}")
else:
    log("videos_by_user", False, f"status={r.status_code}")

# 12. Like toggle
if video_id:
    r = requests.post(f"{BASE}/videos/{video_id}/like", headers={"Authorization": f"Bearer {token}"})
    ok1 = r.status_code == 200 and r.json().get("liked") is True
    r2 = requests.post(f"{BASE}/videos/{video_id}/like", headers={"Authorization": f"Bearer {token}"})
    ok2 = r2.status_code == 200 and r2.json().get("liked") is False
    log("video_like_toggle", ok1 and ok2, f"first={r.json()} second={r2.json()}")

# 13. Comment
if video_id:
    r = requests.post(f"{BASE}/videos/{video_id}/comments",
                      json={"text": "great video"},
                      headers={"Authorization": f"Bearer {token}"})
    log("video_comment_add", r.status_code == 200, f"status={r.status_code}")
    r = requests.get(f"{BASE}/videos/{video_id}/comments")
    ok = r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) >= 1
    log("video_comment_list", ok, f"count={len(r.json()) if r.status_code==200 else 0}")

# 14. Services create
r = requests.post(f"{BASE}/services",
                  json={"title": "Service X", "description": "desc", "price": 25.0, "category": "design"},
                  headers={"Authorization": f"Bearer {token}"})
service_id = None
if r.status_code == 200:
    service_id = r.json().get("id")
    log("service_create", service_id is not None, f"id={service_id}")
else:
    log("service_create", False, f"status={r.status_code} body={r.text[:200]}")

# 15. Services by user
r = requests.get(f"{BASE}/services/user/{new_username}")
log("services_by_user", r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) >= 1,
    f"status={r.status_code}")

# 16. Order create (buyer=sarah orders from new user)
order_id = None
if service_id and sarah_token:
    r = requests.post(f"{BASE}/orders",
                      json={"service_id": service_id, "notes": "please deliver"},
                      headers={"Authorization": f"Bearer {sarah_token}"})
    if r.status_code == 200:
        order_id = r.json().get("id")
        status = r.json().get("status")
        log("order_create", order_id is not None and status == "pending_payment", f"status={status}")
    else:
        log("order_create", False, f"status={r.status_code} body={r.text[:200]}")

# 17. Orders my (sarah)
if sarah_token:
    r = requests.get(f"{BASE}/orders/my", headers={"Authorization": f"Bearer {sarah_token}"})
    if r.status_code == 200:
        j = r.json()
        ok = "as_client" in j and "as_creator" in j
        log("orders_my", ok, f"as_client={len(j.get('as_client',[]))}")
    else:
        log("orders_my", False, f"status={r.status_code}")

# 18. Stripe checkout
session_id = None
if order_id and sarah_token:
    r = requests.post(f"{BASE}/payments/checkout",
                      json={"order_id": order_id, "origin_url": "https://creator-hub-1543.preview.emergentagent.com"},
                      headers={"Authorization": f"Bearer {sarah_token}"}, timeout=60)
    if r.status_code == 200:
        j = r.json()
        session_id = j.get("session_id")
        url = j.get("url")
        log("payments_checkout", session_id is not None and url and "stripe" in url.lower(),
            f"url={url[:60] if url else None}")
    else:
        log("payments_checkout", False, f"status={r.status_code} body={r.text[:200]}")

# 19. Payment status
if session_id and sarah_token:
    r = requests.get(f"{BASE}/payments/status/{session_id}",
                     headers={"Authorization": f"Bearer {sarah_token}"})
    if r.status_code == 200:
        j = r.json()
        log("payments_status", "payment_status" in j or "status" in j, f"keys={list(j.keys())}")
    else:
        log("payments_status", False, f"status={r.status_code} body={r.text[:200]}")

# 20. Delete service
if service_id:
    r = requests.delete(f"{BASE}/services/{service_id}", headers={"Authorization": f"Bearer {token}"})
    log("service_delete", r.status_code == 200, f"status={r.status_code}")

# 21. Explore creators
r = requests.get(f"{BASE}/explore/creators")
log("explore_creators", r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0,
    f"count={len(r.json()) if r.status_code == 200 else 0}")

print("\n===== SUMMARY =====")
print(f"Passed: {len(results['passed'])}")
print(f"Failed: {len(results['failed'])}")
for f in results["failed"]:
    print(f"  - {f}")

with open("/tmp/backend_results.json", "w") as fp:
    json.dump(results, fp, indent=2)
