from backend.app.database import engine, Base
from backend.app import models

print("Dropping appointments table...")
models.Appointment.__table__.drop(engine, checkfirst=True)
print("Done.")
