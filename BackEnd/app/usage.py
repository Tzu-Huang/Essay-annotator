from sqlalchemy.orm import Session

from database.create import OpenAIUsageEvent


def record_openai_usage(
    db: Session,
    *,
    feature: str,
    model: str | None = None,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
    estimated_cost: float | None = None,
    request_id: str | None = None,
    status: str = "success",
):
    event = OpenAIUsageEvent(
        feature=feature,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        estimated_cost=estimated_cost,
        request_id=request_id,
        status=status,
    )
    db.add(event)
    return event
