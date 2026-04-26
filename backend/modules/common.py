import calendar
from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from functools import wraps
from time import sleep

from flask import jsonify, request


TRANSIENT_SOCKET_MESSAGES = (
    "WinError 10035",
    "non-blocking socket operation could not be completed immediately",
)


def execute_with_retry(query, attempts=3, delay_seconds=0.15):
    last_error = None
    for attempt in range(attempts):
        try:
            return query.execute()
        except Exception as error:
            last_error = error
            error_text = str(error)
            is_transient = any(message in error_text for message in TRANSIENT_SOCKET_MESSAGES)
            if not is_transient or attempt == attempts - 1:
                raise
            sleep(delay_seconds * (attempt + 1))

    raise last_error


def parse_positive_amount(value):
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None

    if amount <= 0:
        return None

    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def to_decimal(value):
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal("0")


def money(value):
    return float(to_decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def parse_period(month_value, year_value):
    try:
        month = int(month_value)
        year = int(year_value)
    except (TypeError, ValueError):
        return None, None, "Mes y year deben ser enteros"

    if month < 1 or month > 12:
        return None, None, "Mes debe estar entre 1 y 12"

    if year < 2000 or year > 9999:
        return None, None, "year debe estar entre 2000 y 9999"

    return month, year, None


def parse_iso_date(value):
    try:
        return date.fromisoformat(str(value))
    except (TypeError, ValueError):
        return None


def period_key(month, year):
    return year, month


def period_less_than(left_month, left_year, right_month, right_year):
    return period_key(left_month, left_year) < period_key(right_month, right_year)


def next_period(month, year):
    if month == 12:
        return 1, year + 1
    return month + 1, year


def first_day_for_period(month, year):
    return date(year, month, 1).isoformat()


def last_day_for_period(month, year):
    last = calendar.monthrange(year, month)[1]
    return date(year, month, last)


def require_role(*allowed_roles):
    """Decorator that enforces role-based access on a Flask route.

    Reads X-User-Id header, looks up the user in Supabase, and checks that
    their rol is in allowed_roles. On success, sets request.current_user so
    the route can read the authenticated user without a second DB call.
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            from database import supabase  # local import avoids circular dep

            user_id = request.headers.get("X-User-Id", "").strip()
            if not user_id:
                return jsonify({"error": "Autenticación requerida"}), 401

            res = execute_with_retry(
                supabase.table("users")
                .select("id, rol, unidad_id")
                .eq("id", user_id)
            )
            if not res.data:
                return jsonify({"error": "Usuario no encontrado"}), 401

            user = res.data[0]
            if user["rol"] not in allowed_roles:
                return jsonify({"error": "Acceso denegado"}), 403

            request.current_user = user
            return f(*args, **kwargs)
        return wrapper
    return decorator
