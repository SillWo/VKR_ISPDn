from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, String, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.ispdn import IspdnCard


ispdn_crypto_tools = Table(
    "ispdn_crypto_tools",
    Base.metadata,
    Column(
        "ispdn_id",
        Integer,
        ForeignKey("ispdn_cards.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "crypto_tool_id",
        Integer,
        ForeignKey("crypto_tools.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("created_at", DateTime(timezone=False), nullable=False, server_default=func.now()),
)


class CryptoTool(Base):
    __tablename__ = "crypto_tools"
    __table_args__ = (
        CheckConstraint("length(trim(name)) > 0", name="ck_crypto_tools_name_not_empty"),
        CheckConstraint("length(trim(manufacturer)) > 0", name="ck_crypto_tools_manufacturer_not_empty"),
        CheckConstraint("length(trim(serial_number)) > 0", name="ck_crypto_tools_serial_number_not_empty"),
        CheckConstraint(
            "crypto_class IN ('KS1', 'KS2', 'KS3', 'KV', 'KA')",
            name="ck_crypto_tools_crypto_class",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    crypto_class: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    manufacturer: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    serial_number: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    ispdn_cards: Mapped[list["IspdnCard"]] = relationship(
        secondary=ispdn_crypto_tools,
        back_populates="crypto_tools",
    )


class IspdnCryptographySettings(Base):
    __tablename__ = "ispdn_cryptography_settings"

    ispdn_id: Mapped[int] = mapped_column(
        ForeignKey("ispdn_cards.id", ondelete="CASCADE"),
        primary_key=True,
    )
    uses_cryptography: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    ispdn: Mapped["IspdnCard"] = relationship(back_populates="cryptography_settings")

    @property
    def crypto_tools(self) -> list[CryptoTool]:
        return sorted(self.ispdn.crypto_tools, key=lambda item: (item.name, item.id)) if self.ispdn else []
