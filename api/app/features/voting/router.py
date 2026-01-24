"""Voting endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_tenant, get_current_user, require_operator_or_manager
from app.features.voting import service
from app.features.voting.schemas import (
    AgendaResultsResponse,
    QuorumResponse,
    VoteCastRequest,
    VoteCastResponse,
    VoteResponse,
)

router = APIRouter()


@router.post(
    "/vote",
    response_model=VoteCastResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cast vote",
)
async def cast_vote(
    payload: VoteCastRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> VoteCastResponse:
    """Cast vote for the units linked to a QR code."""
    vote_ids = service.cast_vote(
        db,
        payload.qr_token,
        payload.agenda_id,
        payload.option_id,
        tenant_id,
    )
    return VoteCastResponse(
        agenda_id=payload.agenda_id,
        option_id=payload.option_id,
        votes_created=len(vote_ids),
        vote_ids=vote_ids,
    )


@router.post(
    "/votes/{vote_id}/invalidate",
    response_model=VoteResponse,
    summary="Invalidate vote",
    dependencies=[Depends(require_operator_or_manager)],
)
async def invalidate_vote(
    vote_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
    current_user=Depends(get_current_user),
) -> VoteResponse:
    """Invalidate a vote (audit-friendly)."""
    vote = service.invalidate_vote(db, vote_id, current_user.id, tenant_id)
    return VoteResponse.model_validate(vote)


@router.get(
    "/agendas/{agenda_id}/results",
    response_model=AgendaResultsResponse,
    summary="Get agenda results",
)
async def get_results(
    agenda_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> AgendaResultsResponse:
    """Get aggregated results for an agenda."""
    return service.calculate_results(db, agenda_id, tenant_id)


@router.get(
    "/assemblies/{assembly_id}/quorum",
    response_model=QuorumResponse,
    summary="Get assembly quorum",
)
async def get_quorum(
    assembly_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
) -> QuorumResponse:
    """Get quorum calculation for an assembly."""
    return service.calculate_quorum(db, assembly_id, tenant_id)
