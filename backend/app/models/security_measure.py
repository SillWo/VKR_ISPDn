from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, CheckConstraint, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.ispdn import IspdnCard


class IspdnSecurityTools(Base):
    __tablename__ = "ispdn_security_tools"
    __table_args__ = (UniqueConstraint("ispdn_id", name="uq_ispdn_security_tools_ispdn_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    ispdn_id: Mapped[int] = mapped_column(
        ForeignKey("ispdn_cards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    dlp: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    siem: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    antivirus: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    ips_ids: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    firewall_utm_ngfw: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    vulnerability_scanner: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    backup_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    trusted_boot: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    access_control: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    physical_security: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    other_security_tools: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    ispdn: Mapped["IspdnCard"] = relationship(back_populates="security_tools")


class TechnicalSecurityMeasureRecord(Base):
    __tablename__ = "technical_security_measure_records"
    __table_args__ = (
        CheckConstraint(
            "factual_status IN ('implemented', 'not_implemented')",
            name="ck_technical_security_measure_records_factual_status",
        ),
        UniqueConstraint("ispdn_id", "measure_code", name="uq_technical_security_measure_records_ispdn_measure"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    ispdn_id: Mapped[int] = mapped_column(
        ForeignKey("ispdn_cards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    measure_code: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    factual_status: Mapped[str] = mapped_column(String(32), nullable=False, default="not_implemented")
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    ispdn: Mapped["IspdnCard"] = relationship(back_populates="technical_security_measure_records")


class TechnicalSecurityMeasureDocument(Base):
    __tablename__ = "technical_security_measure_documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    ispdn_id: Mapped[int] = mapped_column(
        ForeignKey("ispdn_cards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_path: Mapped[str] = mapped_column(String(2048), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_content_type: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())

    ispdn: Mapped["IspdnCard"] = relationship(back_populates="technical_security_measure_documents")
