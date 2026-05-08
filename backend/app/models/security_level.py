from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.ispdn import IspdnCard


class SecurityLevelRecord(Base):
    __tablename__ = "security_level_records"
    __table_args__ = (
        CheckConstraint("subject_count_range IN ('more_than_100k', 'less_than_100k')", name="ck_security_level_subject_count_range"),
        CheckConstraint("threat_type IN ('threat_type_1', 'threat_type_2', 'threat_type_3')", name="ck_security_level_threat_type"),
        CheckConstraint("subject_group IN ('clients_only', 'employees_only', 'employees_and_clients')", name="ck_security_level_subject_group"),
        CheckConstraint("recommended_level IN (1, 2, 3, 4)", name="ck_security_level_recommended_level"),
        CheckConstraint("actual_level IN (1, 2, 3, 4)", name="ck_security_level_actual_level"),
        UniqueConstraint("ispdn_id", name="uq_security_level_records_ispdn_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    ispdn_id: Mapped[int] = mapped_column(
        ForeignKey("ispdn_cards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    data_categories: Mapped[dict[str, bool]] = mapped_column(JSONB, nullable=False)
    primary_data_category: Mapped[str] = mapped_column(String(32), nullable=False)
    subject_count_range: Mapped[str] = mapped_column(String(32), nullable=False)
    threat_type: Mapped[str] = mapped_column(String(32), nullable=False)
    subject_group: Mapped[str] = mapped_column(String(32), nullable=False)
    employee_only: Mapped[bool] = mapped_column(Boolean, nullable=False)
    recommended_level: Mapped[int] = mapped_column(Integer, nullable=False)
    actual_level: Mapped[int] = mapped_column(Integer, nullable=False)
    actual_level_matches_recommended: Mapped[bool] = mapped_column(Boolean, nullable=False)
    deviation_justification_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    deviation_justification_file_path: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    deviation_justification_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    deviation_justification_file_content_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    ispdn: Mapped["IspdnCard"] = relationship(back_populates="security_level_record")
