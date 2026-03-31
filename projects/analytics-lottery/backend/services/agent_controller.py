"""
AGENT CONTROLLER - Système de contrôle et sécurité pour agents IA
L'agent ne fait RIEN sans permission de l'utilisateur
"""

import logging
from typing import Dict, Any, List, Callable
from datetime import datetime
import asyncio
from enum import Enum

logger = logging.getLogger(__name__)


class AgentAction(Enum):
    """Types d'actions que l'agent peut demander"""
    EXECUTE_COMMAND = "execute_command"
    READ_FILE = "read_file"
    WRITE_FILE = "write_file"
    DELETE_FILE = "delete_file"
    OPEN_APP = "open_application"
    WEB_REQUEST = "web_request"
    INSTALL_PACKAGE = "install_package"
    EXCEL_AUTOMATION = "excel_automation"


class AgentStatus(Enum):
    """État de l'agent"""
    IDLE = "idle"
    WAITING_APPROVAL = "waiting_approval"
    EXECUTING = "executing"
    PAUSED = "paused"
    STOPPED = "stopped"
    ERROR = "error"


class AgentController:
    """
    Contrôleur pour superviser l'agent IA
    L'agent ne peut RIEN faire sans demander permission
    """
    
    def __init__(self, auto_approve: bool = False):
        """
        Args:
            auto_approve: Si True, approuve automatiquement (DANGEREUX en prod)
        """
        self.status = AgentStatus.IDLE
        self.auto_approve = auto_approve
        self.pending_action = None
        self.action_history = []
        self.approval_callback = None
        
        # Limites de sécurité
        self.max_file_size = 10 * 1024 * 1024  # 10 MB
        self.forbidden_paths = [
            "C:\\Windows\\System32",
            "C:\\Program Files",
            "/System",
            "/usr/bin"
        ]
        self.forbidden_commands = [
            "rm -rf /",
            "del /F /S /Q C:\\",
            "format",
            "shutdown"
        ]
        
        logger.info("🛡️ Agent Controller initialized")
    
    async def request_permission(
        self, 
        action: AgentAction, 
        details: Dict[str, Any],
        risk_level: str = "medium"
    ) -> bool:
        """
        Demande la permission pour une action
        
        Args:
            action: Type d'action
            details: Détails de l'action (commande, fichier, etc.)
            risk_level: "low", "medium", "high"
            
        Returns:
            True si approuvé, False sinon
        """
        # Vérifier si l'agent est arrêté
        if self.status == AgentStatus.STOPPED:
            logger.warning("❌ Agent is STOPPED - Action denied")
            return False
        
        # Vérifications de sécurité
        if not self._security_check(action, details):
            logger.error(f"🚨 SECURITY VIOLATION: {action.value} - {details}")
            return False
        
        # Créer la demande
        request = {
            'timestamp': datetime.now().isoformat(),
            'action': action.value,
            'details': details,
            'risk_level': risk_level,
            'status': 'pending'
        }
        
        self.pending_action = request
        self.status = AgentStatus.WAITING_APPROVAL
        
        logger.info(f"⏳ Waiting approval for: {action.value}")
        
        # Auto-approve si activé
        if self.auto_approve and risk_level == "low":
            logger.info("✅ Auto-approved (low risk)")
            return await self._approve_action()
        
        # Sinon, attendre l'approbation humaine
        if self.approval_callback:
            approved = await self.approval_callback(request)
        else:
            # Mode CLI : demander confirmation
            approved = self._cli_approval(request)
        
        if approved:
            return await self._approve_action()
        else:
            return await self._deny_action()
    
    def _security_check(self, action: AgentAction, details: Dict) -> bool:
        """Vérifie la sécurité de l'action"""
        
        # Vérifier commandes interdites
        if action == AgentAction.EXECUTE_COMMAND:
            command = details.get('command', '')
            for forbidden in self.forbidden_commands:
                if forbidden.lower() in command.lower():
                    return False
        
        # Vérifier chemins interdits
        if action in [AgentAction.READ_FILE, AgentAction.WRITE_FILE, AgentAction.DELETE_FILE]:
            path = details.get('path', '')
            for forbidden_path in self.forbidden_paths:
                if forbidden_path.lower() in path.lower():
                    return False
        
        return True
    
    def _cli_approval(self, request: Dict) -> bool:
        """Demande approbation en mode CLI"""
        print("\n" + "=" * 60)
        print("🤖 AGENT DEMANDE PERMISSION")
        print("=" * 60)
        print(f"Action : {request['action']}")
        print(f"Détails : {request['details']}")
        print(f"Risque : {request['risk_level'].upper()}")
        print("-" * 60)
        
        while True:
            response = input("Approuver ? (oui/non/stop) : ").lower().strip()
            
            if response in ['oui', 'yes', 'y', 'o']:
                return True
            elif response in ['non', 'no', 'n']:
                return False
            elif response in ['stop', 's']:
                self.stop_agent()
                return False
            else:
                print("Réponse invalide. Tapez 'oui', 'non' ou 'stop'")
    
    async def _approve_action(self) -> bool:
        """Approuve et exécute l'action"""
        if self.pending_action:
            self.pending_action['status'] = 'approved'
            self.action_history.append(self.pending_action)
            self.status = AgentStatus.EXECUTING
            logger.info(f"✅ Action approved: {self.pending_action['action']}")
            self.pending_action = None
            return True
        return False
    
    async def _deny_action(self) -> bool:
        """Refuse l'action"""
        if self.pending_action:
            self.pending_action['status'] = 'denied'
            self.action_history.append(self.pending_action)
            self.status = AgentStatus.IDLE
            logger.info(f"❌ Action denied: {self.pending_action['action']}")
            self.pending_action = None
        return False
    
    def stop_agent(self):
        """Arrête l'agent immédiatement"""
        self.status = AgentStatus.STOPPED
        self.pending_action = None
        logger.warning("🛑 AGENT STOPPED BY USER")
        print("\n🛑 AGENT ARRÊTÉ !")
    
    def pause_agent(self):
        """Met l'agent en pause"""
        self.status = AgentStatus.PAUSED
        logger.info("⏸️ Agent paused")
    
    def resume_agent(self):
        """Reprend l'agent"""
        if self.status == AgentStatus.PAUSED:
            self.status = AgentStatus.IDLE
            logger.info("▶️ Agent resumed")
    
    def get_history(self) -> List[Dict]:
        """Retourne l'historique des actions"""
        return self.action_history
    
    def get_status(self) -> str:
        """Retourne le statut actuel"""
        return self.status.value


# Instance globale
agent_controller = AgentController(auto_approve=False)
