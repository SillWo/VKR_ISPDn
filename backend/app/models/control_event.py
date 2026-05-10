from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ControlEvent(Base):
    __tablename__ = "control_events"
    __table_args__ = (
        CheckConstraint("length(trim(name)) > 0", name="ck_control_events_name_not_empty"),
        CheckConstraint("length(trim(description)) > 0", name="ck_control_events_description_not_empty"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    files: Mapped[list["ControlEventFile"]] = relationship(
        back_populates="control_event",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by=lambda: ControlEventFile.created_at.desc(),
    )


class ControlEventFile(Base):
    __tablename__ = "control_event_files"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    control_event_id: Mapped[int] = mapped_column(
        ForeignKey("control_events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_path: Mapped[str] = mapped_column(String(2048), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_content_type: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())

    control_event: Mapped[ControlEvent] = relationship(back_populates="files")
