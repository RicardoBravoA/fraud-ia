"""Clear evaluation results so you can re-run the pipeline with fresh LLM output.

Keeps transactions, customer profiles, and merchants intact.
"""

import asyncio

from app.core.database import close_db, connect_db, get_database


async def run_reset() -> None:
    await connect_db()
    db = get_database()

    collections = ("evaluations", "audit_events", "hitl_cases")
    for name in collections:
        result = await db[name].delete_many({})
        print(f"Cleared {result.deleted_count} documents from '{name}'")

    print("Done. Transactions and customer data were not touched.")
    print("Re-evaluate via API or: python -m scripts.reevaluate_demo")


def main() -> None:
    asyncio.run(run_reset())
    asyncio.run(close_db())


if __name__ == "__main__":
    main()
