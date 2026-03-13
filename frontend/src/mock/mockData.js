// Mock data pour le développement frontend
export const mockProjects = [
  {
    id: '1',
    name: 'Analyseur de Photos Cuisine',
    description: 'Application qui analyse les photos d\'ingrédients et suggère des recettes',
    type: 'web-app',
    tech_stack: ['React', 'FastAPI', 'OpenAI Vision'],
    status: 'completed',
    created_at: '2025-07-10T10:30:00Z',
    code_files: [
      {
        filename: 'app.py',
        language: 'python',
        content: '# Code généré par l\'IA\nfrom fastapi import FastAPI, File, UploadFile\nimport openai\n\napp = FastAPI()\n\n@app.post("/analyze-ingredients")\nasync def analyze_ingredients(file: UploadFile):\n    # Analyse de l\'image avec Vision API\n    pass'
      },
      {
        filename: 'App.jsx',
        language: 'javascript',
        content: '// Interface React\nimport React, { useState } from "react";\n\nfunction App() {\n  const [image, setImage] = useState(null);\n  return <div>Photo Upload Component</div>;\n}'
      }
    ]
  },
  {
    id: '2',
    name: 'Automatisation Excel Budget',
    description: 'Script Python pour automatiser l\'analyse de fichiers Excel de budget mensuel',
    type: 'python-script',
    tech_stack: ['Python', 'pandas', 'openpyxl'],
    status: 'completed',
    created_at: '2025-07-09T14:20:00Z',
    code_files: [
      {
        filename: 'excel_automation.py',
        language: 'python',
        content: '# Automatisation Excel\nimport pandas as pd\nimport openpyxl\n\ndef analyze_budget(file_path):\n    df = pd.read_excel(file_path)\n    # Traitement des données\n    return df.describe()'
      }
    ]
  },
  {
    id: '3',
    name: 'Script Anti-Cheat Jeu',
    description: 'Script de détection de triche pour jeu multijoueur',
    type: 'game-script',
    tech_stack: ['Python', 'PyGame'],
    status: 'in-progress',
    created_at: '2025-07-08T09:15:00Z',
    code_files: []
  }
];

export const projectTypes = [
  {
    id: 'web-app',
    name: 'Application Web',
    description: 'Application web complète avec frontend et backend',
    icon: '🌐',
    stacks: ['React + FastAPI', 'Vue + Node.js', 'Next.js', 'Full Stack']
  },
  {
    id: 'python-script',
    name: 'Script Python',
    description: 'Scripts d\'automatisation, data processing, etc.',
    icon: '🐍',
    stacks: ['Automation', 'Data Analysis', 'Web Scraping', 'CLI Tool']
  },
  {
    id: 'excel-automation',
    name: 'Automatisation Excel',
    description: 'Scripts pour automatiser les tâches Excel',
    icon: '📊',
    stacks: ['pandas', 'openpyxl', 'xlwings']
  },
  {
    id: 'game-script',
    name: 'Script Jeu Vidéo',
    description: 'Scripts et mods pour jeux vidéo',
    icon: '🎮',
    stacks: ['PyGame', 'Unity Python', 'Mod Scripts']
  },
  {
    id: 'ai-app',
    name: 'Application IA',
    description: 'Applications avec vision, NLP, ou autres capacités IA',
    icon: '🤖',
    stacks: ['OpenAI', 'Computer Vision', 'NLP', 'ML']
  },
  {
    id: 'api',
    name: 'API REST',
    description: 'API backend pour vos applications',
    icon: '🔌',
    stacks: ['FastAPI', 'Express', 'Django', 'Flask']
  }
];

export const templates = [
  {
    id: 'photo-recipe',
    name: 'Photo → Recette',
    description: 'Prend une photo d\'ingrédients et suggère des recettes',
    type: 'ai-app',
    popularity: 95
  },
  {
    id: 'excel-report',
    name: 'Rapport Excel Auto',
    description: 'Génère automatiquement des rapports depuis Excel',
    type: 'excel-automation',
    popularity: 88
  },
  {
    id: 'game-inventory',
    name: 'Système Inventaire Jeu',
    description: 'Script d\'inventaire pour jeu vidéo',
    type: 'game-script',
    popularity: 76
  },
  {
    id: 'web-dashboard',
    name: 'Dashboard Analytique',
    description: 'Dashboard web avec graphiques et données temps réel',
    type: 'web-app',
    popularity: 92
  }
];