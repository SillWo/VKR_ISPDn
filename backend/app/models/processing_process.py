from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.ispdn import IspdnCard
    from app.models.processing_purpose import ProcessingPurpose


class ProcessingProcess(Base):
    __tablename__ = "processing_processes"
    __table_args__ = (
        CheckConstraint(
            "processing_type IN ('automated', 'non_automated', 'mixed')",
            name="ck_processing_processes_processing_type",
        ),
        CheckConstraint(
            "internal_network_transfer IN ('no_internal_network_transfer', 'with_internal_network_transfer')",
            name="ck_processing_processes_internal_network_transfer",
        ),
        CheckConstraint(
            "internet_transfer IN ('no_internet_transfer', 'with_internet_transfer')",
            name="ck_processing_processes_internet_transfer",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    ispdn_id: Mapped[int] = mapped_column(
        ForeignKey("ispdn_cards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    processing_purpose_id: Mapped[int] = mapped_column(
        ForeignKey("processing_purposes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    subject_categories: Mapped[dict[str, bool]] = mapped_column(JSONB, nullable=False)
    data_categories: Mapped[dict[str, bool | str]] = mapped_column(JSONB, nullable=False)
    legal_bases: Mapped[dict[str, bool]] = mapped_column(JSONB, nullable=False)
    personal_data_actions: Mapped[dict[str, bool | str]] = mapped_column(JSONB, nullable=False)
    processing_type: Mapped[str] = mapped_column(String(32), nullable=False)
    internal_network_transfer: Mapped[str] = mapped_column(String(64), nullable=False)
    internet_transfer: Mapped[str] = mapped_column(String(64), nullable=False)
    cross_border_transfer: Mapped[bool] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    ispdn: Mapped["IspdnCard"] = relationship(back_populates="processing_processes")
    processing_purpose: Mapped["ProcessingPurpose"] = relationship(back_populates="processing_processes")
