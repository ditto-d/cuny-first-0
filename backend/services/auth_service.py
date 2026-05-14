from models.account import Account
from services.supabase_client import supabase


class AuthService:
    @staticmethod
    def _first_account_by(column: str, value: str) -> dict | None:
        try:
            response = (
                supabase.table("account")
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
            auth_response = supabase.auth.sign_in_with_password(
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
