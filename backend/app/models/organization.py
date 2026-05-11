from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.employee import Employee


class OrganizationCard(Base):
    __tablename__ = "organization_card"
    __table_args__ = (
        CheckConstraint("id = 1", name="ck_organization_card_singleton_id"),
        CheckConstraint(
            (
                "personal_data_processing_termination_type IN ('end_date', 'end_condition') "
                "OR personal_data_processing_termination_type IS NULL"
            ),
            name="ck_organization_card_processing_termination_type",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    short_legal_name: Mapped[str] = mapped_column(String(255), nullable=False)
    full_legal_name: Mapped[str] = mapped_column(Text, nullable=False)
    inn: Mapped[str] = mapped_column(String(10), nullable=False)
    ogrn: Mapped[str] = mapped_column(String(13), nullable=False)
    kpp: Mapped[str] = mapped_column(String(9), nullable=False)
    head_full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    head_position: Mapped[str | None] = mapped_column(String(255), nullable=True)
    head_employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )
    registration_address: Mapped[str] = mapped_column(Text, nullable=False)
    registration_city: Mapped[str] = mapped_column(String(255), nullable=False)
    okved: Mapped[str | None] = mapped_column(String(32), nullable=True)
    operator_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    head_office_region: Mapped[str | None] = mapped_column(String(255), nullable=True)
    activity_regions: Mapped[str | None] = mapped_column(Text, nullable=True)
    postal_address_matches_registration: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )
    postal_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    fax: Mapped[str | None] = mapped_column(String(32), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    okpo: Mapped[str | None] = mapped_column(String(32), nullable=True)
    okfs: Mapped[str | None] = mapped_column(String(32), nullable=True)
    okogu: Mapped[str | None] = mapped_column(String(32), nullable=True)
    okopf: Mapped[str | None] = mapped_column(String(32), nullable=True)
    document_approver_employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )
    information_security_responsible_employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )
    personal_data_processing_responsible_employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )
    personal_data_processing_termination_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    personal_data_processing_termination_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    personal_data_processing_termination_condition: Mapped[str | None] = mapped_column(Text, nullable=True)
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

    okveds: Mapped[list["OrganizationOkved"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
        order_by="OrganizationOkved.sort_order",
    )
    branches: Mapped[list["OrganizationBranch"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
        order_by="OrganizationBranch.sort_order",
    )
    document_approver_employee: Mapped["Employee | None"] = relationship(
        foreign_keys=[document_approver_employee_id],
    )
    head_employee: Mapped["Employee | None"] = relationship(
        foreign_keys=[head_employee_id],
    )
    information_security_responsible_employee: Mapped["Employee | None"] = relationship(
        foreign_keys=[information_security_responsible_employee_id],
    )
    personal_data_processing_responsible_employee: Mapped["Employee | None"] = relationship(
        foreign_keys=[personal_data_processing_responsible_employee_id],
    )


class OrganizationOkved(Base):
    __tablename__ = "organization_okveds"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organization_card.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
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

    organization: Mapped[OrganizationCard] = relationship(back_populates="okveds")


class OrganizationBranch(Base):
    __tablename__ = "organization_branches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organization_card.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    postal_address: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False)
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

    organization: Mapped[OrganizationCard] = relationship(back_populates="branches")
