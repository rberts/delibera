"""Unit tests for SSE broadcaster and generator."""
from __future__ import annotations

import asyncio

import pytest

from app.features.realtime.sse import EventBroadcaster, event_generator


class DummyRequest:
    """Minimal request stub for event_generator tests."""

    def __init__(self) -> None:
        self.disconnected = False

    async def is_disconnected(self) -> bool:
        return self.disconnected


@pytest.mark.asyncio
async def test_broadcaster_connect_broadcast_disconnect() -> None:
    broadcaster = EventBroadcaster()
    queue = await broadcaster.connect(assembly_id=123)

    await broadcaster.broadcast(assembly_id=123, event_type="vote_update", data={"count": 1})
    event = await asyncio.wait_for(queue.get(), timeout=1)

    assert event["type"] == "vote_update"
    assert event["data"] == {"count": 1}
    assert "timestamp" in event

    await broadcaster.disconnect(assembly_id=123, queue=queue)
    assert 123 not in broadcaster.connections


@pytest.mark.asyncio
async def test_event_generator_emits_event_and_stops_on_disconnect() -> None:
    queue: asyncio.Queue = asyncio.Queue()
    request = DummyRequest()

    await queue.put({"type": "agenda_update", "data": {"agenda_id": 10}})

    generator = event_generator(request, assembly_id=10, queue=queue)

    event_line = await anext(generator)
    data_line = await anext(generator)

    assert event_line == "event: agenda_update\n"
    assert data_line == 'data: {"agenda_id": 10}\n\n'

    request.disconnected = True

    with pytest.raises(StopAsyncIteration):
        await anext(generator)
