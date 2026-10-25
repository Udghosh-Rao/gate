"""One-time production administrator provisioning command.

Run from apps/api with the intended production environment loaded:
`python -m app.admin_cli create-admin --email owner@example.com --name "Platform Owner"`
The password is requested interactively and is never passed in shell history.
"""

import argparse
import asyncio
from getpass import getpass

from sqlalchemy import select

from app.core.config import settings
from app.core.database import async_session_factory
from app.core.security import hash_password
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import RegisterRequest


async def create_admin(email: str, full_name: str, password: str) -> None:
    if not settings.is_production:
        raise RuntimeError("Administrator provisioning requires APP_ENV=production")
    if "sqlite" in settings.DATABASE_URL.lower():
        raise RuntimeError("Administrator provisioning requires the configured PostgreSQL database")

    credentials = RegisterRequest(email=email, full_name=full_name, password=password)
    async with async_session_factory() as session:
        existing = await session.execute(
            select(User.id).where(User.email == str(credentials.email).lower())
        )
        if existing.scalar_one_or_none() is not None:
            raise RuntimeError("An account with this email already exists; no changes were made")
        session.add(User(
            email=str(credentials.email).lower(),
            full_name=credentials.full_name,
            hashed_password=hash_password(credentials.password),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
        ))
        await session.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Provision the first production administrator")
    subparsers = parser.add_subparsers(dest="command", required=True)
    create = subparsers.add_parser("create-admin")
    create.add_argument("--email", required=True)
    create.add_argument("--name", required=True)
    args = parser.parse_args()

    password = getpass("New admin password: ")
    confirmation = getpass("Confirm password: ")
    if password != confirmation:
        parser.error("Passwords do not match")
    try:
        asyncio.run(create_admin(args.email, args.name, password))
    except Exception as exc:
        parser.error(str(exc))
    print(f"Production administrator created for {args.email}")


if __name__ == "__main__":
    main()
