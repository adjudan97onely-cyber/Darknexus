import asyncio
import traceback
from datetime import datetime

from db import save_scheduler_log


class SchedulerService:
    def __init__(self, data_service, prediction_service):
        self.data_service = data_service
        self.prediction_service = prediction_service
        self._task = None
        self._running = False
        self._last_runs = {
            "sync": None,
            "reconcile": None,
        }

    async def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def run_sync_now(self):
        try:
            result = await self.data_service.refresh_external_feeds()
            self._last_runs["sync"] = datetime.utcnow().isoformat()
            save_scheduler_log("sync_feeds", "ok", str(result))
            return result
        except Exception as exc:
            save_scheduler_log("sync_feeds", "error", str(exc))
            return []

    async def run_reconcile_now(self):
        try:
            result = self.prediction_service.reconcile_predictions()
            self._last_runs["reconcile"] = datetime.utcnow().isoformat()
            save_scheduler_log("reconcile_predictions", "ok", f"{len(result)} updates")
            return result
        except Exception as exc:
            save_scheduler_log("reconcile_predictions", "error", str(exc))
            return []

    def status(self):
        return {
            "running": self._running,
            "last_runs": self._last_runs,
        }

    async def _loop(self):
        sync_interval_sec = 60 * 15
        reconcile_interval_sec = 60 * 10
        last_sync_tick = 0
        last_reconcile_tick = 0
        tick = 0

        while self._running:
            try:
                if tick - last_sync_tick >= sync_interval_sec:
                    await self.run_sync_now()
                    last_sync_tick = tick

                if tick - last_reconcile_tick >= reconcile_interval_sec:
                    await self.run_reconcile_now()
                    last_reconcile_tick = tick

                await asyncio.sleep(5)
                tick += 5
            except asyncio.CancelledError:
                break
            except Exception as exc:
                save_scheduler_log("scheduler_loop", "error", f"{exc}\n{traceback.format_exc()}")
                await asyncio.sleep(5)
