# Centralized Role-Permission Mapping
# Defines which roles have access to which resource/module

RESOURCE_PERMISSIONS = {
    "dashboard": ["Admin"],
    "patients": ["Admin", "Doctor", "Nurse", "Patient"],
    "appointments": ["Admin"],
    "records": ["Admin", "Doctor", "Nurse", "Patient"],
    "billing": ["Admin", "Reception", "Patient"],
    "pharmacy": ["Admin", "Reception"],
    "lab": ["Admin", "Doctor", "Nurse", "Patient"],
    "beds": ["Admin", "Nurse"],
    "staff": ["Admin"],
    "inventory": ["Admin", "Reception"],
    "blood_bank": ["Admin", "Reception"],
}

def get_allowed_roles(resource_name: str) -> list[str]:
    """Retrieve the list of allowed roles for a given resource."""
    return RESOURCE_PERMISSIONS.get(resource_name, [])
