"""
Prédictions API Routes
Endpoints pour gérer les prédictions, résultats et évaluations (TinyDB)
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
from typing import Optional

from database_sqlite import get_db, save_prediction, get_predictions as get_predictions_db, save_result
from tinydb import Query as TQ

router = APIRouter(prefix='/api/predictions', tags=['predictions'])

PredQ = TQ()


# ── Prédictions ────────────────────────────────────────────────────────────

@router.post('/predictions')
def create_prediction(
    prediction_type: str,
    prediction_data: dict,
    confidence: float = 0.5,
    source: str = 'aiEngine',
):
    try:
        payload = {
            'id': int(datetime.utcnow().timestamp() * 1000),
            'type': prediction_type,
            'prediction_data': prediction_data,
            'confidence': min(1.0, max(0.0, confidence)),
            'source': source,
            'created_at': datetime.utcnow().isoformat()
        }
        save_prediction(payload)
        return {'success': True, 'data': payload}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/predictions')
def get_predictions(
    pred_type: Optional[str] = Query(None),
    limit: int = 50,
):
    predictions = get_predictions_db()
    if pred_type:
        predictions = [p for p in predictions if p.get('type') == pred_type]
    predictions = sorted(predictions, key=lambda p: p.get('created_at', ''), reverse=True)[:limit]
    return {'success': True, 'count': len(predictions), 'data': predictions}


@router.get('/predictions/active')
def get_active_predictions():
    predictions = get_predictions_db()
    return {'success': True, 'count': len(predictions), 'data': predictions}


@router.get('/predictions/{prediction_id}')
def get_prediction(prediction_id: str):
    predictions = get_predictions_db()
    for p in predictions:
        if str(p.get('id')) == str(prediction_id):
            return {'success': True, 'data': p}
    raise HTTPException(status_code=404, detail='Prediction not found')


# ── Résultats ──────────────────────────────────────────────────────────────

@router.post('/results')
def create_result(result_type: str, result_data: dict, source: str = 'api'):
    try:
        payload = {
            'id': int(datetime.utcnow().timestamp() * 1000),
            'type': result_type,
            'result_data': result_data,
            'source': source,
            'draw_date': datetime.utcnow().isoformat(),
        }
        save_result(payload)
        return {'success': True, 'data': payload}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/results')
def get_results(result_type: Optional[str] = Query(None), limit: int = 50):
    db = get_db()
    results = db.table('results').all()
    if result_type:
        results = [r for r in results if r.get('type') == result_type]
    results = sorted(results, key=lambda r: r.get('draw_date', ''), reverse=True)[:limit]
    return {'success': True, 'count': len(results), 'data': results}


# ── Health ─────────────────────────────────────────────────────────────────

@router.get('/health')
def health_check():
    return {'success': True, 'service': 'predictions-api', 'status': 'running'}
