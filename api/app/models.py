"""Import all SQLAlchemy models to register metadata."""
from app.features.agendas import models as agenda_models
from app.features.assemblies import models as assembly_models
from app.features.checkin import models as checkin_models
from app.features.condominiums import models as condominium_models
from app.features.qr_codes import models as qr_models
from app.features.tenants import models as tenant_models
from app.features.users import models as user_models
from app.features.voting import models as vote_models

__all__ = [
    "agenda_models",
    "assembly_models",
    "checkin_models",
    "condominium_models",
    "qr_models",
    "tenant_models",
    "user_models",
    "vote_models",
]
