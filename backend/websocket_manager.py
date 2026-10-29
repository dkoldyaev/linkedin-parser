"""WebSocket Connection Manager for Job Tracker real-time updates.

Broadcasts vacancy and queue events to connected clients in real-time,
supporting both user-scoped connections and global broadcasts.
"""

import json
import logging
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket

logger = logging.getLogger("linkedin_tracker.websocket")


class ConnectionManager:
    def __init__(self):
        # user_id -> Set of active WebSockets
        self.active_user_connections: Dict[int, Set[WebSocket]] = {}
        # Anonymous / unassociated WebSockets
        self.anonymous_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, user_id: Optional[int] = None):
        await websocket.accept()
        if user_id is not None:
            if user_id not in self.active_user_connections:
                self.active_user_connections[user_id] = set()
            self.active_user_connections[user_id].add(websocket)
            logger.info(f"WebSocket connected for user_id={user_id} (active connections for user: {len(self.active_user_connections[user_id])})")
        else:
            self.anonymous_connections.add(websocket)
            logger.info(f"Anonymous WebSocket connected (total: {len(self.anonymous_connections)})")

    def disconnect(self, websocket: WebSocket, user_id: Optional[int] = None):
        if user_id is not None and user_id in self.active_user_connections:
            self.active_user_connections[user_id].discard(websocket)
            if not self.active_user_connections[user_id]:
                del self.active_user_connections[user_id]
            logger.info(f"WebSocket disconnected for user_id={user_id}")
        else:
            self.anonymous_connections.discard(websocket)
            logger.info("Anonymous WebSocket disconnected")

    async def broadcast_to_user(self, user_id: int, message: Dict[str, Any]):
        data = json.dumps(message, ensure_ascii=False)
        targets = list(self.active_user_connections.get(user_id, set()))
        for ws in targets:
            try:
                await ws.send_text(data)
            except Exception as e:
                logger.warning(f"Error sending WebSocket message to user {user_id}: {e}")
                self.disconnect(ws, user_id)

    async def broadcast_all(self, message: Dict[str, Any]):
        data = json.dumps(message, ensure_ascii=False)
        all_targets: Set[WebSocket] = set(self.anonymous_connections)
        for user_sockets in self.active_user_connections.values():
            all_targets.update(user_sockets)
        for ws in list(all_targets):
            try:
                await ws.send_text(data)
            except Exception as e:
                logger.warning(f"Error broadcasting WebSocket message: {e}")
                self.disconnect(ws)


ws_manager = ConnectionManager()
