from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class OrganizationCard(Base):
    __tablename__ = "organization_card"
    __table_args__ = (CheckConstraint("id = 1", name="ck_organization_card_singleton_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    short_legal_name: Mapped[str] = mapped_column(String(255), nullable=False)
    full_legal_name: Mapped[str] = mapped_column(Text, nullable=False)
    inn: Mapped[str] = mapped_column(String(10), nullable=False)
    ogrn: Mapped[str] = mapped_column(String(13), nullable=False)
    kpp: Mapped[str] = mapped_column(String(9), nullable=False)
    head_full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    head_position: Mapped[str] = mapped_column(String(255), nullable=False)
    registration_address: Mapped[str] = mapped_column(Text, nullable=False)
    registration_city: Mapped[str] = mapped_column(String(255), nullable=False)
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
