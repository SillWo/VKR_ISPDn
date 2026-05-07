from sqlalchemy import ForeignKey, Table, Column, Integer

from app.core.database import Base


ispdn_processing_purposes = Table(
    "ispdn_processing_purposes",
    Base.metadata,
    Column("ispdn_id", Integer, ForeignKey("ispdn_cards.id", ondelete="CASCADE"), primary_key=True),
    Column("processing_purpose_id", Integer, ForeignKey("processing_purposes.id", ondelete="RESTRICT"), primary_key=True),
)
