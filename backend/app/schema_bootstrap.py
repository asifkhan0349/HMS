from sqlalchemy import inspect, text


_APPOINTMENT_COLUMN_UPDATES = {
    "patient_date_of_birth": "ALTER TABLE appointments ADD COLUMN patient_date_of_birth DATE",
    "patient_age": "ALTER TABLE appointments ADD COLUMN patient_age INTEGER",
    "patient_gender": "ALTER TABLE appointments ADD COLUMN patient_gender VARCHAR(20)",
    "patient_mobile": "ALTER TABLE appointments ADD COLUMN patient_mobile VARCHAR(20)",
    "patient_email": "ALTER TABLE appointments ADD COLUMN patient_email VARCHAR(120)",
    "patient_address": "ALTER TABLE appointments ADD COLUMN patient_address VARCHAR(255)",
    "department": "ALTER TABLE appointments ADD COLUMN department VARCHAR(100)",
}


def ensure_schema_compatibility(engine):
    inspector = inspect(engine)
    if "appointments" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("appointments")}
    statements = [
        ddl for column, ddl in _APPOINTMENT_COLUMN_UPDATES.items()
        if column not in existing_columns
    ]

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))
