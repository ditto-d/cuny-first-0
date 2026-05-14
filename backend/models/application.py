from dataclasses import dataclass
from typing import Any


@dataclass
class Application:
    application_type: str
    first_name: str
    last_name: str
    email: str
    gpa: float | None = None
    document_name: str | None = None

    @property
    def applicant_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def to_admission_payload(self, include_optional_fields: bool = True) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "applicant_name": self.applicant_name,
            "email": self.email,
            "status": "Pending",
        }

        if include_optional_fields:
            payload.update(
                {
                    "application_type": self.application_type,
                    "first_name": self.first_name,
                    "last_name": self.last_name,
                    "gpa": self.gpa,
                    "document_name": self.document_name,
                }
            )

        return payload
