"""
FILE MANAGER - Gestionnaire de fichiers pour l'agent
Permet à l'agent de créer, modifier, supprimer des fichiers dans les projets
"""

import os
import logging
from typing import Dict, Any, List
from pathlib import Path
import zipfile
import io

logger = logging.getLogger(__name__)


class FileManager:
    """
    Gère les opérations sur les fichiers des projets
    """
    
    def __init__(self, projects_base_dir: str = "/tmp/adj_killagain_projects"):
        self.base_dir = Path(projects_base_dir)
        self.base_dir.mkdir(exist_ok=True, parents=True)
        
    def get_project_dir(self, project_id: str) -> Path:
        """Obtient le répertoire d'un projet"""
        project_dir = self.base_dir / project_id
        project_dir.mkdir(exist_ok=True)
        return project_dir
    
    def create_file(self, project_id: str, filename: str, content: str) -> Dict[str, Any]:
        """
        Crée un nouveau fichier dans le projet
        """
        try:
            project_dir = self.get_project_dir(project_id)
            file_path = project_dir / filename
            
            # Créer les sous-dossiers si nécessaire
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Écrire le fichier
            file_path.write_text(content, encoding='utf-8')
            
            logger.info(f"Created file: {file_path}")
            return {
                'success': True,
                'path': str(file_path),
                'message': f'Fichier {filename} créé avec succès'
            }
            
        except Exception as e:
            logger.error(f"Error creating file: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': f'Erreur lors de la création de {filename}'
            }
    
    def read_file(self, project_id: str, filename: str) -> Dict[str, Any]:
        """
        Lit le contenu d'un fichier
        """
        try:
            project_dir = self.get_project_dir(project_id)
            file_path = project_dir / filename
            
            if not file_path.exists():
                return {
                    'success': False,
                    'error': 'File not found',
                    'message': f'Le fichier {filename} n\'existe pas'
                }
            
            content = file_path.read_text(encoding='utf-8')
            
            return {
                'success': True,
                'content': content,
                'path': str(file_path)
            }
            
        except Exception as e:
            logger.error(f"Error reading file: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': f'Erreur lors de la lecture de {filename}'
            }
    
    def update_file(self, project_id: str, filename: str, content: str) -> Dict[str, Any]:
        """
        Met à jour un fichier existant
        """
        try:
            project_dir = self.get_project_dir(project_id)
            file_path = project_dir / filename
            
            if not file_path.exists():
                # Si le fichier n'existe pas, le créer
                return self.create_file(project_id, filename, content)
            
            file_path.write_text(content, encoding='utf-8')
            
            logger.info(f"Updated file: {file_path}")
            return {
                'success': True,
                'path': str(file_path),
                'message': f'Fichier {filename} mis à jour avec succès'
            }
            
        except Exception as e:
            logger.error(f"Error updating file: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': f'Erreur lors de la mise à jour de {filename}'
            }
    
    def delete_file(self, project_id: str, filename: str) -> Dict[str, Any]:
        """
        Supprime un fichier
        """
        try:
            project_dir = self.get_project_dir(project_id)
            file_path = project_dir / filename
            
            if not file_path.exists():
                return {
                    'success': False,
                    'error': 'File not found',
                    'message': f'Le fichier {filename} n\'existe pas'
                }
            
            file_path.unlink()
            
            logger.info(f"Deleted file: {file_path}")
            return {
                'success': True,
                'message': f'Fichier {filename} supprimé avec succès'
            }
            
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': f'Erreur lors de la suppression de {filename}'
            }
    
    def list_files(self, project_id: str) -> Dict[str, Any]:
        """
        Liste tous les fichiers du projet
        """
        try:
            project_dir = self.get_project_dir(project_id)
            
            files = []
            for file_path in project_dir.rglob('*'):
                if file_path.is_file():
                    rel_path = file_path.relative_to(project_dir)
                    files.append({
                        'name': str(rel_path),
                        'size': file_path.stat().st_size,
                        'modified': file_path.stat().st_mtime
                    })
            
            return {
                'success': True,
                'files': files,
                'count': len(files)
            }
            
        except Exception as e:
            logger.error(f"Error listing files: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'files': []
            }
    
    def create_zip(self, project_id: str, files: List[Dict[str, str]]) -> bytes:
        """
        Crée un fichier ZIP contenant tous les fichiers du projet
        """
        try:
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for file_data in files:
                    filename = file_data['filename']
                    content = file_data['content']
                    zip_file.writestr(filename, content)
            
            zip_buffer.seek(0)
            return zip_buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Error creating ZIP: {str(e)}")
            raise
    
    def sync_files_to_db(self, project_id: str, files: List[Dict[str, str]]):
        """
        Synchronise les fichiers de la DB vers le système de fichiers
        """
        try:
            project_dir = self.get_project_dir(project_id)
            
            # Nettoyer le répertoire
            for file_path in project_dir.rglob('*'):
                if file_path.is_file():
                    file_path.unlink()
            
            # Créer tous les fichiers
            for file_data in files:
                self.create_file(
                    project_id,
                    file_data['filename'],
                    file_data['content']
                )
            
            logger.info(f"Synced {len(files)} files for project {project_id}")
            
        except Exception as e:
            logger.error(f"Error syncing files: {str(e)}")
            raise


# Instance globale
file_manager = FileManager()
