"""Seed MongoDB from CSV data files."""

import asyncio
import csv
from datetime import datetime
from pathlib import Path

from app.core.config import DATA_DIR
from app.core.database import close_db, connect_db, get_database
from app.domain.models import CustomerBehavior, MerchantProfile, Transaction
from app.infrastructure.merchants.merchant_store import MerchantStore
from app.repositories.mongo_repositories import MerchantRepository, TransactionRepository


async def run_seed() -> None:
    await connect_db()
    db = get_database()
    repo = TransactionRepository(db)
    merchant_repo = MerchantRepository(db)

    tx_path = DATA_DIR / "transactions.csv"
    behavior_path = DATA_DIR / "customer_behavior.csv"

    with open(tx_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            tx = Transaction(
                transaction_id=row["transaction_id"],
                customer_id=row["customer_id"],
                amount=float(row["amount"]),
                currency=row["currency"],
                country=row["country"],
                channel=row["channel"],
                device_id=row["device_id"],
                timestamp=datetime.fromisoformat(row["timestamp"]),
                merchant_id=row["merchant_id"],
            )
            await repo.upsert_transaction(tx)

    with open(behavior_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            behavior = CustomerBehavior(
                customer_id=row["customer_id"],
                usual_amount_avg=float(row["usual_amount_avg"]),
                usual_hours=row["usual_hours"],
                usual_countries=row["usual_countries"],
                usual_devices=row["usual_devices"],
            )
            await repo.upsert_behavior(behavior)

    for merchant in MerchantStore().list_all():
        await merchant_repo.upsert(merchant)

    print(f"Seeded data from {DATA_DIR}")


def main() -> None:
    asyncio.run(run_seed())
    asyncio.run(close_db())


if __name__ == "__main__":
    main()
