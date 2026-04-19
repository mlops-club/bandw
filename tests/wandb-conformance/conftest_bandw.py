"""conftest override for running W&B SDK system tests against bandw.

Used by scripts/run-sdk-conformance-tests.sh. This file replaces the upstream
conftest.py that requires W&B's proprietary fixture service (port 9015).

Instead, it uses hardcoded credentials for the seeded admin user in bandw and
stubs out the fixture factory so no fixture service is needed.
"""

from __future__ import annotations

import contextlib
import os
from collections.abc import Generator, Iterator

import pytest
import wandb

from tests.fixtures.wandb_backend_spy import (
    WandbBackendProxy,
    WandbBackendSpy,
    spy_proxy,
)

BANDW_BASE_URL = os.environ["BANDW_BASE_URL"]
BANDW_API_KEY = os.environ["BANDW_API_KEY"]
BANDW_ENTITY = os.environ.get("BANDW_ENTITY", "admin")
BANDW_USERNAME = os.environ.get("BANDW_USERNAME", "admin")


class _FakeBackendAddress:
    def __init__(self):
        from urllib.parse import urlparse

        parsed = urlparse(BANDW_BASE_URL)
        self.host = parsed.hostname
        self.base_port = parsed.port
        self.fixture_port = 0

    @property
    def base_url(self):
        return BANDW_BASE_URL


@pytest.fixture(scope="session")
def local_wandb_backend():
    return _FakeBackendAddress()


@pytest.fixture(scope="session")
def use_local_wandb_backend():
    with pytest.MonkeyPatch.context() as mp:
        mp.setenv("WANDB_BASE_URL", BANDW_BASE_URL)
        yield


class _StubFixtureFactory:
    def make_user(self, name=None, admin=False):
        return BANDW_USERNAME

    def make_org(self, name=None, *, username):
        return name or "default-org"

    def make_team(self, name=None, *, username, org_name=None, plan_name=None):
        from tests.system_tests.backend_fixtures import TeamAndOrgNames

        return TeamAndOrgNames(
            team=name or "default-team",
            org=org_name or "default-org",
        )

    def send_cmds(self, *cmds):
        pass

    def cleanup(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass


@pytest.fixture(scope="session")
def backend_fixture_factory(worker_id, local_wandb_backend, use_local_wandb_backend):
    _ = use_local_wandb_backend
    with _StubFixtureFactory() as factory:
        yield factory


@contextlib.contextmanager
def _user() -> Iterator[str]:
    with pytest.MonkeyPatch.context() as mp:
        mp.setenv("WANDB_API_KEY", BANDW_API_KEY)
        mp.setenv("WANDB_ENTITY", BANDW_ENTITY)
        mp.setenv("WANDB_USERNAME", BANDW_USERNAME)
        yield BANDW_USERNAME


@pytest.fixture
def user(request):
    if "module_user" in request.fixturenames:
        raise AssertionError("Cannot use `user` and `module_user` fixtures together.")
    with _user() as u:
        yield u


@pytest.fixture(scope="module")
def module_user():
    with _user() as u:
        yield u


@pytest.fixture
@pytest.mark.usefixtures("skip_verify_login")
def api(user):
    return wandb.Api(api_key=BANDW_API_KEY)


@pytest.fixture
def module_api(make_module_api):
    return make_module_api()


@pytest.fixture(scope="module")
@pytest.mark.usefixtures("skip_verify_login")
def make_module_api(module_user):
    def callback():
        return wandb.Api(api_key=BANDW_API_KEY)

    return callback


def pytest_addoption(parser):
    parser.addoption("--wandb-verbose", action="store_true", default=False)


@pytest.fixture(scope="session")
def wandb_verbose(request):
    return request.config.getoption("--wandb-verbose", default=False)


@pytest.fixture(scope="session")
def wandb_backend_proxy_server(local_wandb_backend):
    with spy_proxy(
        target_host=local_wandb_backend.host,
        target_port=local_wandb_backend.base_port,
    ) as proxy:
        yield proxy


@pytest.fixture(scope="function")
def wandb_backend_spy(
    user,
    wandb_backend_proxy_server: WandbBackendProxy,
    monkeypatch: pytest.MonkeyPatch,
) -> Generator[WandbBackendSpy, None, None]:
    _ = user
    monkeypatch.setenv(
        "WANDB_BASE_URL",
        f"http://127.0.0.1:{wandb_backend_proxy_server.port}",
    )
    with wandb_backend_proxy_server.spy() as spy:
        yield spy
