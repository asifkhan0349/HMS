ROLES = {
    "ADMIN": "Admin",
    "DOCTOR": "Doctor",
    "NURSE": "Nurse",
    "RECEPTION": "Reception",
    "PATIENT": "Patient",
}

MODULES = {
    "COMMAND_CENTER": "command_center",
    "PATIENT_DIRECTORY": "patient_directory",
    "SCHEDULING": "scheduling",
    "MEDICAL_RECORDS": "medical_records",
    "REVENUE_CYCLE": "revenue_cycle",
    "PHARMACY": "pharmacy",
    "DIAGNOSTICS_LAB": "diagnostics_lab",
    "FACILITY_MANAGEMENT": "facility_management",
    "HUMAN_CAPITAL": "human_capital",
    "INTELLIGENCE": "intelligence",
    "HOSPITAL_LOGISTICS": "hospital_logistics",
    "EMERGENCY_BLOOD_BANK": "emergency_blood_bank",
}

MODULE_PERMISSIONS = {
    MODULES["COMMAND_CENTER"]: [ROLES["ADMIN"]],
    MODULES["PATIENT_DIRECTORY"]: [ROLES["ADMIN"], ROLES["DOCTOR"], ROLES["NURSE"], ROLES["PATIENT"]],
    MODULES["SCHEDULING"]: [ROLES["ADMIN"], ROLES["PATIENT"]],
    MODULES["MEDICAL_RECORDS"]: [ROLES["ADMIN"], ROLES["DOCTOR"], ROLES["NURSE"], ROLES["PATIENT"]],
    MODULES["REVENUE_CYCLE"]: [ROLES["ADMIN"], ROLES["RECEPTION"], ROLES["PATIENT"]],
    MODULES["PHARMACY"]: [ROLES["ADMIN"], ROLES["RECEPTION"]],
    MODULES["DIAGNOSTICS_LAB"]: [ROLES["ADMIN"], ROLES["DOCTOR"], ROLES["NURSE"], ROLES["PATIENT"]],
    MODULES["FACILITY_MANAGEMENT"]: [ROLES["ADMIN"], ROLES["NURSE"]],
    MODULES["HUMAN_CAPITAL"]: [ROLES["ADMIN"]],
    MODULES["INTELLIGENCE"]: [ROLES["ADMIN"]],
    MODULES["HOSPITAL_LOGISTICS"]: [ROLES["ADMIN"], ROLES["RECEPTION"]],
    MODULES["EMERGENCY_BLOOD_BANK"]: [ROLES["ADMIN"], ROLES["DOCTOR"], ROLES["NURSE"], ROLES["RECEPTION"]],
}

RESOURCE_TO_MODULE = {
    "dashboard": MODULES["COMMAND_CENTER"],
    "patients": MODULES["PATIENT_DIRECTORY"],
    "appointments": MODULES["SCHEDULING"],
    "records": MODULES["MEDICAL_RECORDS"],
    "billing": MODULES["REVENUE_CYCLE"],
    "pharmacy": MODULES["PHARMACY"],
    "lab": MODULES["DIAGNOSTICS_LAB"],
    "beds": MODULES["FACILITY_MANAGEMENT"],
    "staff": MODULES["HUMAN_CAPITAL"],
    "reports": MODULES["INTELLIGENCE"],
    "inventory": MODULES["HOSPITAL_LOGISTICS"],
    "blood_bank": MODULES["EMERGENCY_BLOOD_BANK"],
    "blood_inventory": MODULES["EMERGENCY_BLOOD_BANK"],
    "blood_activities": MODULES["EMERGENCY_BLOOD_BANK"],
    "account_settings": "account_settings",
}

# Explicitly add account_settings to MODULE_PERMISSIONS
MODULE_PERMISSIONS["account_settings"] = list(ROLES.values())

RESOURCE_PERMISSIONS = {
    resource: MODULE_PERMISSIONS[module]
    for resource, module in RESOURCE_TO_MODULE.items()
}


def get_allowed_roles(resource_name: str) -> list[str]:
    """Retrieve the allowed roles for a module key or API resource alias."""
    module_name = RESOURCE_TO_MODULE.get(resource_name, resource_name)
    return MODULE_PERMISSIONS.get(module_name, [])


def has_permission(role: str | None, resource_name: str) -> bool:
    if not role:
        return False
    return role.lower() in [allowed_role.lower() for allowed_role in get_allowed_roles(resource_name)]
