from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.ispdn import IspdnCard
    from app.models.processing_process import ProcessingProcess

from app.models.ispdn_processing_purpose import ispdn_processing_purposes


class ProcessingPurpose(Base):
    __tablename__ = "processing_purposes"
    __table_args__ = (
        CheckConstraint("length(trim(name)) > 0", name="ck_processing_purposes_name_not_empty"),
        CheckConstraint(
            "length(trim(processing_period)) > 0",
            name="ck_processing_purposes_processing_period_not_empty",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    processing_period: Mapped[str] = mapped_column(String(1000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    processing_processes: Mapped[list["ProcessingProcess"]] = relationship(back_populates="processing_purpose")
    ispdn_cards: Mapped[list["IspdnCard"]] = relationship(
        secondary=ispdn_processing_purposes,
        back_populates="processing_purpose_options",
    )
