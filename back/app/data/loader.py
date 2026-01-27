"""
Data loading utilities and seed script
"""

import asyncio
import csv
import json
from pathlib import Path

from sqlalchemy import select

from app.db.models import CustomerBehaviorDB
from app.db.session import AsyncSessionLocal, init_db
from app.models.schemas import CustomerBehavior, FraudPolicy

DATA_DIR = Path(__file__).parent


async def load_customer_behavior() -> list[CustomerBehavior]:
    """Load customer behavior from CSV"""
    behaviors = []
    csv_path = DATA_DIR / "customer_behavior.csv"

    with open(csv_path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            behaviors.append(
                CustomerBehavior(
                    customer_id=row["customer_id"],
                    usual_amount_avg=float(row["usual_amount_avg"]),
                    usual_hours=row["usual_hours"],
                    usual_countries=row["usual_countries"],
                    usual_devices=row["usual_devices"],
                )
            )

    return behaviors


async def load_fraud_policies() -> list[FraudPolicy]:
    """Load fraud policies from JSON"""
    json_path = DATA_DIR / "fraud_policies.json"

    with open(json_path) as f:
        data = json.load(f)

    return [FraudPolicy(**policy) for policy in data]


async def seed_database():
    """Seed database with initial data"""
    print("🌱 Seeding database...")

    # Initialize database
    await init_db()
    print("✅ Database initialized")

    async with AsyncSessionLocal() as session:
        # Seed customer behavior
        behaviors = await load_customer_behavior()
        for behavior in behaviors:
            # Check if exists
            result = await session.execute(
                select(CustomerBehaviorDB).where(
                    CustomerBehaviorDB.customer_id == behavior.customer_id
                )
            )
            existing = result.scalar_one_or_none()

            if not existing:
                db_behavior = CustomerBehaviorDB(
                    customer_id=behavior.customer_id,
                    usual_amount_avg=behavior.usual_amount_avg,
                    usual_hours=behavior.usual_hours,
                    usual_countries=behavior.usual_countries,
                    usual_devices=behavior.usual_devices,
                )
                session.add(db_behavior)

        await session.commit()
        print(f"✅ Seeded {len(behaviors)} customer behaviors")

    print("🎉 Database seeding complete!")


async def get_customer_behavior(customer_id: str) -> CustomerBehavior | None:
    """Get customer behavior from database"""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(CustomerBehaviorDB).where(CustomerBehaviorDB.customer_id == customer_id)
        )
        db_behavior = result.scalar_one_or_none()

        if db_behavior:
            return CustomerBehavior(
                customer_id=db_behavior.customer_id,
                usual_amount_avg=db_behavior.usual_amount_avg,
                usual_hours=db_behavior.usual_hours,
                usual_countries=db_behavior.usual_countries,
                usual_devices=db_behavior.usual_devices,
            )

    return None


if __name__ == "__main__":
    asyncio.run(seed_database())
