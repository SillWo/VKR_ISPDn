from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.ispdn_processing_process import ispdn_processing_processes

if TYPE_CHECKING:
    from app.models.ispdn import IspdnCard


class ProcessingProcess(Base):
    __tablename__ = "processing_processes"
    __table_args__ = (
        CheckConstraint("length(trim(name)) > 0", name="ck_processing_processes_name_not_empty"),
        CheckConstraint("length(trim(purpose_name)) > 0", name="ck_processing_processes_purpose_name_not_empty"),
        CheckConstraint(
            "length(trim(processing_period)) > 0",
            name="ck_processing_processes_processing_period_not_empty",
        ),
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
        UniqueConstraint("organization_id", "process_signature", name="uq_processing_processes_org_signature"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    purpose_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    processing_period: Mapped[str] = mapped_column(String(1000), nullable=False)
    subject_categories: Mapped[dict[str, bool]] = mapped_column(JSONB, nullable=False)
    data_categories: Mapped[dict[str, bool | str]] = mapped_column(JSONB, nullable=False)
    legal_bases: Mapped[dict[str, bool]] = mapped_column(JSONB, nullable=False)
    personal_data_actions: Mapped[dict[str, bool | str]] = mapped_column(JSONB, nullable=False)
    processing_type: Mapped[str] = mapped_column(String(32), nullable=False)
    internal_network_transfer: Mapped[str] = mapped_column(String(64), nullable=False)
    internet_transfer: Mapped[str] = mapped_column(String(64), nullable=False)
    cross_border_transfer: Mapped[bool] = mapped_column(nullable=False)
    process_signature: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    ispdn_cards: Mapped[list["IspdnCard"]] = relationship(
        secondary=ispdn_processing_processes,
        back_populates="processing_processes",
    )
