from datetime import date, datetime

from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.crypto_tool import CryptoTool, IspdnCryptographySettings
    from app.models.employee import Employee
    from app.models.data_center import DataCenter
    from app.models.processing_process import ProcessingProcess
    from app.models.processing_purpose import ProcessingPurpose
    from app.models.security_level import SecurityLevelRecord
    from app.models.security_measure import (
        IspdnSecurityTools,
        TechnicalSecurityMeasureDocument,
        TechnicalSecurityMeasureRecord,
    )
    from app.models.task_event import TaskEvent

from app.models.ispdn_processing_purpose import ispdn_processing_purposes
from app.models.data_center import ispdn_data_centers
from app.models.crypto_tool import ispdn_crypto_tools


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
    responsible_employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
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

    responsible_employee: Mapped["Employee | None"] = relationship(
        back_populates="responsible_ispdn_cards",
    )
    processing_processes: Mapped[list["ProcessingProcess"]] = relationship(
        back_populates="ispdn",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    security_level_record: Mapped["SecurityLevelRecord | None"] = relationship(
        back_populates="ispdn",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )
    security_tools: Mapped["IspdnSecurityTools | None"] = relationship(
        back_populates="ispdn",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )
    technical_security_measure_records: Mapped[list["TechnicalSecurityMeasureRecord"]] = relationship(
        back_populates="ispdn",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    technical_security_measure_documents: Mapped[list["TechnicalSecurityMeasureDocument"]] = relationship(
        back_populates="ispdn",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    processing_purpose_options: Mapped[list["ProcessingPurpose"]] = relationship(
        secondary=ispdn_processing_purposes,
        back_populates="ispdn_cards",
    )
    data_centers: Mapped[list["DataCenter"]] = relationship(
        secondary=ispdn_data_centers,
        back_populates="ispdn_cards",
    )
    crypto_tools: Mapped[list["CryptoTool"]] = relationship(
        secondary=ispdn_crypto_tools,
        back_populates="ispdn_cards",
    )
    cryptography_settings: Mapped["IspdnCryptographySettings | None"] = relationship(
        back_populates="ispdn",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )
    task_events: Mapped[list["TaskEvent"]] = relationship(
        back_populates="ispdn",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    @property
    def processing_purpose_ids(self) -> list[int]:
        return [purpose.id for purpose in self.processing_purpose_options]
