"""
TEMPORAL AWARENESS - Conscience temporelle pour l'app et les agents
Permet de comprendre "mardi prochain", "dans 2 jours", etc.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import re
from dateutil import parser
import calendar

class TemporalAwareness:
    """Gère la conscience temporelle de l'application"""
    
    def __init__(self):
        self.current_datetime = datetime.now()
        
        # Jours de la semaine en français
        self.weekdays_fr = {
            0: 'lundi',
            1: 'mardi', 
            2: 'mercredi',
            3: 'jeudi',
            4: 'vendredi',
            5: 'samedi',
            6: 'dimanche'
        }
        
        # Mois en français
        self.months_fr = {
            1: 'janvier', 2: 'février', 3: 'mars', 4: 'avril',
            5: 'mai', 6: 'juin', 7: 'juillet', 8: 'août',
            9: 'septembre', 10: 'octobre', 11: 'novembre', 12: 'décembre'
        }
    
    def get_current_context(self) -> Dict[str, Any]:
        """Retourne le contexte temporel actuel"""
        now = datetime.now()
        
        return {
            'datetime': now.isoformat(),
            'date': now.strftime('%Y-%m-%d'),
            'time': now.strftime('%H:%M:%S'),
            'timestamp': int(now.timestamp()),
            'weekday': self.weekdays_fr[now.weekday()],
            'weekday_number': now.weekday(),
            'day': now.day,
            'month': self.months_fr[now.month],
            'month_number': now.month,
            'year': now.year,
            'hour': now.hour,
            'minute': now.minute,
            'formatted': f"{self.weekdays_fr[now.weekday()]} {now.day} {self.months_fr[now.month]} {now.year} à {now.hour:02d}h{now.minute:02d}"
        }
    
    def parse_temporal_expression(self, text: str) -> Optional[datetime]:
        """
        Parse une expression temporelle en français
        
        Args:
            text: "mardi prochain", "dans 2 jours", "demain", etc.
            
        Returns:
            datetime correspondant
        """
        text_lower = text.lower().strip()
        now = datetime.now()
        
        # Aujourd'hui
        if any(word in text_lower for word in ['aujourd\'hui', 'ce soir', 'ce matin']):
            return now
        
        # Demain
        if 'demain' in text_lower:
            return now + timedelta(days=1)
        
        # Après-demain
        if 'après-demain' in text_lower or 'apres-demain' in text_lower:
            return now + timedelta(days=2)
        
        # Hier
        if 'hier' in text_lower:
            return now - timedelta(days=1)
        
        # Dans X jours/heures
        match = re.search(r'dans\s+(\d+)\s+(jour|heure|minute|semaine|mois)', text_lower)
        if match:
            amount = int(match.group(1))
            unit = match.group(2)
            
            if unit == 'jour':
                return now + timedelta(days=amount)
            elif unit == 'heure':
                return now + timedelta(hours=amount)
            elif unit == 'minute':
                return now + timedelta(minutes=amount)
            elif unit == 'semaine':
                return now + timedelta(weeks=amount)
            elif unit == 'mois':
                return now + timedelta(days=amount * 30)
        
        # Jour de la semaine prochain
        for day_num, day_name in self.weekdays_fr.items():
            if day_name in text_lower:
                current_day = now.weekday()
                days_ahead = day_num - current_day
                
                if days_ahead <= 0:  # Le jour est déjà passé cette semaine
                    days_ahead += 7
                
                if 'prochain' in text_lower or 'prochaine' in text_lower:
                    return now + timedelta(days=days_ahead)
                elif 'dernier' in text_lower or 'dernière' in text_lower:
                    days_back = current_day - day_num
                    if days_back < 0:
                        days_back += 7
                    return now - timedelta(days=days_back)
                else:
                    return now + timedelta(days=days_ahead)
        
        # Ce week-end
        if 'week-end' in text_lower or 'weekend' in text_lower:
            current_day = now.weekday()
            days_to_saturday = (5 - current_day) % 7
            if days_to_saturday == 0 and now.hour > 12:
                days_to_saturday = 7
            return now + timedelta(days=days_to_saturday)
        
        # La semaine prochaine
        if 'semaine prochaine' in text_lower:
            return now + timedelta(weeks=1)
        
        # Le mois prochain
        if 'mois prochain' in text_lower:
            return now + timedelta(days=30)
        
        return None
    
    def format_relative_time(self, target: datetime) -> str:
        """
        Formate une date de manière relative
        
        Args:
            target: Date cible
            
        Returns:
            "dans 2 jours", "il y a 3 heures", etc.
        """
        now = datetime.now()
        delta = target - now
        
        if delta.total_seconds() < 0:
            # Dans le passé
            delta = now - target
            
            if delta.days > 365:
                years = delta.days // 365
                return f"il y a {years} an{'s' if years > 1 else ''}"
            elif delta.days > 30:
                months = delta.days // 30
                return f"il y a {months} mois"
            elif delta.days > 0:
                return f"il y a {delta.days} jour{'s' if delta.days > 1 else ''}"
            elif delta.seconds > 3600:
                hours = delta.seconds // 3600
                return f"il y a {hours} heure{'s' if hours > 1 else ''}"
            elif delta.seconds > 60:
                minutes = delta.seconds // 60
                return f"il y a {minutes} minute{'s' if minutes > 1 else ''}"
            else:
                return "à l'instant"
        else:
            # Dans le futur
            if delta.days > 365:
                years = delta.days // 365
                return f"dans {years} an{'s' if years > 1 else ''}"
            elif delta.days > 30:
                months = delta.days // 30
                return f"dans {months} mois"
            elif delta.days > 0:
                return f"dans {delta.days} jour{'s' if delta.days > 1 else ''}"
            elif delta.seconds > 3600:
                hours = delta.seconds // 3600
                return f"dans {hours} heure{'s' if hours > 1 else ''}"
            elif delta.seconds > 60:
                minutes = delta.seconds // 60
                return f"dans {minutes} minute{'s' if minutes > 1 else ''}"
            else:
                return "maintenant"
    
    def is_time_expression(self, text: str) -> bool:
        """Vérifie si le texte contient une expression temporelle"""
        temporal_words = [
            'aujourd\'hui', 'demain', 'hier', 'prochain', 'dernier',
            'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche',
            'dans', 'il y a', 'semaine', 'mois', 'jour', 'heure', 'minute',
            'week-end', 'weekend', 'ce soir', 'ce matin'
        ]
        
        text_lower = text.lower()
        return any(word in text_lower for word in temporal_words)


# Instance globale
temporal_awareness = TemporalAwareness()
