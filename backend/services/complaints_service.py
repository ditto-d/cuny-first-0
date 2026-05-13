from datetime import date, datetime
 # File: Handles complaint submission and resolution, plus related disciplinary actions.
 

# Complaint Submission and Resolution
def submit_complaint(supabase, complainant_id: int, complainant_role: str, target_id: int, description: str) -> dict:
    if not description or not description.strip():
        return {"success": False, "message": "Complaint description is required."}
 
    if not target_id:
        return {"success": False, "message": "A target must be specified."}
 
    complaint = {
        "complainant_id":   complainant_id,
        "complainant_role": complainant_role,
        "target_id":        target_id,
        "description":      description.strip(),
        "status":           "Pending",
        "created_at":       datetime.utcnow().isoformat(),
    }
 
    result = supabase.table("complaint").insert(complaint).execute()
    if not result.data:
        return {"success": False, "message": "Failed to save complaint."}
 
    complaint_id = result.data[0]["complaint_id"]
    _notify_registrar(supabase, complaint_id, complainant_id, target_id)
 
    return {
        "success":      True,
        "message":      "Complaint filed successfully.",
        "complaint_id": complaint_id,
    }
 
# Complaint resolution by registrar
def resolve_complaint(supabase, complaint_id: int, registrar_id: int, action: str, justification: str) -> dict:
    
    VALID_ACTIONS = {"warn_subject", "warn_complainant", "dismiss"}
 
    # Fetch and validate the complaint
    complaint_res = (
        supabase.table("complaint")
        .select("*")
        .eq("complaint_id", complaint_id)
        .single()
        .execute()
    )
    if not complaint_res.data:
        return {"success": False, "message": "Complaint not found."}
 
    complaint = complaint_res.data
    if complaint["status"] != "Pending":
        return {"success": False, "message": "This complaint has already been resolved."}
 
    if action not in VALID_ACTIONS:
        return {
            "success": False,
            "message": f"Unknown action '{action}'. "
                       f"Must be one of: {', '.join(sorted(VALID_ACTIONS))}",
        }
 
    # Execute the chosen action
    if action == "warn_subject":
        _issue_warning(
            supabase,
            student_id=complaint["target_id"],
            issued_by=registrar_id,
            reason="Complaint upheld by registrar",
            description=justification,
        )
    elif action == "warn_complainant":
        _issue_warning(
            supabase,
            student_id=complaint["complainant_id"],
            issued_by=registrar_id,
            reason="False complaint filed",
            description=justification,
        )
    # 'dismiss' → no disciplinary action needed
 
    # Mark complaint as resolved
    supabase.table("complaint").update(
        {
            "status":        "Resolved",
            "resolution":    action,
            "justification": justification,
            "resolved_by":   registrar_id,
            "resolved_at":   datetime.utcnow().isoformat(),
        }
    ).eq("complaint_id", complaint_id).execute()
 
    return {"success": True, "message": "Complaint resolved.", "action": action}
 
 
# Internal helpers

# Issues a warning to a student by creating a record in the disciplinary table.
def _issue_warning(supabase, student_id: int, issued_by: int,
                   reason: str, description: str = "") -> None:
    """Write a Warning row to the disciplinary table."""
    supabase.table("disciplinary").insert(
        {
            "student_id":  student_id,
            "created_by":  issued_by,
            "issued_by":   issued_by,
            "action_type": "Warning",
            "reason":      reason,
            "description": description,
            "issue_date":  date.today().isoformat(),
        }
    ).execute()
 
# Creates a notification for the registrar to review a new complaint
def _notify_registrar(supabase, complaint_id: int, complainant_id: int, target_id: int) -> None:
    supabase.table("complaint_notification").insert(
        {
            "complaint_id":   complaint_id,
            "complainant_id": complainant_id,
            "target_id":      target_id,
            "is_read":        False,
            "created_at":     datetime.utcnow().isoformat(),
        }
    ).execute()