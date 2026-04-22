"""
Единое API для CRM детских праздников.
Маршрутизация по полю 'action' в теле запроса или query-параметре.
"""
import json
import os
import random
import string
from datetime import datetime, timedelta
import psycopg2

SCHEMA = "t_p37278024_kids_event_crm"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
    "Access-Control-Max-Age": "86400",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data):
    return {"statusCode": 200, "headers": {**CORS_HEADERS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": {**CORS_HEADERS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def get_user(conn, user_id):
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, first_name, last_name, phone, messenger, role, balance FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        if not row:
            return None
        return {"id": row[0], "first_name": row[1], "last_name": row[2], "phone": row[3], "messenger": row[4], "role": row[5], "balance": float(row[6])}


def handler(event: dict, context) -> dict:
    """Основной обработчик CRM API"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    qs = event.get("queryStringParameters") or {}
    action = body.get("action") or qs.get("action", "")
    user_id = body.get("user_id") or qs.get("user_id")

    conn = get_db()
    try:
        # ─── AUTH ───────────────────────────────────────────────────────
        if action == "register":
            return do_register(conn, body)
        if action == "request_otp":
            return do_request_otp(conn, body)
        if action == "verify_otp":
            return do_verify_otp(conn, body)
        if action == "get_profile":
            return do_get_profile(conn, body)
        if action == "update_profile":
            return do_update_profile(conn, body)

        # ─── NOTIFICATIONS ──────────────────────────────────────────────
        if action == "get_notifications":
            return do_get_notifications(conn, user_id)
        if action == "mark_notifications_read":
            return do_mark_notifications_read(conn, user_id)

        # ─── REQUESTS ───────────────────────────────────────────────────
        if action == "create_request":
            return do_create_request(conn, body)
        if action == "get_requests":
            return do_get_requests(conn, body)
        if action == "mark_request_read":
            return do_mark_request_read(conn, body)

        # ─── ORDERS ─────────────────────────────────────────────────────
        if action == "create_order":
            return do_create_order(conn, body)
        if action == "get_orders":
            return do_get_orders(conn, body)
        if action == "update_order":
            return do_update_order(conn, body)
        if action == "get_order":
            return do_get_order(conn, body)

        # ─── CITIES ─────────────────────────────────────────────────────
        if action == "publish_cities":
            return do_publish_cities(conn, body)
        if action == "get_cities":
            return do_get_cities(conn, body)

        # ─── BALANCE ────────────────────────────────────────────────────
        if action == "get_balance":
            return do_get_balance(conn, user_id)
        if action == "get_transactions":
            return do_get_transactions(conn, user_id)

        # ─── TRANSFER REQUESTS ──────────────────────────────────────────
        if action == "create_transfer_request":
            return do_create_transfer_request(conn, body)
        if action == "get_transfer_requests":
            return do_get_transfer_requests(conn, body)
        if action == "complete_transfer":
            return do_complete_transfer(conn, body)

        # ─── PLANS & PAYOUTS (ADMIN) ────────────────────────────────────
        if action == "set_plan":
            return do_set_plan(conn, body)
        if action == "get_plan":
            return do_get_plan(conn, body)
        if action == "calculate_payout":
            return do_calculate_payout(conn, body)
        if action == "approve_payout":
            return do_approve_payout(conn, body)
        if action == "get_payouts":
            return do_get_payouts(conn, body)

        # ─── ADMIN ──────────────────────────────────────────────────────
        if action == "get_managers":
            return do_get_managers(conn)
        if action == "get_analytics":
            return do_get_analytics(conn, body)

        return err("Unknown action")
    finally:
        conn.close()


# ═══════════════════════════════ AUTH ═══════════════════════════════

def do_register(conn, body):
    first = body.get("first_name", "").strip()
    last = body.get("last_name", "").strip()
    phone = body.get("phone", "").strip()
    messenger = body.get("messenger", "whatsapp")
    if not all([first, last, phone]):
        return err("Заполните все поля")
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone = %s", (phone,))
        if cur.fetchone():
            return err("Этот телефон уже зарегистрирован")
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (first_name, last_name, phone, messenger) VALUES (%s,%s,%s,%s) RETURNING id",
            (first, last, phone, messenger)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
    return ok({"user_id": user_id, "message": "Аккаунт создан"})


def do_request_otp(conn, body):
    phone = body.get("phone", "").strip()
    if not phone:
        return err("Укажите телефон")
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone = %s", (phone,))
        row = cur.fetchone()
        if not row:
            return err("Пользователь не найден")
        otp = "".join(random.choices(string.digits, k=6))
        expires = datetime.now() + timedelta(minutes=10)
        cur.execute(f"UPDATE {SCHEMA}.users SET otp_code=%s, otp_expires_at=%s WHERE phone=%s", (otp, expires, phone))
        conn.commit()
        # В реальном проекте отправляем через СМС/мессенджер
    return ok({"message": "Код отправлен", "dev_otp": otp})


def do_verify_otp(conn, body):
    phone = body.get("phone", "").strip()
    code = body.get("code", "").strip()
    if not phone or not code:
        return err("Укажите телефон и код")
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, otp_code, otp_expires_at, role, first_name, last_name, balance FROM {SCHEMA}.users WHERE phone = %s",
            (phone,)
        )
        row = cur.fetchone()
        if not row:
            return err("Пользователь не найден")
        uid, db_otp, db_exp, role, fn, ln, balance = row
        if db_otp != code:
            return err("Неверный код")
        if db_exp and datetime.now() > db_exp:
            return err("Код устарел")
        cur.execute(f"UPDATE {SCHEMA}.users SET otp_code=NULL, otp_expires_at=NULL WHERE id=%s", (uid,))
        conn.commit()
    return ok({"user_id": uid, "role": role, "first_name": fn, "last_name": ln, "balance": float(balance)})


def do_get_profile(conn, body):
    uid = body.get("user_id")
    if not uid:
        return err("user_id обязателен")
    u = get_user(conn, uid)
    if not u:
        return err("Пользователь не найден", 404)
    return ok(u)


def do_update_profile(conn, body):
    uid = body.get("user_id")
    first = body.get("first_name", "").strip()
    last = body.get("last_name", "").strip()
    messenger = body.get("messenger", "whatsapp")
    if not uid:
        return err("user_id обязателен")
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE {SCHEMA}.users SET first_name=%s, last_name=%s, messenger=%s WHERE id=%s",
            (first, last, messenger, uid)
        )
        conn.commit()
    return ok({"message": "Профиль обновлён"})


# ══════════════════════════ NOTIFICATIONS ═══════════════════════════

def do_get_notifications(conn, user_id):
    if not user_id:
        return err("user_id обязателен")
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, type, title, body, is_read, reference_id, created_at FROM {SCHEMA}.notifications WHERE user_id=%s ORDER BY created_at DESC LIMIT 50",
            (user_id,)
        )
        rows = cur.fetchall()
    result = [{"id": r[0], "type": r[1], "title": r[2], "body": r[3], "is_read": r[4], "reference_id": r[5], "created_at": str(r[6])} for r in rows]
    return ok(result)


def do_mark_notifications_read(conn, user_id):
    if not user_id:
        return err("user_id обязателен")
    with conn.cursor() as cur:
        cur.execute(f"UPDATE {SCHEMA}.notifications SET is_read=TRUE WHERE user_id=%s", (user_id,))
        conn.commit()
    return ok({"message": "Прочитано"})


def _notify(conn, user_id, ntype, title, body_text, ref_id=None):
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.notifications (user_id, type, title, body, reference_id) VALUES (%s,%s,%s,%s,%s)",
            (user_id, ntype, title, body_text, ref_id)
        )


# ══════════════════════════ REQUESTS ════════════════════════════════

def do_create_request(conn, body):
    uid = body.get("user_id")
    city = body.get("city", "").strip()
    if not uid or not city:
        return err("user_id и city обязательны")
    with conn.cursor() as cur:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.requests
                (manager_id, city, event_date, event_time, program, hero, address, children_count, children_age, animator_question, animators_to_send)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (uid, city, body.get("event_date"), body.get("event_time"),
             body.get("program"), body.get("hero"), body.get("address"),
             body.get("children_count"), body.get("children_age"),
             body.get("animator_question"), body.get("animators_to_send"))
        )
        req_id = cur.fetchone()[0]
        _notify(conn, uid, "new_request", "Запрос создан", f"Запрос в {city} создан", req_id)
        conn.commit()
    return ok({"request_id": req_id, "message": "Запрос создан"})


def do_get_requests(conn, body):
    uid = body.get("user_id")
    city = body.get("city")
    is_admin = body.get("is_admin", False)
    with conn.cursor() as cur:
        if is_admin:
            cur.execute(
                f"""SELECT r.id, r.manager_id, u.first_name, u.last_name,
                    r.city, r.event_date, r.event_time, r.hero, r.address, r.is_read, r.created_at
                    FROM {SCHEMA}.requests r JOIN {SCHEMA}.users u ON r.manager_id=u.id
                    ORDER BY r.created_at DESC LIMIT 200"""
            )
        elif city:
            cur.execute(
                f"""SELECT r.id, r.manager_id, u.first_name, u.last_name,
                    r.city, r.event_date, r.event_time, r.hero, r.address, r.is_read, r.created_at
                    FROM {SCHEMA}.requests r JOIN {SCHEMA}.users u ON r.manager_id=u.id
                    WHERE r.manager_id=%s AND r.city=%s ORDER BY r.created_at DESC""",
                (uid, city)
            )
        else:
            cur.execute(
                f"""SELECT r.id, r.manager_id, u.first_name, u.last_name,
                    r.city, r.event_date, r.event_time, r.hero, r.address, r.is_read, r.created_at
                    FROM {SCHEMA}.requests r JOIN {SCHEMA}.users u ON r.manager_id=u.id
                    WHERE r.manager_id=%s ORDER BY r.created_at DESC""",
                (uid,)
            )
        rows = cur.fetchall()
    result = [{"id": r[0], "manager_id": r[1], "manager_name": f"{r[2]} {r[3]}",
               "city": r[4], "event_date": str(r[5]) if r[5] else None, "event_time": str(r[6]) if r[6] else None,
               "hero": r[7], "address": r[8], "is_read": r[9], "created_at": str(r[10])} for r in rows]
    return ok(result)


def do_mark_request_read(conn, body):
    req_id = body.get("request_id")
    if not req_id:
        return err("request_id обязателен")
    with conn.cursor() as cur:
        cur.execute(f"UPDATE {SCHEMA}.requests SET is_read=TRUE WHERE id=%s", (req_id,))
        conn.commit()
    return ok({"message": "Прочитано"})


# ══════════════════════════ ORDERS ══════════════════════════════════

def do_create_order(conn, body):
    uid = body.get("user_id")
    if not uid:
        return err("user_id обязателен")
    prepayment = float(body.get("prepayment", 0))
    commission = round(prepayment * 0.4, 2)
    remainder = round(float(body.get("total_cost", 0)) - prepayment, 2)
    total_sum = round(float(body.get("total_cost", 0)) + float(body.get("travel_cost", 0)), 2)
    with conn.cursor() as cur:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.orders
                (manager_id, prepayment_screenshot, event_date, event_time, programs, program_duration,
                 extra_program, hero, address_region, address_city, address_street, address_house,
                 children_count, children_age, birthday_name, birthday_age, notes, birthday_info,
                 total_cost, travel_cost, total_sum, prepayment, remainder,
                 client_phone, client_name, animator_name, animator_title,
                 commission_pct, assistant_name, hero_photo, commission_amount)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING id""",
            (uid, body.get("prepayment_screenshot"), body.get("event_date"), body.get("event_time"),
             body.get("programs"), body.get("program_duration"), body.get("extra_program"), body.get("hero"),
             body.get("address_region"), body.get("address_city"), body.get("address_street"), body.get("address_house"),
             body.get("children_count"), body.get("children_age"), body.get("birthday_name"), body.get("birthday_age"),
             body.get("notes"), body.get("birthday_info"),
             body.get("total_cost", 0), body.get("travel_cost", 0), total_sum, prepayment, remainder,
             body.get("client_phone"), body.get("client_name"), body.get("animator_name"), body.get("animator_title"),
             body.get("commission_pct", 40), body.get("assistant_name"), body.get("hero_photo"), commission)
        )
        order_id = cur.fetchone()[0]
        # Пополняем баланс на 40% от предоплаты
        cur.execute(f"UPDATE {SCHEMA}.users SET balance = balance + %s WHERE id=%s", (commission, uid))
        cur.execute(
            f"INSERT INTO {SCHEMA}.balance_transactions (manager_id, type, amount, description, reference_id) VALUES (%s,'order_commission',%s,%s,%s)",
            (uid, commission, f"Комиссия по заявке #{order_id}", order_id)
        )
        _notify(conn, uid, "order_created", "Заявка создана", f"Баланс пополнен на {commission} ₽", order_id)
        conn.commit()
    return ok({"order_id": order_id, "commission": commission, "message": "Заявка создана"})


def do_get_orders(conn, body):
    uid = body.get("user_id")
    is_admin = body.get("is_admin", False)
    only_done = body.get("only_done", False)
    manager_filter = body.get("manager_id")
    city_filter = body.get("city")
    with conn.cursor() as cur:
        base = f"""SELECT o.id, o.manager_id, u.first_name, u.last_name,
                   o.address_city, o.event_date, o.event_time, o.hero,
                   o.prepayment, o.commission_amount, o.status, o.created_at,
                   o.client_name, o.animator_name
                   FROM {SCHEMA}.orders o JOIN {SCHEMA}.users u ON o.manager_id=u.id"""
        conds = []
        params = []
        if not is_admin:
            conds.append("o.manager_id=%s")
            params.append(uid)
        if only_done:
            conds.append("o.event_date < NOW()::date")
        if manager_filter:
            conds.append("o.manager_id=%s")
            params.append(manager_filter)
        if city_filter:
            conds.append("o.address_city=%s")
            params.append(city_filter)
        if conds:
            base += " WHERE " + " AND ".join(conds)
        base += " ORDER BY o.created_at DESC LIMIT 500"
        cur.execute(base, params)
        rows = cur.fetchall()
    result = [{"id": r[0], "manager_id": r[1], "manager_name": f"{r[2]} {r[3]}",
               "city": r[4], "event_date": str(r[5]) if r[5] else None, "event_time": str(r[6]) if r[6] else None,
               "hero": r[7], "prepayment": float(r[8] or 0), "commission": float(r[9] or 0),
               "status": r[10], "created_at": str(r[11]), "client_name": r[12], "animator_name": r[13]} for r in rows]
    return ok(result)


def do_get_order(conn, body):
    order_id = body.get("order_id")
    if not order_id:
        return err("order_id обязателен")
    with conn.cursor() as cur:
        cur.execute(f"SELECT * FROM {SCHEMA}.orders WHERE id=%s", (order_id,))
        row = cur.fetchone()
        if not row:
            return err("Заявка не найдена", 404)
        cols = [desc[0] for desc in cur.description]
    return ok(dict(zip(cols, [str(v) if v is not None else None for v in row])))


def do_update_order(conn, body):
    order_id = body.get("order_id")
    uid = body.get("user_id")
    is_admin = body.get("is_admin", False)
    if not order_id:
        return err("order_id обязателен")
    with conn.cursor() as cur:
        cur.execute(f"SELECT manager_id, event_date FROM {SCHEMA}.orders WHERE id=%s", (order_id,))
        row = cur.fetchone()
        if not row:
            return err("Заявка не найдена", 404)
        if not is_admin:
            if row[0] != int(uid):
                return err("Нет доступа", 403)
            if row[1] and row[1] <= datetime.now().date():
                return err("Редактирование запрещено: дата уже прошла")
        fields = ["programs", "hero", "event_date", "event_time", "notes", "animator_name", "client_name", "status"]
        sets = []
        params = []
        for f in fields:
            if f in body:
                sets.append(f"{f}=%s")
                params.append(body[f])
        if not sets:
            return err("Нет полей для обновления")
        params.append(order_id)
        cur.execute(f"UPDATE {SCHEMA}.orders SET {', '.join(sets)} WHERE id=%s", params)
        conn.commit()
    return ok({"message": "Заявка обновлена"})


# ══════════════════════════ CITIES ══════════════════════════════════

def do_publish_cities(conn, body):
    uid = body.get("user_id")
    cities = body.get("cities", [])
    if not uid or not cities:
        return err("user_id и список городов обязательны")
    total_cost = sum(float(c.get("publish_cost", 270)) for c in cities)
    with conn.cursor() as cur:
        cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id=%s", (uid,))
        row = cur.fetchone()
        if not row:
            return err("Пользователь не найден", 404)
        # Баланс может уходить в минус — просто списываем
        expires = datetime.now() + timedelta(days=30)
        for c in cities:
            cost = float(c.get("publish_cost", 270))
            cur.execute(
                f"""INSERT INTO {SCHEMA}.manager_cities (manager_id, city_name, publish_cost, target_kpd, expires_at, screenshot_url)
                    VALUES (%s,%s,%s,%s,%s,%s)""",
                (uid, c.get("city_name"), cost, c.get("target_kpd", 10), expires, c.get("screenshot_url"))
            )
        cur.execute(f"UPDATE {SCHEMA}.users SET balance = balance - %s WHERE id=%s", (total_cost, uid))
        cur.execute(
            f"INSERT INTO {SCHEMA}.balance_transactions (manager_id, type, amount, description) VALUES (%s,'city_publish',%s,%s)",
            (uid, -total_cost, f"Публикация {len(cities)} город(ов)")
        )
        conn.commit()
    return ok({"message": f"Опубликовано {len(cities)} город(ов)", "charged": total_cost})


def do_get_cities(conn, body):
    uid = body.get("user_id")
    is_admin = body.get("is_admin", False)
    with conn.cursor() as cur:
        if is_admin:
            cur.execute(
                f"""SELECT mc.id, mc.manager_id, u.first_name, u.last_name,
                    mc.city_name, mc.publish_cost, mc.target_kpd, mc.expires_at,
                    COALESCE(SUM(o.commission_amount), 0) as total_commission
                    FROM {SCHEMA}.manager_cities mc
                    JOIN {SCHEMA}.users u ON mc.manager_id=u.id
                    LEFT JOIN {SCHEMA}.orders o ON o.manager_id=mc.manager_id AND o.address_city=mc.city_name
                        AND o.created_at >= date_trunc('month', NOW())
                    GROUP BY mc.id, mc.manager_id, u.first_name, u.last_name, mc.city_name, mc.publish_cost, mc.target_kpd, mc.expires_at
                    ORDER BY mc.city_name"""
            )
        else:
            cur.execute(
                f"""SELECT mc.id, mc.manager_id, u.first_name, u.last_name,
                    mc.city_name, mc.publish_cost, mc.target_kpd, mc.expires_at,
                    COALESCE(SUM(o.commission_amount), 0) as total_commission
                    FROM {SCHEMA}.manager_cities mc
                    JOIN {SCHEMA}.users u ON mc.manager_id=u.id
                    LEFT JOIN {SCHEMA}.orders o ON o.manager_id=mc.manager_id AND o.address_city=mc.city_name
                        AND o.created_at >= date_trunc('month', NOW())
                    WHERE mc.manager_id=%s
                    GROUP BY mc.id, mc.manager_id, u.first_name, u.last_name, mc.city_name, mc.publish_cost, mc.target_kpd, mc.expires_at
                    ORDER BY mc.city_name""",
                (uid,)
            )
        rows = cur.fetchall()
    result = []
    for r in rows:
        publish_cost = float(r[5] or 270)
        target_kpd = float(r[6] or 10)
        commission = float(r[8] or 0)
        actual_kpd = commission / publish_cost if publish_cost > 0 else 0
        pct = (actual_kpd / target_kpd * 100) if target_kpd > 0 else 0
        result.append({
            "id": r[0], "manager_id": r[1], "manager_name": f"{r[2]} {r[3]}",
            "city_name": r[4], "publish_cost": publish_cost, "target_kpd": target_kpd,
            "expires_at": str(r[7]) if r[7] else None, "total_commission": commission,
            "kpd_pct": round(pct, 1)
        })
    return ok(result)


# ══════════════════════════ BALANCE ═════════════════════════════════

def do_get_balance(conn, user_id):
    if not user_id:
        return err("user_id обязателен")
    with conn.cursor() as cur:
        cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id=%s", (user_id,))
        row = cur.fetchone()
    return ok({"balance": float(row[0]) if row else 0})


def do_get_transactions(conn, user_id):
    if not user_id:
        return err("user_id обязателен")
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, type, amount, description, reference_id, created_at FROM {SCHEMA}.balance_transactions WHERE manager_id=%s ORDER BY created_at DESC LIMIT 100",
            (user_id,)
        )
        rows = cur.fetchall()
    result = [{"id": r[0], "type": r[1], "amount": float(r[2]), "description": r[3], "reference_id": r[4], "created_at": str(r[5])} for r in rows]
    return ok(result)


# ═══════════════════════ TRANSFER REQUESTS ══════════════════════════

def do_create_transfer_request(conn, body):
    admin_id = body.get("admin_id")
    manager_id = body.get("manager_id")
    order_id = body.get("order_id")
    amount = float(body.get("amount", 0))
    if not all([admin_id, manager_id, amount]):
        return err("admin_id, manager_id, amount обязательны")
    with conn.cursor() as cur:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.transfer_requests (admin_id, manager_id, order_id, amount, recipient_phone, recipient_bank)
                VALUES (%s,%s,%s,%s,%s,%s) RETURNING id""",
            (admin_id, manager_id, order_id, amount, body.get("recipient_phone"), body.get("recipient_bank"))
        )
        tr_id = cur.fetchone()[0]
        _notify(conn, manager_id, "transfer_request", "Запрос на перевод",
                f"Поступил запрос на перевод {amount} ₽", tr_id)
        conn.commit()
    return ok({"transfer_id": tr_id, "message": "Запрос создан"})


def do_get_transfer_requests(conn, body):
    manager_id = body.get("manager_id")
    status = body.get("status", "pending")
    with conn.cursor() as cur:
        cur.execute(
            f"""SELECT tr.id, tr.admin_id, tr.manager_id, tr.order_id, tr.amount,
                tr.recipient_phone, tr.recipient_bank, tr.status, tr.created_at
                FROM {SCHEMA}.transfer_requests tr
                WHERE tr.manager_id=%s AND tr.status=%s ORDER BY tr.created_at DESC""",
            (manager_id, status)
        )
        rows = cur.fetchall()
    result = [{"id": r[0], "admin_id": r[1], "manager_id": r[2], "order_id": r[3],
               "amount": float(r[4]), "recipient_phone": r[5], "recipient_bank": r[6],
               "status": r[7], "created_at": str(r[8])} for r in rows]
    return ok(result)


def do_complete_transfer(conn, body):
    tr_id = body.get("transfer_id")
    uid = body.get("user_id")
    if not tr_id or not uid:
        return err("transfer_id и user_id обязательны")
    with conn.cursor() as cur:
        cur.execute(f"SELECT amount, status, manager_id, admin_id FROM {SCHEMA}.transfer_requests WHERE id=%s", (tr_id,))
        row = cur.fetchone()
        if not row:
            return err("Запрос не найден", 404)
        amount, status, manager_id, admin_id = row
        if status == "done":
            return err("Уже выполнен")
        cur.execute(f"UPDATE {SCHEMA}.users SET balance = balance - %s WHERE id=%s", (amount, manager_id))
        cur.execute(f"UPDATE {SCHEMA}.transfer_requests SET status='done', done_at=NOW() WHERE id=%s", (tr_id,))
        cur.execute(
            f"INSERT INTO {SCHEMA}.balance_transactions (manager_id, type, amount, description, reference_id) VALUES (%s,'transfer',%s,%s,%s)",
            (manager_id, -float(amount), f"Перевод по запросу #{tr_id}", tr_id)
        )
        _notify(conn, admin_id, "transfer_done", "Перевод выполнен", f"Менеджер выполнил перевод {amount} ₽", tr_id)
        conn.commit()
    return ok({"message": "Перевод выполнен"})


# ════════════════════════ PLANS & PAYOUTS ════════════════════════════

def do_set_plan(conn, body):
    manager_id = body.get("manager_id")
    month_year = body.get("month_year")
    plan_amount = float(body.get("plan_amount", 0))
    if not all([manager_id, month_year]):
        return err("manager_id и month_year обязательны")
    with conn.cursor() as cur:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.manager_plans (manager_id, month_year, plan_amount)
                VALUES (%s,%s,%s) ON CONFLICT (manager_id, month_year) DO UPDATE SET plan_amount=%s""",
            (manager_id, month_year, plan_amount, plan_amount)
        )
        _notify(conn, manager_id, "plan_set", "План назначен", f"Ваш план на {month_year}: {plan_amount} ₽")
        conn.commit()
    return ok({"message": "План установлен"})


def do_get_plan(conn, body):
    manager_id = body.get("manager_id")
    month_year = body.get("month_year")
    if not manager_id or not month_year:
        return err("manager_id и month_year обязательны")
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT plan_amount FROM {SCHEMA}.manager_plans WHERE manager_id=%s AND month_year=%s",
            (manager_id, month_year)
        )
        row = cur.fetchone()
        # Считаем фактическую комиссию за месяц
        cur.execute(
            f"""SELECT COALESCE(SUM(commission_amount),0) FROM {SCHEMA}.orders
                WHERE manager_id=%s AND TO_CHAR(created_at,'YYYY-MM')=%s""",
            (manager_id, month_year)
        )
        fact_row = cur.fetchone()
    plan = float(row[0]) if row else 0
    fact = float(fact_row[0]) if fact_row else 0
    return ok({"plan": plan, "fact": fact, "remaining": max(0, plan - fact), "pct": round(fact / plan * 100, 1) if plan > 0 else 0})


def do_calculate_payout(conn, body):
    manager_id = body.get("manager_id")
    month_year = body.get("month_year")
    if not manager_id or not month_year:
        return err("manager_id и month_year обязательны")
    with conn.cursor() as cur:
        cur.execute(
            f"""SELECT COALESCE(SUM(commission_amount),0) FROM {SCHEMA}.orders
                WHERE manager_id=%s AND TO_CHAR(created_at,'YYYY-MM')=%s""",
            (manager_id, month_year)
        )
        commission = float(cur.fetchone()[0])
        cur.execute(f"SELECT plan_amount FROM {SCHEMA}.manager_plans WHERE manager_id=%s AND month_year=%s", (manager_id, month_year))
        plan_row = cur.fetchone()
        plan = float(plan_row[0]) if plan_row else 0
        bonus = round(commission * 0.05, 2) if commission >= plan and plan > 0 else 0
        cur.execute(
            f"""SELECT COALESCE(SUM(publish_cost),0) FROM {SCHEMA}.manager_cities
                WHERE manager_id=%s AND TO_CHAR(created_at,'YYYY-MM')=%s""",
            (manager_id, month_year)
        )
        cities_pay = float(cur.fetchone()[0])
        total = round(commission + bonus + cities_pay, 2)
    return ok({"commission": commission, "bonus": bonus, "cities_payment": cities_pay, "total": total, "plan_met": commission >= plan})


def do_approve_payout(conn, body):
    manager_id = body.get("manager_id")
    month_year = body.get("month_year")
    period_label = body.get("period_label", month_year)
    commission = float(body.get("commission", 0))
    bonus = float(body.get("bonus", 0))
    cities_pay = float(body.get("cities_payment", 0))
    total = float(body.get("total", 0))
    if not manager_id or not month_year:
        return err("manager_id и month_year обязательны")
    with conn.cursor() as cur:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.payouts (manager_id, period_label, commission_amount, bonus_amount, cities_payment, total_amount, status)
                VALUES (%s,%s,%s,%s,%s,%s,'approved') RETURNING id""",
            (manager_id, period_label, commission, bonus, cities_pay, total)
        )
        payout_id = cur.fetchone()[0]
        _notify(conn, manager_id, "payout_approved", "Выплата утверждена", f"Выплата {total} ₽ утверждена", payout_id)
        conn.commit()
    return ok({"payout_id": payout_id, "message": "Выплата утверждена"})


def do_get_payouts(conn, body):
    manager_id = body.get("manager_id")
    if not manager_id:
        return err("manager_id обязателен")
    with conn.cursor() as cur:
        cur.execute(
            f"""SELECT id, period_label, commission_amount, bonus_amount, cities_payment, total_amount, status, created_at, paid_at
                FROM {SCHEMA}.payouts WHERE manager_id=%s ORDER BY created_at DESC""",
            (manager_id,)
        )
        rows = cur.fetchall()
    result = [{"id": r[0], "period": r[1], "commission": float(r[2]), "bonus": float(r[3]),
               "cities": float(r[4]), "total": float(r[5]), "status": r[6],
               "created_at": str(r[7]), "paid_at": str(r[8]) if r[8] else None} for r in rows]
    return ok(result)


# ════════════════════════ ADMIN ══════════════════════════════════════

def do_get_managers(conn):
    with conn.cursor() as cur:
        cur.execute(
            f"""SELECT u.id, u.first_name, u.last_name, u.phone, u.balance, u.created_at,
                COUNT(DISTINCT o.id) as orders_count,
                COALESCE(SUM(o.commission_amount),0) as total_commission
                FROM {SCHEMA}.users u
                LEFT JOIN {SCHEMA}.orders o ON o.manager_id=u.id
                WHERE u.role='manager'
                GROUP BY u.id ORDER BY u.created_at"""
        )
        rows = cur.fetchall()
    result = [{"id": r[0], "first_name": r[1], "last_name": r[2], "phone": r[3],
               "balance": float(r[4]), "created_at": str(r[5]),
               "orders_count": r[6], "total_commission": float(r[7])} for r in rows]
    return ok(result)


def do_get_analytics(conn, body):
    period = body.get("period", "month")
    if period == "today":
        date_cond = "DATE(o.created_at) = CURRENT_DATE"
        req_cond = "DATE(r.created_at) = CURRENT_DATE"
    elif period == "week":
        date_cond = "o.created_at >= NOW() - INTERVAL '7 days'"
        req_cond = "r.created_at >= NOW() - INTERVAL '7 days'"
    else:
        date_cond = "DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', NOW())"
        req_cond = "DATE_TRUNC('month', r.created_at) = DATE_TRUNC('month', NOW())"

    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.orders o WHERE {date_cond}")
        orders_count = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.orders o WHERE DATE(o.event_date) = CURRENT_DATE")
        today_events = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.orders o WHERE DATE(o.event_date) = CURRENT_DATE + 1")
        tomorrow_events = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.requests r WHERE {req_cond}")
        requests_count = cur.fetchone()[0]
        conversion = round(orders_count / requests_count * 100, 1) if requests_count > 0 else 0
        cur.execute(
            f"""SELECT u.id, u.first_name, u.last_name,
                COUNT(o.id) as cnt,
                COALESCE(SUM(o.commission_amount),0) as commission
                FROM {SCHEMA}.users u LEFT JOIN {SCHEMA}.orders o ON o.manager_id=u.id AND {date_cond}
                WHERE u.role='manager' GROUP BY u.id"""
        )
        managers = [{"id": r[0], "name": f"{r[1]} {r[2]}", "orders": r[3], "commission": float(r[4])} for r in cur.fetchall()]

    return ok({
        "orders_count": orders_count,
        "today_events": today_events,
        "tomorrow_events": tomorrow_events,
        "requests_count": requests_count,
        "conversion": conversion,
        "managers": managers
    })
