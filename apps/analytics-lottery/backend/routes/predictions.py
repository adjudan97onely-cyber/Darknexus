"""
Prédictions API Routes
Endpoints pour gérer les prédictions, résultats et évaluations
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional

from database_sqlite import get_db_session, save_prediction, get_predictions as get_predictions_db
from models.predictions_model import Prediction, Result, Evaluation

router = APIRouter(prefix='/api/predictions', tags=['predictions'])


# ============ PRÉDICTIONS ============

@router.post('/predictions')
def create_prediction(
    prediction_type: str,
    prediction_data: dict,
    confidence: float = 0.5,
    source: str = 'aiEngine',
    db: Session = Depends(get_db_session)
):
    """Crée une nouvelle prédiction"""
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
        
        return {
            'success': True,
            'data': payload
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/predictions')
def get_predictions(
    pred_type: Optional[str] = Query(None),
    limit: int = 50,
    db: Session = Depends(get_db_session)
):
    """Récupère les prédictions"""
    predictions = get_predictions_db()
    if pred_type:
        predictions = [p for p in predictions if p.get('type') == pred_type]
    predictions = sorted(
        predictions,
        key=lambda p: p.get('created_at', ''),
        reverse=True
    )[:limit]
    
    return {
        'success': True,
        'count': len(predictions),
        'data': predictions
    }


@router.get('/predictions/active')
def get_active_predictions(
    db: Session = Depends(get_db_session)
):
    """Récupère les prédictions non évaluées"""
    # Prédictions sans évaluation associée
    active = db.query(Prediction).filter(
        ~Prediction.id.in_(
            db.query(Evaluation.prediction_id).distinct()
        )
    ).order_by(Prediction.created_at.desc()).all()
    
    return {
        'success': True,
        'count': len(active),
        'data': [p.to_dict() for p in active]
    }


@router.get('/predictions/{prediction_id}')
def get_prediction(prediction_id: int, db: Session = Depends(get_db_session)):
    """Récupère une prédiction par ID"""
    pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    
    if not pred:
        raise HTTPException(status_code=404, detail='Prediction not found')
    
    return {
        'success': True,
        'data': pred.to_dict()
    }


@router.delete('/predictions/{prediction_id}')
def delete_prediction(prediction_id: int, db: Session = Depends(get_db_session)):
    """Supprime une prédiction"""
    pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    
    if not pred:
        raise HTTPException(status_code=404, detail='Prediction not found')
    
    db.delete(pred)
    db.commit()
    
    return {'success': True, 'message': 'Prediction deleted'}


# ============ RÉSULTATS ============

@router.post('/results')
def create_result(
    result_type: str,
    draw_date: datetime,
    result_data: dict,
    source: str = 'api',
    db: Session = Depends(get_db_session)
):
    """Enregistre un résultat réel"""
    try:
        result = Result(
            type=result_type,
            draw_date=draw_date,
            result_data=result_data,
            source=source
        )
        db.add(result)
        db.commit()
        db.refresh(result)
        
        return {
            'success': True,
            'data': result.to_dict()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/results')
def get_results(
    result_type: Optional[str] = Query(None),
    days: int = 30,
    limit: int = 50,
    db: Session = Depends(get_db_session)
):
    """Récupère les résultats"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    query = db.query(Result).filter(Result.draw_date >= cutoff_date)
    
    if result_type:
        query = query.filter(Result.type == result_type)
    
    results = query.order_by(Result.draw_date.desc()).limit(limit).all()
    
    return {
        'success': True,
        'count': len(results),
        'data': [r.to_dict() for r in results]
    }


@router.get('/results/{result_id}')
def get_result(result_id: int, db: Session = Depends(get_db_session)):
    """Récupère un résultat par ID"""
    result = db.query(Result).filter(Result.id == result_id).first()
    
    if not result:
        raise HTTPException(status_code=404, detail='Result not found')
    
    return {
        'success': True,
        'data': result.to_dict()
    }


# ============ ÉVALUATIONS ============

@router.post('/evaluations')
def create_evaluation(
    prediction_id: int,
    result_id: int,
    eval_type: str,
    success: bool,
    score: float,
    feedback: str = '',
    evaluation_data: dict = None,
    db: Session = Depends(get_db_session)
):
    """Crée une évaluation"""
    # Vérifier que prédiction et résultat existent
    pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    result = db.query(Result).filter(Result.id == result_id).first()
    
    if not pred or not result:
        raise HTTPException(status_code=404, detail='Prediction or Result not found')
    
    try:
        evaluation = Evaluation(
            prediction_id=prediction_id,
            result_id=result_id,
            type=eval_type,
            success=success,
            score=min(100, max(0, score)),
            feedback=feedback,
            evaluation_data=evaluation_data or {}
        )
        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)
        
        return {
            'success': True,
            'data': evaluation.to_dict()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/evaluations')
def get_evaluations(
    eval_type: Optional[str] = Query(None),
    limit: int = 50,
    db: Session = Depends(get_db_session)
):
    """Récupère les évaluations"""
    query = db.query(Evaluation)
    
    if eval_type:
        query = query.filter(Evaluation.type == eval_type)
    
    evaluations = query.order_by(Evaluation.evaluated_at.desc()).limit(limit).all()
    
    return {
        'success': True,
        'count': len(evaluations),
        'data': [e.to_dict() for e in evaluations]
    }


@router.get('/evaluations/stats')
def get_evaluation_stats(
    eval_type: Optional[str] = Query(None),
    db: Session = Depends(get_db_session)
):
    """Retourne les statistiques d'évaluation"""
    query = db.query(Evaluation)
    
    if eval_type:
        query = query.filter(Evaluation.type == eval_type)
    
    all_evals = query.all()
    
    if not all_evals:
        return {
            'success': True,
            'total': 0,
            'successes': 0,
            'accuracy': 0,
            'avg_score': 0
        }
    
    total = len(all_evals)
    successes = sum(1 for e in all_evals if e.success)
    avg_score = sum(e.score for e in all_evals) / total
    
    return {
        'success': True,
        'total': total,
        'successes': successes,
        'accuracy': round((successes / total) * 100, 2),
        'avg_score': round(avg_score, 2),
        'by_type': get_stats_by_type(db)
    }


def get_stats_by_type(db: Session):
    """Calcule les stats par type"""
    types = ['keno', 'loto', 'euromillions', 'football']
    stats = {}
    
    for t in types:
        evals = db.query(Evaluation).filter(Evaluation.type == t).all()
        if evals:
            successes = sum(1 for e in evals if e.success)
            stats[t] = {
                'total': len(evals),
                'successes': successes,
                'accuracy': round((successes / len(evals)) * 100, 2),
                'avg_score': round(sum(e.score for e in evals) / len(evals), 2)
            }
    
    return stats


@router.delete('/evaluations/{evaluation_id}')
def delete_evaluation(evaluation_id: int, db: Session = Depends(get_db_session)):
    """Supprime une évaluation"""
    eval = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    
    if not eval:
        raise HTTPException(status_code=404, detail='Evaluation not found')
    
    db.delete(eval)
    db.commit()
    
    return {'success': True, 'message': 'Evaluation deleted'}


# ============ HEALTH CHECK ============

@router.get('/health')
def health_check():
    """Health check"""
    return {
        'success': True,
        'service': 'predictions-api',
        'status': '🟢 running'
    }
