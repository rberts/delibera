"""
Server-Sent Events (SSE) for real-time updates.
Single global connection broadcasts events to operator dashboard.
"""
from __future__ import annotations

import asyncio
import json
from datetime import datetime
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_tenant, get_current_user
from app.features.assemblies.models import Assembly
from app.features.condominiums.models import Condominium

router = APIRouter()


class EventBroadcaster:
    """Manages SSE connections and broadcasts events."""

    def __init__(self) -> None:
        self.connections: dict[int, set[asyncio.Queue]] = {}

    async def connect(self, assembly_id: int) -> asyncio.Queue:
        """Add new connection for an assembly."""
        queue: asyncio.Queue = asyncio.Queue()
        self.connections.setdefault(assembly_id, set()).add(queue)
        return queue

    async def disconnect(self, assembly_id: int, queue: asyncio.Queue) -> None:
        """Remove connection."""
        if assembly_id in self.connections:
            self.connections[assembly_id].discard(queue)
            if not self.connections[assembly_id]:
                del self.connections[assembly_id]

    async def broadcast(self, assembly_id: int, event_type: str, data: dict) -> None:
        """Broadcast event to all connections for an assembly."""
        if assembly_id not in self.connections:
            return

        event = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }

        for queue in self.connections[assembly_id]:
            await queue.put(event)


broadcaster = EventBroadcaster()


async def event_generator(
    request: Request,
    assembly_id: int,
    queue: asyncio.Queue,
) -> AsyncGenerator[str, None]:
    """Generate SSE events from queue."""
    try:
        while True:
            if await request.is_disconnected():
                break

            try:
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield f"event: {event['type']}\n"
                yield f"data: {json.dumps(event['data'])}\n\n"
            except asyncio.TimeoutError:
                yield "event: heartbeat\n"
                yield f"data: {json.dumps({'status': 'alive'})}\n\n"
    finally:
        await broadcaster.disconnect(assembly_id, queue)


@router.get("/assemblies/{assembly_id}/stream")
async def stream_events(
    assembly_id: int,
    request: Request,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
    current_user=Depends(get_current_user),
) -> StreamingResponse:
    """SSE endpoint for real-time assembly updates."""
    assembly = (
        db.query(Assembly)
        .join(Condominium, Assembly.condominium_id == Condominium.id)
        .filter(
            Assembly.id == assembly_id,
            Condominium.tenant_id == tenant_id,
        )
        .first()
    )
    if not assembly:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assembly not found")

    queue = await broadcaster.connect(assembly_id)
    return StreamingResponse(
        event_generator(request, assembly_id, queue),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def notify_vote_cast(assembly_id: int, agenda_id: int, votes_count: int) -> None:
    """Notify vote was cast."""
    await broadcaster.broadcast(
        assembly_id,
        "vote_update",
        {"agenda_id": agenda_id, "votes_count": votes_count},
    )


async def notify_checkin(assembly_id: int, units_present: int, fraction_present: float) -> None:
    """Notify new check-in."""
    await broadcaster.broadcast(
        assembly_id,
        "checkin_update",
        {"units_present": units_present, "fraction_present": fraction_present},
    )


async def notify_agenda_status(assembly_id: int, agenda_id: int, status_value: str) -> None:
    """Notify agenda status changed (opened/closed)."""
    await broadcaster.broadcast(
        assembly_id,
        "agenda_update",
        {"agenda_id": agenda_id, "status": status_value},
    )
