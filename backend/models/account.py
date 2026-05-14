from dataclasses import dataclass
from typing import Any


@dataclass
class Account:
    user_id: int | str | None
    account_type: str
    first_name: str
    last_name: str
    email: str

    @classmethod
    def from_supabase(cls, data: dict[str, Any]) -> "Account":
        return cls(
            user_id=data.get("user_id") or data.get("id"),
            account_type=data.get("account_type") or data.get("role") or "student",
            first_name=data.get("first_name") or data.get("firstName") or "",
            last_name=data.get("last_name") or data.get("lastName") or "",
            email=data.get("email") or "",
        )

    def to_auth_response(self, supabase_user_id: str | None = None) -> dict[str, Any]:
        profile_id = self.user_id or supabase_user_id

        return {
            "id": profile_id,
            "supabase_user_id": supabase_user_id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "role": self.account_type,
            "student_id": profile_id if self.account_type == "student" else None,
            "instructor_id": profile_id if self.account_type == "instructor" else None,
            "registrar_id": profile_id if self.account_type == "registrar" else None,
        }
