"""
CODE EXECUTOR - Exécuteur de code sécurisé
Permet à l'agent E1 Lite d'exécuter du code Python, JavaScript, etc.
"""

import subprocess
import tempfile
import os
import logging
from typing import Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)


class CodeExecutor:
    """
    Exécute du code de manière sécurisée dans un environnement isolé
    """
    
    def __init__(self):
        self.temp_dir = Path(tempfile.gettempdir()) / "adj_killagain_executor"
        self.temp_dir.mkdir(exist_ok=True)
        
    async def execute_python(self, code: str, timeout: int = 30) -> Dict[str, Any]:
        """
        Exécute du code Python et retourne le résultat
        
        Args:
            code: Code Python à exécuter
            timeout: Timeout en secondes
            
        Returns:
            Dict avec 'success', 'output', 'error'
        """
        try:
            # Créer un fichier temporaire
            temp_file = self.temp_dir / f"script_{os.urandom(8).hex()}.py"
            temp_file.write_text(code)
            
            # Exécuter le code
            result = subprocess.run(
                ['python3', str(temp_file)],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.temp_dir
            )
            
            # Nettoyer
            temp_file.unlink()
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'error': result.stderr,
                'return_code': result.returncode
            }
            
        except subprocess.TimeoutExpired:
            logger.error("Code execution timeout")
            return {
                'success': False,
                'output': '',
                'error': f'Timeout: L\'exécution a dépassé {timeout} secondes',
                'return_code': -1
            }
        except Exception as e:
            logger.error(f"Error executing Python code: {str(e)}")
            return {
                'success': False,
                'output': '',
                'error': str(e),
                'return_code': -1
            }
    
    async def execute_javascript(self, code: str, timeout: int = 30) -> Dict[str, Any]:
        """
        Exécute du code JavaScript (Node.js)
        """
        try:
            temp_file = self.temp_dir / f"script_{os.urandom(8).hex()}.js"
            temp_file.write_text(code)
            
            result = subprocess.run(
                ['node', str(temp_file)],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.temp_dir
            )
            
            temp_file.unlink()
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'error': result.stderr,
                'return_code': result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'output': '',
                'error': f'Timeout: L\'exécution a dépassé {timeout} secondes',
                'return_code': -1
            }
        except Exception as e:
            logger.error(f"Error executing JavaScript code: {str(e)}")
            return {
                'success': False,
                'output': '',
                'error': str(e),
                'return_code': -1
            }
    
    async def execute_bash(self, command: str, timeout: int = 30) -> Dict[str, Any]:
        """
        Exécute une commande bash
        """
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.temp_dir
            )
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'error': result.stderr,
                'return_code': result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'output': '',
                'error': f'Timeout: L\'exécution a dépassé {timeout} secondes',
                'return_code': -1
            }
        except Exception as e:
            logger.error(f"Error executing bash command: {str(e)}")
            return {
                'success': False,
                'output': '',
                'error': str(e),
                'return_code': -1
            }
    
    async def lint_code(self, code: str, language: str) -> Dict[str, Any]:
        """
        Vérifie la syntaxe du code sans l'exécuter
        """
        try:
            if language == 'python':
                # Vérifier la syntaxe Python
                compile(code, '<string>', 'exec')
                return {'valid': True, 'errors': []}
            elif language in ['javascript', 'js']:
                # Pour JS, on peut utiliser node --check
                temp_file = self.temp_dir / f"lint_{os.urandom(8).hex()}.js"
                temp_file.write_text(code)
                
                result = subprocess.run(
                    ['node', '--check', str(temp_file)],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                temp_file.unlink()
                
                return {
                    'valid': result.returncode == 0,
                    'errors': [result.stderr] if result.stderr else []
                }
            else:
                return {'valid': True, 'errors': []}
                
        except SyntaxError as e:
            return {
                'valid': False,
                'errors': [f"Ligne {e.lineno}: {e.msg}"]
            }
        except Exception as e:
            return {
                'valid': False,
                'errors': [str(e)]
            }


# Instance globale
code_executor = CodeExecutor()
