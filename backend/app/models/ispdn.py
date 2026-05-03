from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class IspdnCard(Base):
    __tablename__ = "ispdn_cards"
    __table_args__ = (
        CheckConstraint("status IN ('active', 'archived')", name="ck_ispdn_cards_status"),
        CheckConstraint(
            "decommissioning_date IS NULL OR decommissioning_date >= commissioning_date",
            name="ck_ispdn_cards_decommissioning_date",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    short_description: Mapped[str] = mapped_column(Text, nullable=False)
    processing_purposes: Mapped[str] = mapped_column(Text, nullable=False)
    commissioning_date: Mapped[date] = mapped_column(Date, nullable=False)
    decommissioning_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    responsible_person: Mapped[str] = mapped_column(String(255), nullable=False)
    system_composition: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
