from models.account import Account
from services.supabase_client import SUPABASE_KEY, SUPABASE_URL
from supabase import create_client
from werkzeug.security import generate_password_hash


class AuthService:
    @staticmethod
    def _client():
        return create_client(SUPABASE_URL, SUPABASE_KEY)

    @staticmethod
    def _first_account_by(column: str, value: str) -> dict | None:
        try:
            response = (
                AuthService._client().table("account")
                .select("*")
                .eq(column, value)
                .limit(1)
                .execute()
            )
        except Exception:
            return None

        return response.data[0] if response.data else None

    @staticmethod
    def find_account(identifier: str) -> Account | None:
        cleaned_identifier = identifier.strip()

        account_data = AuthService._first_account_by("email", cleaned_identifier)
        if not account_data:
            account_data = AuthService._first_account_by("username", cleaned_identifier)

        return Account.from_supabase(account_data) if account_data else None

    @staticmethod
    def login(identifier: str, password: str) -> tuple[dict, int]:
        if not identifier or not password:
            return {
                "success": False,
                "message": "Email/username and password are required.",
            }, 400

        account = AuthService.find_account(identifier)
        if not account:
            return {
                "success": False,
                "message": "Invalid username or password.",
            }, 401

        try:
            auth_response = AuthService._client().auth.sign_in_with_password(
                {"email": account.email, "password": password}
            )
        except Exception:
            return {
                "success": False,
                "message": "Invalid username or password.",
            }, 401

        session = getattr(auth_response, "session", None)
        user = getattr(auth_response, "user", None)

        if not session or not getattr(session, "access_token", None):
            return {
                "success": False,
                "message": "Invalid username or password.",
            }, 401

        return {
            "success": True,
            "message": "Login successful.",
            "access_token": session.access_token,
            "token_type": "bearer",
            "user": account.to_auth_response(getattr(user, "id", None)),
        }, 200

    @staticmethod
    def change_password(access_token: str, new_password: str) -> tuple[dict, int]:
        if not access_token:
            return {
                "success": False,
                "message": "Access token is required.",
            }, 401

        if not new_password or len(new_password) < 6:
            return {
                "success": False,
                "message": "New password must be at least 6 characters.",
            }, 400

        client = AuthService._client()

        try:
            auth_user_response = client.auth.get_user(access_token)
            auth_user = getattr(auth_user_response, "user", auth_user_response)
        except Exception:
            return {
                "success": False,
                "message": "Session expired. Please log in again.",
            }, 401

        auth_user_id = getattr(auth_user, "id", None)
        email = getattr(auth_user, "email", None)

        if not auth_user_id or not email:
            return {
                "success": False,
                "message": "Could not identify authenticated user.",
            }, 401

        account = AuthService._first_account_by("email", email)
        if not account:
            return {
                "success": False,
                "message": "Account not found.",
            }, 404

        try:
            client.auth.admin.update_user_by_id(auth_user_id, {"password": new_password})
        except Exception:
            return {
                "success": False,
                "message": "Could not update Supabase Auth password.",
            }, 500

        account_update = {
            "password_hash": generate_password_hash(new_password),
            "must_change_password": False,
        }

        try:
            account_update["auth_user_id"] = auth_user_id
            client.table("account").update(account_update).eq("user_id", account["user_id"]).execute()
        except Exception:
            account_update.pop("auth_user_id", None)
            client.table("account").update(account_update).eq("user_id", account["user_id"]).execute()

        updated_account = Account.from_supabase({
            **account,
            "auth_user_id": auth_user_id,
            "must_change_password": False,
        })

        return {
            "success": True,
            "message": "Password changed successfully.",
            "user": updated_account.to_auth_response(auth_user_id),
        }, 200
