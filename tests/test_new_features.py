import requests, uuid, json, time
BASE = "https://creator-hub-1543.preview.emergentagent.com/api"

results = {"passed": [], "failed": []}
def rec(ok, name, detail=""):
    (results["passed"] if ok else results["failed"]).append(f"{name} :: {detail}")
    print(("PASS " if ok else "FAIL "), name, "->", detail)

def signup(email, pw, name, username):
    r = requests.post(f"{BASE}/auth/signup", json={"email":email,"password":pw,"name":name,"username":username})
    if r.status_code != 200:
        # try login
        r2 = requests.post(f"{BASE}/auth/login", json={"email":email,"password":pw})
        return r2.json()
    return r.json()

# Fresh users
u1_username = f"tuser{uuid.uuid4().hex[:6]}"
u2_username = f"tuser{uuid.uuid4().hex[:6]}"
u1 = signup(f"{u1_username}@t.com","password123","User One", u1_username)
u2 = signup(f"{u2_username}@t.com","password123","User Two", u2_username)
h1 = {"Authorization": f"Bearer {u1['token']}"}
h2 = {"Authorization": f"Bearer {u2['token']}"}
print("users:", u1_username, u2_username)

# ---- SEARCH ----
r = requests.get(f"{BASE}/search", params={"q": u1_username})
rec(r.status_code==200 and "users" in r.json() and "videos" in r.json(), "GET /search returns {users,videos}", f"status={r.status_code} keys={list(r.json().keys()) if r.ok else r.text[:120]}")
found = any(x["username"]==u1_username for x in r.json().get("users",[]))
rec(found, "search finds user by username", f"found={found}")

# ---- Create a service by u1 ----
sv = requests.post(f"{BASE}/services", headers=h1, json={"title":"Test Svc","description":"desc","price":10.0,"delivery_days":3,"category":"design"}).json()
service_id = sv.get("id")
rec(bool(service_id), "service created", f"id={service_id}")

# ---- Create order by u2 for u1's service ----
od = requests.post(f"{BASE}/orders", headers=h2, json={"service_id":service_id, "notes":"pls"}).json()
order_id = od.get("id")
rec(bool(order_id), "order created", f"id={order_id}")

# ---- Notification for creator (order) ----
n = requests.get(f"{BASE}/notifications", headers=h1).json()
has_order_notif = any(x.get("type")=="order" for x in n.get("items",[]))
rec(has_order_notif, "notification type=order for creator on new order", f"items={len(n.get('items',[]))} unseen={n.get('unseen')}")

# ---- REVIEW on unpaid order should fail ----
r = requests.post(f"{BASE}/reviews", headers=h2, json={"order_id":order_id,"rating":5,"text":"gr8"})
rec(r.status_code==400, "review on unpaid order rejected (400)", f"status={r.status_code} body={r.text[:120]}")

# ---- Simulate paid: use MongoDB via a direct patch is not available; use payments/status flow needs real Stripe.
# Test that /payments/status/{fake} returns 404 for unknown session
r = requests.get(f"{BASE}/payments/status/fake_session_xyz")
rec(r.status_code==404, "payment_status returns 404 for unknown session", f"status={r.status_code}")

# ---- Create checkout to get a real session id ----
co = requests.post(f"{BASE}/payments/checkout", headers=h2, json={"order_id":order_id,"origin_url":"https://example.com"})
if co.status_code==200:
    sid = co.json().get("session_id")
    rec(bool(sid), "checkout session created", f"sid={sid[:20] if sid else None}")
    # Poll status - should return structure without marking paid
    rs = requests.get(f"{BASE}/payments/status/{sid}")
    rec(rs.status_code==200 and "payment_status" in rs.json(), "payment_status returns structure", f"status={rs.status_code} body={rs.text[:150]}")
    # Confirm order NOT paid
    om = requests.get(f"{BASE}/orders/my", headers=h2).json()
    myorder = next((o for o in om.get("as_client",[]) if o["id"]==order_id), None)
    rec(myorder and myorder.get("payment_status")!="paid", "order NOT marked paid by polling without Stripe payment", f"payment_status={myorder.get('payment_status') if myorder else None}")
else:
    rec(False, "checkout failed", f"status={co.status_code} body={co.text[:200]}")

# ---- Simulate a paid order directly via db-like manipulation NOT possible from HTTP.
# So we verify the FEE branch logic exists (already confirmed by grep). Verify /earnings/me returns 10% platform_fee_percent
er = requests.get(f"{BASE}/earnings/me", headers=h1)
er_j = er.json() if er.ok else {}
rec(er.status_code==200 and er_j.get("platform_fee_percent")==10.0 and all(k in er_j for k in ["total_gross","total_fees","total_earned","orders_count"]), "GET /earnings/me returns expected structure with 10% fee", f"body={er_j}")

# ---- reviewed-ids empty ----
rid = requests.get(f"{BASE}/orders/reviewed-ids", headers=h2)
rec(rid.status_code==200 and isinstance(rid.json(),list), "GET /orders/reviewed-ids returns list", f"body={rid.text[:120]}")

# ---- Service reviews (empty) ----
sr = requests.get(f"{BASE}/reviews/service/{service_id}")
srj = sr.json() if sr.ok else {}
rec(sr.status_code==200 and set(["reviews","average","count"]).issubset(srj.keys()), "GET /reviews/service returns {reviews,average,count}", f"body={srj}")

# ---- COMMENTS: u2 comments on u1's video? need video. Create by uploading is complex. Skip video upload, but simulate: create comment on non-existent video won't produce notif for someone else since add_comment doesn't lookup owner.
# Check comment endpoint / notif behavior: Looking at code, add_comment does NOT create notification (line 348-361 - no create_notification call!).
# So test expectation: comment creates notification for video owner
# Need to check code again - was there create_notification? Let's check by looking at behaviour.

# Upload a small video by u1
files = {"file": ("t.mp4", b"\x00"*100, "video/mp4")}
data = {"caption":"hello world", "category":"test"}
up = requests.post(f"{BASE}/videos/upload", headers=h1, files=files, data=data)
vid_id = None
if up.status_code==200:
    vid_id = up.json().get("id")
    rec(True, "video uploaded", f"id={vid_id}")
    # u2 comments on u1's video
    cm = requests.post(f"{BASE}/videos/{vid_id}/comments", headers=h2, json={"text":"nice"})
    rec(cm.status_code==200, "comment created", f"status={cm.status_code}")
    # Check u1 has 'comment' notification
    n1 = requests.get(f"{BASE}/notifications", headers=h1).json()
    has_comment_notif = any(x.get("type")=="comment" for x in n1.get("items",[]))
    rec(has_comment_notif, "notification type=comment on other's video", f"unseen={n1.get('unseen')} types={[x.get('type') for x in n1.get('items',[])]}")
else:
    rec(False, "video upload failed - skipping comment test", f"status={up.status_code} body={up.text[:200]}")

# ---- MESSAGES ----
sm = requests.post(f"{BASE}/messages/with/{u1_username}", headers=h2, json={"text":"hi u1"})
rec(sm.status_code==200 and sm.json().get("id"), "POST /messages/with/{username} creates message", f"status={sm.status_code} body={sm.text[:200]}")

# u1 receives notification type=message
n1 = requests.get(f"{BASE}/notifications", headers=h1).json()
has_msg_notif = any(x.get("type")=="message" for x in n1.get("items",[]))
rec(has_msg_notif, "notification type=message for receiver", f"types={[x.get('type') for x in n1.get('items',[])]}")

# GET conversation history sorted asc
gm = requests.get(f"{BASE}/messages/with/{u2_username}", headers=h1).json()
msgs = gm.get("messages", [])
sorted_asc = all(msgs[i]["created_at"] <= msgs[i+1]["created_at"] for i in range(len(msgs)-1)) if len(msgs)>1 else True
rec(len(msgs)>=1 and sorted_asc, "GET /messages/with returns conversation history asc", f"len={len(msgs)}")

# Conversations
conv = requests.get(f"{BASE}/messages/conversations", headers=h1).json()
rec(isinstance(conv,list) and len(conv)>=1 and "last_text" in conv[0] and "unread" in conv[0], "GET /messages/conversations returns list with last_text & unread", f"body={json.dumps(conv)[:250]}")

# ---- mark-seen resets unseen ----
ms = requests.post(f"{BASE}/notifications/mark-seen", headers=h1)
n_after = requests.get(f"{BASE}/notifications", headers=h1).json()
rec(ms.status_code==200 and n_after.get("unseen")==0, "mark-seen resets unseen to 0", f"unseen={n_after.get('unseen')}")

# ---- Duplicate/paid-required review already tested; also test rating range ----
r = requests.post(f"{BASE}/reviews", headers=h2, json={"order_id":order_id,"rating":6,"text":"bad"})
rec(r.status_code==400, "review with rating>5 rejected", f"status={r.status_code}")

print("\n=== SUMMARY ===")
print(f"Passed: {len(results['passed'])}")
print(f"Failed: {len(results['failed'])}")
for f in results["failed"]: print("  X", f)
