import asyncio
import logging
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..database import SessionLocal
from ..models.user import DataSource
from ..models.sync import SyncStrategy
from ..services.sync_service import SyncService

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self):
        self.sync_service = SyncService()
        self.running = False
        self.task = None
    
    async def start(self):
        """Start the background scheduler"""
        if self.running:
            return
        
        self.running = True
        self.task = asyncio.create_task(self._scheduler_loop())
        logger.info("Scheduler service started")
    
    async def stop(self):
        """Stop the background scheduler"""
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("Scheduler service stopped")
    
    async def _scheduler_loop(self):
        """Main scheduler loop"""
        while self.running:
            try:
                await self._process_scheduled_syncs()
                # Check every 5 minutes
                await asyncio.sleep(300)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    async def _process_scheduled_syncs(self):
        """Process data sources that need syncing"""
        db = SessionLocal()
        try:
            # Find data sources that need syncing
            now = datetime.utcnow()
            
            # Get sources that are due for sync
            due_sources = db.query(DataSource).filter(
                and_(
                    DataSource.is_active == True,
                    DataSource.sync_status != 'running',
                    DataSource.next_sync_at <= now
                )
            ).all()
            
            logger.info(f"Found {len(due_sources)} data sources due for sync")
            
            # Process each source
            for data_source in due_sources:
                try:
                    logger.info(f"Starting scheduled sync for data source {data_source.id} ({data_source.source_type})")
                    
                    # Determine sync strategy
                    strategy = self._get_sync_strategy(data_source)
                    
                    # Perform sync
                    result = await self.sync_service.sync_data_source(db, data_source, strategy)
                    
                    logger.info(f"Completed sync for data source {data_source.id}: {result.status.value}")
                    
                except Exception as e:
                    logger.error(f"Error syncing data source {data_source.id}: {e}")
                    
                    # Update error status
                    data_source.sync_status = 'error'
                    data_source.sync_message = f"Scheduled sync failed: {str(e)}"
                    data_source.next_sync_at = now + timedelta(hours=1)  # Retry in 1 hour
                    db.commit()
            
        finally:
            db.close()
    
    def _get_sync_strategy(self, data_source: DataSource) -> SyncStrategy:
        """Determine the appropriate sync strategy"""
        # If it's been more than a week since last sync, do full sync
        if not data_source.last_sync or \
           (datetime.utcnow() - data_source.last_sync).days > 7:
            return SyncStrategy.FULL
        
        # If we have a sync token, try incremental
        if data_source.last_sync_token:
            return SyncStrategy.INCREMENTAL
        
        # Default to incremental if we have a recent sync
        return SyncStrategy.INCREMENTAL
    
    async def schedule_immediate_sync(self, db: Session, data_source_id: int):
        """Schedule an immediate sync for a data source"""
        data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
        if data_source:
            data_source.next_sync_at = datetime.utcnow()
            db.commit()
            logger.info(f"Scheduled immediate sync for data source {data_source_id}")
    
    async def schedule_sync_in(self, db: Session, data_source_id: int, minutes: int):
        """Schedule a sync for a data source in X minutes"""
        data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
        if data_source:
            data_source.next_sync_at = datetime.utcnow() + timedelta(minutes=minutes)
            db.commit()
            logger.info(f"Scheduled sync for data source {data_source_id} in {minutes} minutes")

# Global scheduler instance
scheduler = SchedulerService()