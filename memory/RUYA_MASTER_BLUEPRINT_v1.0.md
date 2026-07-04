# Ruʼya Master Blueprint v1.0
## المرجع الرسمي لمشروع "رؤى الوعي" — نظام تشغيل صنّاع المحتوى والأعمال الإبداعية

> **الوثيقة الرسمية للمشروع.** أي مطوّر، مصمم، مستثمر، أو شريك ينضم للمشروع يجب أن يقرأ هذا الملف أولاً قبل أي شيء آخر. هذا الملف يُحدَّث بشكل رسمي فقط عبر مراجعة معتمدة من مالك المنتج، وليس مع كل Sprint.

- **الإصدار:** 1.0
- **التاريخ:** يناير 2026
- **الحالة:** Living Document (وثيقة حية)
- **المالك:** Ruʼya Al-Waʼy
- **نطاق التطبيق:** كامل النظام (Backend, Frontend, Data, Product, Business)

---

## الفهرس

1. [الرؤية والرسالة](#1-الرؤية-والرسالة)
2. [المبادئ المعمارية الحاكمة](#2-المبادئ-المعمارية-الحاكمة)
3. [هيكل النظام كوحدات (Modules Architecture)](#3-هيكل-النظام-كوحدات-modules-architecture)
4. [نموذج البيانات (Data Model)](#4-نموذج-البيانات-data-model)
5. [نظام الصلاحيات (Role & Permission System)](#5-نظام-الصلاحيات-role--permission-system)
6. [رحلة النمو (Growth Journey)](#6-رحلة-النمو-growth-journey)
7. [الهوية البصرية](#7-الهوية-البصرية)
8. [طبقة الذكاء الاصطناعي (AI Layer)](#8-طبقة-الذكاء-الاصطناعي-ai-layer)
9. [محرّك الأتمتة (Automation Engine)](#9-محرك-الأتمتة-automation-engine)
10. [التحليلات التنبؤية (Predictive Analytics)](#10-التحليلات-التنبؤية-predictive-analytics)
11. [ربط العالم الحقيقي (Physical Layer)](#11-ربط-العالم-الحقيقي-physical-layer)
12. [الاعتبارات غير الوظيفية (NFRs)](#12-الاعتبارات-غير-الوظيفية-nfrs)
13. [خارطة طريق 5 سنوات](#13-خارطة-طريق-5-سنوات)
14. [قاموس المصطلحات](#14-قاموس-المصطلحات)
15. [قواعد التطوير والحوكمة](#15-قواعد-التطوير-والحوكمة)

---

## 1. الرؤية والرسالة

### الرؤية (Vision)
أن تصبح **رؤى الوعي** هي نظام التشغيل الأول للأعمال الإبداعية في العالم العربي — منصة يعيش عليها صانع المحتوى، ورائد الأعمال، والفنان، والمدرب، والطبيب، والفريق، والشركة، بشكل يومي لبناء ونمو وإدارة أعمالهم من الفكرة إلى الشركة.

### الرسالة (Mission)
> "نرافق كل مبدع عربي في رحلته من الفكرة إلى المؤسسة، عبر منصة موحّدة تجمع أدوات النشر، والتسويق، والأعمال، والفعاليات، والتعلّم، والمساحات المادية، تحت مظلة ذكاء اصطناعي حيّ وأتمتة كاملة."

### الجملة الحاكمة (One-Liner)
**رؤى ليست تطبيقاً. رؤى هي نظام تشغيل للنمو.**

### ما نحن لسنا (Anti-Vision)
- لسنا TikTok عربي فقط.
- لسنا Upwork عربي فقط.
- لسنا Notion عربي فقط.
- لسنا Zoho/Salesforce.
- **نحن كل هؤلاء + الطبقة الإبداعية + الذكاء + الأتمتة + الفضاء المادي، في نظام واحد.**

---

## 2. المبادئ المعمارية الحاكمة

### 2.1 القاعدة الذهبية
> **نبني Modules، لا Features.** كل قدرة في النظام يجب أن تكون Module مستقل، له حدود واضحة، وواجهة برمجية (API) خاصة، ونموذج بيانات خاص، وقابل للحياة/الإيقاف دون كسر باقي النظام.

### 2.2 المبادئ العشرة

1. **Modular by design** — كل Module له حدوده وقاعدة بياناته وAPI الخاص.
2. **Multi-tenant من اليوم الأول** — كل شيء ينتمي إلى `workspace_id` (شركة/فرد).
3. **Everything is a Resource** — عميل، مشروع، مهمة، محتوى، ملف، حجز… كلها موارد لها CRUD موحّد وسجل تدقيق.
4. **RBAC + ABAC first** — الصلاحيات تُحدّد بالدور والسياق قبل كتابة أي endpoint.
5. **Event-Driven Core** — أي فعل مهم يُصدر Event، ومحرّك الأتمتة يستمع لهذه Events.
6. **AI as a Layer, not a Feature** — الذكاء الاصطناعي طبقة تعمل داخل كل Module، وليست صفحة منفصلة.
7. **API First** — كل شيء له endpoint قبل أن يكون له UI. UI عميل واحد فقط من عملاء API.
8. **Composable UI** — الصفحات تُبنى من Widgets قابلة لإعادة التركيب في Dashboards مختلفة حسب الدور.
9. **Observability by default** — كل Module يُسجّل Metrics و Logs و Audit trail.
10. **Backward-compatible growth** — لا نكسر API قديم؛ نُصدر v2 ونتيح v1.

### 2.3 الطبقات الأربع للنظام (4-Layer System)

```
┌────────────────────────────────────────────────────┐
│  Layer 4: Experience Layer                         │
│  (Web, Mobile, Widgets, Voice, In-Space Screens)   │
├────────────────────────────────────────────────────┤
│  Layer 3: Intelligence Layer                       │
│  (AI Suggestions, Automation, Predictions)         │
├────────────────────────────────────────────────────┤
│  Layer 2: Business Modules                         │
│  (CRM, PM, CMS, Bookings, Community, Learning…)    │
├────────────────────────────────────────────────────┤
│  Layer 1: Core Platform                            │
│  (Identity, RBAC, Workspaces, Events, Files, Data) │
└────────────────────────────────────────────────────┘
```

**قاعدة:** Layer الأعلى يعرف Layer الأدنى، لكن ليس العكس أبداً.

---

## 3. هيكل النظام كوحدات (Modules Architecture)

النظام مقسّم إلى **7 Core Modules + 8 Business Modules + 3 Intelligence Modules = 18 Module**. لكل واحد مالك، وAPI، ومخطط بيانات، وواجهة.

### 3.1 Core Platform (7 وحدات جوهرية)

| # | Module | المسؤولية | الحدود |
|---|--------|-----------|--------|
| C1 | **Identity** | المستخدمون، الحسابات، JWT، جلسات، Devices | لا يعرف بالأعمال، فقط "من أنت" |
| C2 | **Workspaces** | الشركات/الفرق كـ Tenants، الأعضاء، الفوترة | كل Resource ينتمي لـ workspace |
| C3 | **RBAC** | الأدوار، الصلاحيات، السياسات، Policy Engine | يُستدعى قبل كل Action |
| C4 | **Events Bus** | نشر واستقبال Events داخلي، Webhooks | Automation و AI يستمعان هنا |
| C5 | **Files & Storage** | Object Storage، صور/فيديو/ملفات، معالجة | يخدم كل Module |
| C6 | **Search & Discovery** | فهرسة، Full-Text، Vector Search، توصيات | يفهرس Resources من كل Module |
| C7 | **Notifications** | إشعارات (Push/Email/SMS/InApp)، تفضيلات | يستمع لـ Events |

### 3.2 Business Modules (8 وحدات أعمال)

| # | Module | ماذا يفعل | مالك القيمة |
|---|--------|-----------|-------------|
| B1 | **CRM** | العملاء، Leads، Pipeline، العقود، الفواتير، الملفات، الملاحظات | الشركة/رائد الأعمال |
| B2 | **Project Management** | مشاريع، مهام، Kanban، Calendar، Timesheets، أعضاء | الفريق |
| B3 | **Content Management (CMS)** | خطط محتوى، Calendar، Assets، مراجعات، جدولة نشر | العميل + وكالة رؤى |
| B4 | **Approval Workflow** | Pipeline موافقات قابل للتخصيص (Draft → Review → Approved → Published) | كل من ينشر شيئاً |
| B5 | **Asset Library** | صور/فيديو/شعارات/ألوان/خطوط/قوالب لكل workspace | العلامة التجارية |
| B6 | **Marketplace & Services** | الخدمات، الطلبات، Stripe، العمولة، المراجعات | صانع المحتوى |
| B7 | **Community & Social** | Feed فيديو، مجتمعات، منشورات، متابعة، رسائل | كل مستخدم |
| B8 | **Learning & Events** | دورات، فعاليات، تذاكر، حجوزات ورش | المدرّب/المنظم |

### 3.3 Intelligence Modules (3 وحدات ذكاء)

| # | Module | ماذا يفعل |
|---|--------|-----------|
| I1 | **AI Assistant Layer** | AI مدمج في كل صفحة (اقتراح، توليد، تحسين، تلخيص) |
| I2 | **Automation Engine** | مبنيّ على Events + Rules + Actions (If-This-Then-That احترافي) |
| I3 | **Predictive Analytics** | Dashboards تنبؤية (أفضل وقت، نسبة تحويل، احتمال نجاح…) |

### 3.4 خريطة التبعية بين Modules

```
Identity ─┬─▶ Workspaces ─┬─▶ RBAC ─┬─▶ [ كل Business Module ]
          │               │         │
Events Bus ◀──────────────┴─────────┴─── ينشر أحداثاً منها
   │
   ├─▶ Notifications
   ├─▶ Automation Engine
   └─▶ AI Assistant Layer (context feed)

Files ◀── CRM, PM, CMS, Assets, Community
Search ◀── يفهرس كل Resource قابل للاكتشاف
```

---

## 4. نموذج البيانات (Data Model)

### 4.1 قواعد النمذجة

- كل Document فيه: `id` (uuid) | `workspace_id` | `created_by` | `created_at` | `updated_at` | `deleted_at` (soft delete).
- الوقت دائماً `datetime.now(timezone.utc)` بصيغة ISO.
- **لا نُرجع `_id` من MongoDB أبداً** إلى الـ API. نستخدم `PyObjectId` أو نُخفيه.
- كل Resource قابل للاكتشاف يُنشر إلى `search_index`.
- كل Resource قابل للربط يستخدم `refs: [{ type, id }]`.

### 4.2 الكيانات الأساسية (Core Entities)

#### Identity & Workspace
- **users**: id, email, username, name, avatar_url, phone, locale, password_hash, is_email_verified, mfa_enabled, created_at
- **workspaces**: id, slug, name, kind (`personal|agency|company|community`), owner_id, plan, billing, brand_id, created_at
- **workspace_members**: id, workspace_id, user_id, role_id, invited_by, joined_at, status
- **sessions**: id, user_id, device, ip, expires_at
- **api_keys**: id, workspace_id, name, key_hash, scopes[], expires_at

#### RBAC
- **roles**: id, workspace_id (or null=system), name, description, is_system
- **permissions**: id, key (`crm.lead.create`, `pm.task.assign`…), description
- **role_permissions**: role_id, permission_id
- **policies**: id, resource_type, condition (JSON), effect (allow/deny)

#### Events & Audit
- **events**: id, workspace_id, actor_id, type (`user.signup`, `order.paid`…), payload (JSON), created_at
- **audit_logs**: id, workspace_id, actor_id, resource_type, resource_id, action, before, after, ip, at

### 4.3 كيانات الأعمال (Business Entities)

#### CRM
- **contacts**: id, workspace_id, kind (`lead|customer|partner`), name, email, phone, company, tags[], owner_id, source, score
- **pipelines**: id, workspace_id, name, stages[] (`{id, name, order, probability}`)
- **deals**: id, workspace_id, contact_id, pipeline_id, stage_id, title, value, currency, expected_close, status, owner_id
- **contracts**: id, workspace_id, deal_id, file_id, status (`draft|sent|signed|expired`), signed_at
- **invoices**: id, workspace_id, contact_id, deal_id, number, items[], subtotal, tax, total, currency, status, due_at, paid_at
- **notes**: id, workspace_id, resource_ref, body_md, author_id, at

#### Project Management
- **projects**: id, workspace_id, contact_id (client), name, description, status, start, deadline, owner_id, members[]
- **tasks**: id, workspace_id, project_id, title, description, assignee_id, status, priority, labels[], due_at, order_in_column
- **boards**: id, project_id, name, columns[] (`{id, name, order}`)
- **timesheets**: id, task_id, user_id, minutes, note, at
- **checklists**: task_id, items[] (`{id, text, done}`)

#### CMS (Content Management)
- **content_plans**: id, workspace_id, client_workspace_id (agency case), name, period_start, period_end, kpi
- **content_calendar_items**: id, plan_id, planned_at, channel, kind (`reel|post|story|blog|podcast`), status (`idea|draft|review|approved|scheduled|published`), assignees[], assets[], approvals[]
- **content_drafts**: item_id, version, body_md, media_refs[], author_id, at
- **content_comments**: item_id, author_id, body, resolved

#### Approval Workflow
- **workflows**: id, workspace_id, name, resource_type, stages[] (`{id, name, approvers[], sla_hours}`)
- **approvals**: id, workflow_id, resource_ref, current_stage, history[] (`{stage, decision, by, at, note}`), status

#### Assets Library
- **brands**: id, workspace_id, name, colors[], fonts[], voice_tone, logo_refs[]
- **assets**: id, workspace_id, brand_id, kind (`image|video|logo|font|template|palette`), file_id, tags[], usage_count
- **collections**: id, workspace_id, name, asset_ids[]

#### Marketplace, Services, Payments
- **services**: id, provider_id (user), workspace_id, title, description, price, currency, delivery_days, tags[], is_active
- **orders**: id, workspace_id, service_id, client_id, provider_id, amount, currency, notes, status, payment_status, platform_fee, provider_earnings
- **payment_transactions**: id, order_id, session_id, amount, currency, status, platform_fee, provider_earnings, provider_payout_status
- **reviews**: id, order_id, service_id, provider_id, client_id, rating (1-5), text

#### Community & Social
- **videos**: id, workspace_id, user_id, storage_path, caption, category, likes, views, comments_count, is_deleted
- **likes / comments / follows**: كما هي حالياً
- **communities**: id, slug, name, icon, is_official, workspace_id?
- **community_members / community_posts / post_likes**

#### Marketplace of Projects
- **project_requests**: id, workspace_id, user_id, title, description, category, budget, deadline_days, status
- **applications**: id, project_id, user_id, message, proposed_price, status

#### Learning & Events
- **courses**: id, workspace_id, owner_id, title, description, price, lessons[], enrolled_count
- **enrollments**: id, course_id, user_id, progress, completed, certificate_id?
- **events**: id, workspace_id, owner_id, title, kind, date, location, price, capacity, tickets_sold, venue_id?
- **tickets**: id, event_id, user_id, code, checked_in, seat?

#### Physical Layer (Spaces & Bookings)
- **venues**: id, workspace_id (=رؤى), name, kind (`theater|studio|podcast|hall|cafe|salon|boutique`), capacity, price_per_hour, rules
- **resources_physical**: id, venue_id, name, kind (`camera|light|mic|room…`), unit_price
- **bookings**: id, venue_id / resource_id, user_id, start, end, status, price, payment_ref
- **check_ins**: booking_id, at, by

#### Automation & AI
- **automations**: id, workspace_id, name, trigger (event type + filters), conditions[], actions[], enabled, last_run
- **automation_runs**: id, automation_id, event_id, status, log, at
- **ai_conversations**: id, workspace_id, user_id, module_context, messages[], model, tokens
- **ai_suggestions**: id, resource_ref, kind, payload, accepted, at

### 4.4 مبادئ إضافية للنمذجة
- **لا Foreign Keys صلبة** (MongoDB) — نستخدم `refs` مع فهارس.
- **Denormalization محسوب** — نُخزّن `user_name` مع Comment لتجنّب Join، لكن نُحدّثه عبر Automation عندما يتغير الاسم.
- **Vector fields** — يُخزّن `embedding` (768d) على Content, Assets, Users, Projects لدعم البحث الدلالي.

---

## 5. نظام الصلاحيات (Role & Permission System)

> **مبدأ أساسي:** لا نكتب أي endpoint دون أن نقرر أولاً: من يستطيع استدعاءه، وضمن أي سياق.

### 5.1 الأدوار على مستوى النظام (System-Wide)

| الدور | الرمز | يستطيع |
|-------|-------|--------|
| Super Admin | `super_admin` | كل شيء (رؤى فقط) |
| Platform Admin | `platform_admin` | إدارة workspaces والدعم |
| Content Moderator | `moderator` | مراجعة المحتوى، إخفاء، حظر |
| Support | `support` | قراءة فقط + إجراءات دعم محدودة |

### 5.2 الأدوار داخل Workspace

| الدور | الرمز | نموذج |
|-------|-------|-------|
| Workspace Owner | `owner` | مالك الشركة |
| Workspace Admin | `admin` | مدير الشركة |
| Manager | `manager` | مدير قسم / فريق / مجتمع |
| Member | `member` | موظف / صانع محتوى |
| Client | `client` | عميل خارجي شارك في مشروع |
| Guest | `guest` | ضيف بقراءة محدودة |

### 5.3 الأدوار على مستوى Module (Contextual)

مثال — CMS:
- `cms.editor` — يُنشئ ويعدّل
- `cms.reviewer` — يراجع ويوافق
- `cms.publisher` — ينشر فقط
- `cms.viewer` — قراءة فقط

مثال — CRM:
- `crm.sales` — يدير Leads
- `crm.finance` — يرى الفواتير فقط
- `crm.viewer`

**فكرة القوة:** المستخدم قد يكون `member` في workspace، ولكن `cms.reviewer` في مشروع محتوى بعينه، و`crm.viewer` في CRM. RBAC + سياق (Context) = ABAC.

### 5.4 مصفوفة صلاحيات مصغّرة (Sample)

| Permission Key | Owner | Admin | Manager | Member | Client | Guest |
|----------------|:-----:|:-----:|:-------:|:------:|:------:|:-----:|
| `workspace.settings.edit` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `crm.lead.create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `crm.invoice.view` | ✅ | ✅ | ✅ | 🟡own | ✅own | ❌ |
| `pm.task.assign` | ✅ | ✅ | ✅ | 🟡self | ❌ | ❌ |
| `cms.item.approve` | ✅ | ✅ | ✅reviewer | ❌ | 🟡final | ❌ |
| `bookings.venue.book` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `analytics.workspace.view` | ✅ | ✅ | 🟡scoped | ❌ | ❌ | ❌ |

🟡 = مشروط بالسياق (own = خاصته فقط، scoped = ضمن نطاقه).

### 5.5 Policy Engine (المستقبل)
نبني `PolicyEngine` بسيط الآن، ثم نتوسع لـ **Cedar** أو **OPA** لاحقاً. الدوال:
```
can(user, action, resource, context) → allow | deny + reason
```
كل Endpoint يبدأ بـ:
```python
require(user, "crm.lead.create", workspace=ws)
```

### 5.6 قاعدة حديدية
> **لا نُطلق أي Module جديد قبل تعريف صلاحياته في `permissions.yaml` ومصفوفة الأدوار.**

---

## 6. رحلة النمو (Growth Journey)

### 6.1 الفلسفة
> "التطبيق لا يقدّم لك أدوات، بل يرافقك في تطوّرك المهني."

هذا هو **قلب رؤى**. كل مستخدم يرى أين هو، ولماذا الخطوة القادمة مهمة، وكيف يصلها.

### 6.2 المراحل السبع

| # | المرحلة | الرمز | العلامة |
|---|---------|-------|---------|
| 1 | بذرة الفكرة | 🌱 | سجّلت أول فكرة في الحاضنة |
| 2 | الهوية | 🎨 | أنشأت Brand + شعار + ألوان |
| 3 | أول محتوى | 📱 | نشرت أول فيديو/منشور |
| 4 | أول بيع | 💼 | تم أول Order مدفوع |
| 5 | الفريق | 👥 | انضم عضو ثانٍ إلى workspace |
| 6 | الإطلاق | 🚀 | مشروع أول مكتمل + حملة تسويق |
| 7 | الشركة | 🏢 | Workspace ترقى إلى `company` plan + CRM نشط |

### 6.3 آلية التتبّع
- **Model**: `growth_progress { user_id, workspace_id, current_stage, stages_completed[], milestones[] }`
- **Trigger**: Events Bus. عند حدث `order.paid` أول مرة → ترقية للمرحلة 4.
- **UI**: شريط في الـ Dashboard الرئيسي (ليس صفحة). نقرة → صفحة الرحلة الكاملة مع خط زمني.
- **AI**: كل مرحلة لها "المرشد" — اقتراح خطوتك التالية.
- **Rewards**: بادج، تخفيض عمولة، محتوى مميز، دعوات فعاليات.

### 6.4 قاعدة تصميمية
- لا "Onboarding Wizard" تقليدي.
- الرحلة تلقائية، تُحدَّث بأفعال المستخدم الحقيقية، لا بأسئلة.

---

## 7. الهوية البصرية

### 7.1 الأساسيات
- **الاتجاه**: RTL كأصل، LTR ثانوي.
- **الخلفية**: أسود عميق `#0A0A0A` — ليست مجرد جمالية، بل تمنح المحتوى (فيديو، صور) الأولوية.
- **اللون المميز**: أصفر كهربائي `#E3FF00` — إشارة نمو، طاقة، تركيز.
- **الرمادي**: `#1A1A1A / #2A2A2A / #6B7280` — طبقات.
- **الأبيض**: `#FFFFFF` — نصوص أساسية.
- **الخطوط**: Cairo (عناوين) + Tajawal (نصوص) + IBM Plex Mono (أرقام/كود).

### 7.2 مبادئ الواجهة
- كل Module له لون تأكيد فرعي (Accent) واحد فقط، الأصفر يبقى للأفعال الأولية.
- Micro-interactions على كل عنصر تفاعلي.
- تباعد سخي (2-3x مما يبدو مريحاً).
- لا Purple/Violet gradients (تُشبه AI slop).
- المحتوى قبل الديكور.

### 7.3 مكتبة المكوّنات
- shadcn/ui + tailwind كأساس.
- مكوّنات مخصّصة: `<GrowthBadge>`, `<StageStepper>`, `<AIInline>`, `<ApprovalStrip>`, `<KanbanCard>`.
- كل مكوّن له `data-testid` فريد.

---

## 8. طبقة الذكاء الاصطناعي (AI Layer)

### 8.1 المبدأ
> **AI ليس صفحة. AI طبقة. توجد داخل كل صفحة.**

### 8.2 نقاط التماس (Touchpoints) لكل Module

| Module | تدخّل الذكاء |
|--------|--------------|
| Incubator | يقترح تطوير الفكرة، ينبّه عن مخاطر، يقارن بمنافسين |
| CMS | يكتب السكربت، يقترح Hooks، يحسّن التوقيت، يقترح Hashtags |
| CRM | يرصد Leads محتملين من Community، يقترح رسائل متابعة |
| Services | يقترح السعر بناءً على السوق والخبرة |
| Profile | يعيد كتابة Bio، يقترح مهارات، يحلل الحساب |
| PM | يقترح تقسيم المهام، يتنبّأ بالتأخير |
| Assets | يقترح Assets مناسبة لكل محتوى |
| Automation | يقترح Workflows بناءً على سلوك المستخدم |
| Analytics | يشرح الأرقام بلغة طبيعية |

### 8.3 التصميم التقني
- **Model routing**: Claude Sonnet 4.5 (طويل/معمّق)، GPT (سريع)، Gemini (كثيف بصرياً).
- **Contextual prompt injection**: كل استدعاء يأخذ سياق (workspace, module, resource, user_persona).
- **Guardrails**: قواعد لغوية عربية، رفض المحتوى الحساس، سرية بيانات workspace.
- **Feedback loop**: كل اقتراح فيه 👍/👎، يُستخدم في تحسين prompts.
- **Cost**: تتبّع tokens لكل workspace، حدود شهرية على الخطة المجانية.

### 8.4 API موحّد
```
POST /api/ai/act
{
  "module": "cms",
  "task": "generate_reel_script",
  "context": { "brand_id": "...", "topic": "...", "audience": "..." }
}
```
النتيجة: `{ result, suggestions[], follow_ups[], tokens }`

---

## 9. محرّك الأتمتة (Automation Engine)

### 9.1 المفهوم
> Zapier/Make **داخل** المنصة، محدّد الاستخدام لسياق رؤى.

### 9.2 التركيب
```
Trigger (Event) → Filter/Condition → Actions (سلسلة)
```

### 9.3 مثال حي — تسجيل طبيب جديد

```yaml
name: "Doctor Onboarding"
trigger: user.signup
filter: user.role == "doctor"
actions:
  - create_community_if_missing: doctors
  - add_user_to_community: doctors
  - ai_generate_content_plan: { audience: "medical", period: 30 }
  - create_first_campaign_draft
  - suggest_photographers: nearby, top_rated: 5
  - send_notification: welcome_doctor
  - schedule_call: onboarding_specialist
```

### 9.4 مكوّنات المحرّك
- **Triggers**: أي Event من Events Bus.
- **Filters**: JSONLogic أو DSL بسيط.
- **Actions**: كتالوج Actions قابل للتوسّع (`create.*`, `send.*`, `ai.*`, `bill.*`, `book.*`).
- **UI Builder**: Drag-drop لبناء Workflow (مثل Node-Red مبسّط).
- **Marketplace of Workflows**: قوالب جاهزة يمكن نسخها.

### 9.5 قواعد الأمان
- كل Action يُنفَّذ بصلاحيات المستخدم الذي أنشأ Automation.
- سقف تنفيذ يومي لكل workspace.
- Kill-switch عام للـ Admin.

---

## 10. التحليلات التنبؤية (Predictive Analytics)

### 10.1 ليست Dashboards عادية
لا نعرض "عدد المشاهدات". نعرض:
- "أفضل يوم/ساعة لنشرك القادم" (نموذج قائم على تاريخك + مثلاؤك).
- "احتمال نجاح هذا المشروع" (0-100%) مع أسباب.
- "المحتوى الأكثر تحويلاً" (Reel > Post > Story) لجمهورك بالتحديد.
- "تحليل البراند": توافق الألوان، Tone، اتساق النشر.
- "تحليل المنافسين": من ينمو أسرع منك ولماذا.

### 10.2 المكوّنات
- **Metrics Store**: TimescaleDB أو ClickHouse (مستقبلاً).
- **Feature Store**: خصائص كل user/workspace لبناء نماذج تنبؤ.
- **Models**: بداية بـ heuristics + LLM، ثم نماذج ML مخصّصة.
- **Explainability**: كل تنبؤ يُشرح بجملة عربية طبيعية.

### 10.3 التسليم
- **Widget** في كل صفحة (Dashboard, Content, Deal, Project).
- **Weekly Insights Digest** بالبريد.
- **AI Analyst**: سؤال بلغة طبيعية → إجابة برسم بياني.

---

## 11. ربط العالم الحقيقي (Physical Layer)

### 11.1 الحلم
> أي شيء يحدث داخل مقرّ رؤى الوعي، يوجد داخل التطبيق. التطبيق هو نظام تشغيل المقر.

### 11.2 الأماكن (Venues) الممكنة
- المسرح
- استوديو التصوير
- استوديو البودكاست
- قاعة الورش
- المقهى (للفعاليات)
- الصالون
- البوتيك

### 11.3 التصميم
- **Venue Module**: كل مكان له صفحة، تقويم، أسعار، قواعد.
- **Booking Flow**: اختيار مكان → وقت → معدات إضافية → دفع → QR ticket.
- **Physical Check-in**: QR على باب المكان → سجل حضور تلقائي.
- **In-Space Screens**: شاشة أمام كل مكان تعرض "الحجز الحالي / التالي"، تسحبها من نفس API.
- **IoT مستقبلاً**: أقفال ذكية، إضاءة، طاقة… يفتحها Booking نشط.

### 11.4 التكامل مع Modules الأخرى
- الفعالية (Event) → تحجز Venue → تُصدر Tickets → تفتح Community مؤقت.
- المشروع (Project) → قد يحتاج جلسة تصوير → حجز Studio تلقائي.
- CRM → عميل قدم لجلسة → تُسجّل زيارته المادية.

---

## 12. الاعتبارات غير الوظيفية (NFRs)

### 12.1 الأداء
- P95 latency للـ API الحرج < 300ms.
- تحميل الصفحة الأولى < 2s على 3G.
- بث الفيديو adaptive (HLS مستقبلاً).

### 12.2 الأمان
- كل شيء HTTPS، JWT قصير + Refresh.
- Rate limiting على مستوى endpoint و workspace.
- تشفير الأسرار at rest.
- Audit log لكل عملية حساسة (مالية، صلاحيات، حذف).
- GDPR-like: تصدير بيانات المستخدم + حذف حسابه.

### 12.3 الموثوقية
- Uptime target 99.9%.
- Backups يومية للـ Mongo.
- Blue/Green deployments.

### 12.4 قابلية التوسع
- Modules قابلة للفصل إلى microservices لاحقاً بدون تغيير API.
- Search + Analytics قابلة للانفصال أولاً.

### 12.5 الملاحظة (Observability)
- Structured logging.
- Metrics (Prometheus-compatible).
- Traces (OpenTelemetry).
- Health checks لكل Module.

### 12.6 الاختبار
- Unit + Integration + E2E.
- لكل Module: contract tests للـ API.
- Load tests قبل كل إطلاق كبير.

### 12.7 التدويل (i18n)
- عربي كأصل، إنجليزي ثانياً.
- أرقام هندية/عربية اختياري.
- تواريخ هجرية/ميلادية.

### 12.8 الوصولية (a11y)
- WCAG 2.1 AA.
- Keyboard navigation.
- Screen readers.

---

## 13. خارطة طريق 5 سنوات

### السنة الأولى — الأساس (Foundations)

**Q1 — Sprint 5: Business OS Core**
- إعادة هيكلة الـ Backend على شكل Modules.
- Workspaces + RBAC + Events Bus (Core).
- CRM (v1): contacts, deals, pipelines, invoices.
- PM (v1): projects, tasks, Kanban, calendar.
- CMS (v1): plans, calendar, drafts.
- Approval Workflow (v1).
- Asset Library (v1).

**Q2 — Sprint 6: AI Layer Everywhere**
- AI موحّد داخل كل Module (Incubator, CMS, CRM, Services, Profile).
- Feedback loop.
- Cost tracking per workspace.

**Q3 — Sprint 7: Automation Engine**
- Triggers + Filters + Actions.
- UI Builder (drag-drop).
- Marketplace of Workflows (10 قوالب جاهزة).

**Q4 — Sprint 8: Predictive Analytics**
- Metrics Store.
- Best-time-to-post, conversion analytics.
- Brand & competitor analysis.
- Weekly digest.

### السنة الثانية — الجسر إلى العالم الحقيقي
- Sprint 9: Physical Layer (Venues, Bookings, Check-ins).
- Mobile App (React Native).
- In-space Screens.
- App Marketplace (Modules خارجية).

### السنة الثالثة — النمو والامتداد الإقليمي
- Multi-currency, multi-language full.
- Sub-agencies (Workspace داخل Workspace).
- Public API + Developer platform.

### السنة الرابعة — منصة مؤسسية
- Enterprise plans.
- On-premise/private cloud offering.
- SSO/SAML.
- Advanced compliance (SOC2).

### السنة الخامسة — نظام تشغيل عالمي للأعمال الإبداعية
- توسّع خليجي/عربي كامل.
- شراكات مع مؤسسات ثقافية وحكومية.
- IPO-ready operations.

---

## 14. قاموس المصطلحات

| المصطلح | التعريف |
|---------|---------|
| Workspace | Tenant واحد (فرد أو شركة). كل بياناته معزولة. |
| Module | وحدة مستقلة لها API + بيانات + UI. |
| Resource | أي كيان قابل لـ CRUD (Lead, Task, Video…). |
| Event | حدث يُنشر داخل النظام (`user.signup`, `order.paid`). |
| Automation | Workflow مبني على Trigger → Actions. |
| Growth Stage | مرحلة في رحلة المستخدم (1-7). |
| Persona | نمط المستخدم (Creator, Doctor, Agency…). |
| Policy | قاعدة تحدّد من يقدر يعمل ماذا ومتى. |
| AI Touchpoint | نقطة داخل Module يظهر فيها اقتراح AI. |

---

## 15. قواعد التطوير والحوكمة

### 15.1 قواعد لا تُكسر
1. **لا Feature بدون Module.** نُصنّف كل طلب: هل يتبع Module قائم أم يحتاج جديد؟
2. **لا Endpoint بدون RBAC.** يُرفض PR لا يستدعي `require()`.
3. **لا نموذج بيانات بدون `workspace_id`.**
4. **لا Event بدون schema موثّق.**
5. **لا AI بدون سياق (Prompt injection مضبوط).**
6. **لا Automation بدون حدود وحق إيقاف.**
7. **لا نُطلق Module بدون: docs + tests + permissions.yaml.**
8. **لا نكسر API قديم — v2 بشكل موازٍ.**
9. **PRD.md و Blueprint هما الحقيقة الوحيدة.**
10. **كل Sprint يُختم بـ Retrospective + تحديث Blueprint إن لزم.**

### 15.2 عملية إضافة Module جديد
1. اقتراح مكتوب في `/proposals/MODULE_NAME.md`.
2. مراجعة من صاحب المنتج.
3. تحديث Blueprint (هذا الملف) بالقسم الجديد.
4. تعريف `permissions.yaml` + Events + Data Model.
5. Skeleton: `/backend/modules/<name>/{router.py, models.py, service.py, permissions.yaml}`.
6. UI Skeleton: `/frontend/src/modules/<name>/`.
7. Contract tests أولاً.
8. Implementation.
9. Docs + E2E tests.
10. Feature flag للإطلاق التدريجي.

### 15.3 دورة الحياة الأسبوعية
- **الأحد**: Planning للأسبوع، مراجعة Backlog.
- **الاثنين-الخميس**: تنفيذ.
- **الجمعة**: Testing + Docs.
- **السبت**: Deployment + Retrospective + تحديث Blueprint.

### 15.4 مقاييس النجاح للمشروع
- **Health**: عدد Modules نشطة / عدد Workspaces / DAU.
- **Growth**: نسبة المستخدمين الذين يصلون Stage 4+ خلال 90 يوماً.
- **Monetization**: GMV, حجم العمولات، معدل الاشتراك المدفوع.
- **Retention**: 30/60/90-day retention per persona.
- **Physical**: نسبة إشغال الأماكن، إيرادات الحجوزات.

---

## خاتمة

هذا الملف ليس مشروعاً تقنياً — هو **دستور**. أي قرار تنفيذي، تصميمي، مالي، أو تجاري، يعود إلى هذا الملف أولاً. إذا تعارض قرار مع الـ Blueprint، إما نغيّر القرار، أو نُحدّث الـ Blueprint بشكل رسمي.

**رؤى لا تُبنى بسرعة. رؤى تُبنى بإحكام.**

— النهاية —

---

### السجل (Change Log)
- **v1.0** — يناير 2026 — النسخة الأولى.
