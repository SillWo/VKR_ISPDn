from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, String, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.ispdn import IspdnCard


ispdn_data_centers = Table(
    "ispdn_data_centers",
    Base.metadata,
    Column(
        "ispdn_id",
        Integer,
        ForeignKey("ispdn_cards.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "data_center_id",
        Integer,
        ForeignKey("data_centers.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("created_at", DateTime(timezone=False), nullable=False, server_default=func.now()),
)


class DataCenter(Base):
    __tablename__ = "data_centers"
    __table_args__ = (
        CheckConstraint("length(trim(name)) > 0", name="ck_data_centers_name_not_empty"),
        CheckConstraint(
            "length(trim(location_country)) > 0",
            name="ck_data_centers_location_country_not_empty",
        ),
        CheckConstraint(
            "length(trim(location_address)) > 0",
            name="ck_data_centers_location_address_not_empty",
        ),
        CheckConstraint(
            (
                "owner_organization_type IN "
                "('individual', 'foreign_organization', 'individual_entrepreneur', 'legal_entity') "
                "OR owner_organization_type IS NULL"
            ),
            name="ck_data_centers_owner_organization_type",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    location_country: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    location_address: Mapped[str] = mapped_column(String(1000), nullable=False)
    is_own_data_center: Mapped[bool] = mapped_column(Boolean, nullable=False, index=True)
    owner_organization_type: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    owner_person_full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    owner_organization_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    owner_ogrnip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    owner_ogrn: Mapped[str | None] = mapped_column(String(64), nullable=True)
    owner_inn: Mapped[str | None] = mapped_column(String(64), nullable=True)
    owner_location_country: Mapped[str | None] = mapped_column(String(255), nullable=True)
    owner_location_address: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    ispdn_cards: Mapped[list["IspdnCard"]] = relationship(
        secondary=ispdn_data_centers,
        back_populates="data_centers",
    )

    @property
    def owner_display_name(self) -> str:
        if self.is_own_data_center:
            return "Собственный ЦОД"
        if self.owner_organization_type in {"individual", "individual_entrepreneur"}:
            return self.owner_person_full_name or ""
        return self.owner_organization_name or ""
