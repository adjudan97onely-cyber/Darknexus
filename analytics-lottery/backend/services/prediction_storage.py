"""
Système de Stockage - Prédictions + Résultats pour Accuracy
Utilise TinyDB pour compatibilité Python 3.14
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path
import json

logger = logging.getLogger(__name__)

# Chemin base de données
DB_ROOT = Path(__file__).parent.parent / "databases"
DB_ROOT.mkdir(exist_ok=True)

PREDICTIONS_FILE = DB_ROOT / "predictions_archive.json"
RESULTS_FILE = DB_ROOT / "results_archive.json"
ACCURACY_FILE = DB_ROOT / "accuracy_metrics.json"


class PredictionStorage:
    """Gère le stockage des prédictions et résultats"""
    
    @staticmethod
    def save_prediction(prediction: Dict) -> Dict:
        """
        Sauvegarde une prédiction
        
        Args:
            prediction: {
                "match_id": "...",
                "league": "ligue1",
                "home_team": "PSG",
                "away_team": "OM",
                "prediction": "HOME",
                "confidence": 0.8,
                "timestamp": "2024-03-26T15:30:00",
                ...
            }
        
        Returns:
            Prédiction avec ID ajouté
        """
        try:
            predictions = PredictionStorage._load_file(PREDICTIONS_FILE)
            
            # Ajouter ID et timestamp si absent
            if "id" not in prediction:
                prediction["id"] = f"pred_{len(predictions)}_{int(datetime.now().timestamp())}"
            if "saved_at" not in prediction:
                prediction["saved_at"] = datetime.now().isoformat()
            
            predictions.append(prediction)
            PredictionStorage._save_file(PREDICTIONS_FILE, predictions)
            
            logger.info(f"✅ Prédiction enregistrée: {prediction['id']}")
            return prediction
            
        except Exception as e:
            logger.error(f"❌ Erreur sauvegarde prédiction: {e}")
            return {}
    
    
    @staticmethod
    def save_result(match_id: str, actual_result: str, notes: Optional[str] = None) -> Dict:
        """
        Enregistre le résultat réel d'un match
        
        Args:
            match_id: ID du match
            actual_result: "HOME" | "DRAW" | "AWAY"
            notes: Notes optionnelles
        
        Returns:
            Résultat enregistré
        """
        try:
            results = PredictionStorage._load_file(RESULTS_FILE)
            
            result = {
                "id": f"result_{len(results)}_{int(datetime.now().timestamp())}",
                "match_id": match_id,
                "result": actual_result,
                "recorded_at": datetime.now().isoformat(),
                "notes": notes
            }
            
            results.append(result)
            PredictionStorage._save_file(RESULTS_FILE, results)
            
            # Recalculer accuracy
            PredictionStorage.recalculate_accuracy()
            
            logger.info(f"✅ Résultat enregistré: {match_id} → {actual_result}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Erreur sauvegarde résultat: {e}")
            return {}
    
    
    @staticmethod
    def get_predictions(league: Optional[str] = None, limit: int = 100) -> List[Dict]:
        """Récupère les prédictions stockées"""
        try:
            predictions = PredictionStorage._load_file(PREDICTIONS_FILE)
            
            if league:
                predictions = [p for p in predictions if p.get("league") == league]
            
            return predictions[-limit:]
            
        except:
            return []
    
    
    @staticmethod
    def get_results(limit: int = 100) -> List[Dict]:
        """Récupère les résultats enregistrés"""
        try:
            results = PredictionStorage._load_file(RESULTS_FILE)
            return results[-limit:]
        except:
            return []
    
    
    @staticmethod
    def match_predictions_with_results() -> List[Dict]:
        """
        Apparie prédictions avec résultats réels
        
        Returns:
            Liste {"prediction": {...}, "result": {...}, "correct": bool}
        """
        try:
            predictions = PredictionStorage._load_file(PREDICTIONS_FILE)
            results = PredictionStorage._load_file(RESULTS_FILE)
            
            # Index résultats par match_id
            results_dict = {r.get("match_id"): r for r in results}
            
            matched = []
            for pred in predictions:
                match_id = pred.get("match_id")
                if match_id in results_dict:
                    result = results_dict[match_id]
                    matched.append({
                        "prediction": pred,
                        "result": result,
                        "correct": pred.get("prediction") == result.get("result"),
                        "confidence": pred.get("confidence", 0)
                    })
            
            return matched
            
        except Exception as e:
            logger.error(f"❌ Erreur appairage: {e}")
            return []
    
    
    @staticmethod
    def recalculate_accuracy() -> Dict:
        """
        Recalcule les métriques d'accuracy
        
        Returns:
            {"accuracy": 0.75, "correct": 15, "total": 20, ...}
        """
        try:
            matched = PredictionStorage.match_predictions_with_results()
            
            if not matched:
                return {"accuracy": 0, "correct": 0, "total": 0}
            
            correct = sum(1 for m in matched if m["correct"])
            total = len(matched)
            
            # Par confiance
            high_conf = [m for m in matched if m["confidence"] >= 0.7]
            high_conf_correct = sum(1 for m in high_conf if m["correct"])
            
            low_conf = [m for m in matched if m["confidence"] < 0.7]
            low_conf_correct = sum(1 for m in low_conf if m["correct"])
            
            metrics = {
                "accuracy": round(correct / total, 3),
                "correct": correct,
                "total": total,
                "high_confidence_accuracy": round(high_conf_correct / len(high_conf) if high_conf else 0, 3),
                "low_confidence_accuracy": round(low_conf_correct / len(low_conf) if low_conf else 0, 3),
                "calculated_at": datetime.now().isoformat()
            }
            
            PredictionStorage._save_file(ACCURACY_FILE, metrics)
            logger.info(f"✅ Accuracy recalculée: {metrics['accuracy']:.1%} ({correct}/{total})")
            
            return metrics
            
        except Exception as e:
            logger.error(f"❌ Erreur calcul accuracy: {e}")
            return {}
    
    
    @staticmethod
    def get_accuracy_metrics() -> Dict:
        """Récupère les métriques d'accuracy actuelles"""
        try:
            return PredictionStorage._load_file(ACCURACY_FILE)
        except:
            return {}
    
    
    @staticmethod
    def _load_file(filepath: Path) -> List:
        """Charge un fichier JSON"""
        try:
            if filepath.exists():
                with open(filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except:
            pass
        return []
    
    
    @staticmethod
    def _save_file(filepath: Path, data: List) -> None:
        """Sauvegarde un fichier JSON"""
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"❌ Erreur sauvegarde fichier: {e}")


# ===========================
# Helpers simples pour intégration
# ===========================

def save_match_prediction(
    match_id: str,
    league: str,
    home_team: str,
    away_team: str,
    prediction: str,
    confidence: float,
    analysis: Dict = None
) -> Dict:
    """Helper pour sauvegarder une prédiction de match"""
    
    return PredictionStorage.save_prediction({
        "match_id": match_id,
        "league": league,
        "home_team": home_team,
        "away_team": away_team,
        "prediction": prediction,
        "confidence": confidence,
        "analysis": analysis or {}
    })


def record_match_result(match_id: str, actual_result: str) -> Dict:
    """Helper pour enregistrer un résultat de match"""
    
    return PredictionStorage.save_result(match_id, actual_result)
