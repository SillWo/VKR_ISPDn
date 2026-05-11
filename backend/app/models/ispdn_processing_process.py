from sqlalchemy import Column, DateTime, ForeignKey, Integer, Table, func

from app.core.database import Base


ispdn_processing_processes = Table(
    "ispdn_processing_processes",
    Base.metadata,
    Column("ispdn_id", Integer, ForeignKey("ispdn_cards.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "processing_process_id",
        Integer,
        ForeignKey("processing_processes.id", ondelete="RESTRICT"),
        primary_key=True,
    ),
    Column("created_at", DateTime(timezone=False), nullable=False, server_default=func.now()),
)
