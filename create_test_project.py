import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone

async def create_test_project():
    """Crée un projet HTML/CSS/JS simple pour tester le Live Preview"""
    
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000)
        db = client['darknexus']
        projects = db['projects']
        
        # Données du projet
        project_id = str(uuid.uuid4())
        
        # HTML simple - vanilla, sans React
        html_content = '''<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ma Calculatrice Simple</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 400px;
            width: 100%;
        }
        
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 28px;
        }
        
        .input-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 600;
        }
        
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .button-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        button {
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .btn-add {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }
        
        .btn-subtract {
            background: linear-gradient(135deg, #f093fb, #f5576c);
            color: white;
        }
        
        .btn-multiply {
            background: linear-gradient(135deg, #4facfe, #00f2fe);
            color: white;
        }
        
        .btn-divide {
            background: linear-gradient(135deg, #43e97b, #38f9d7);
            color: white;
        }
        
        .result {
            text-align: center;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .result-label {
            color: #999;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .result-value {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
        }
        
        .reset-btn {
            width: 100%;
            padding: 12px;
            background: #ccc;
            color: #333;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 20px;
        }
        
        .reset-btn:hover {
            background: #999;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧮 Calculatrice</h1>
        
        <div class="input-group">
            <label for="num1">Premier nombre:</label>
            <input type="number" id="num1" placeholder="Ex: 10">
        </div>
        
        <div class="input-group">
            <label for="num2">Deuxième nombre:</label>
            <input type="number" id="num2" placeholder="Ex: 5">
        </div>
        
        <div class="button-group">
            <button class="btn-add" onclick="calculate('add')">➕ Ajouter</button>
            <button class="btn-subtract" onclick="calculate('subtract')">➖ Soustraire</button>
            <button class="btn-multiply" onclick="calculate('multiply')">✖️ Multiplier</button>
            <button class="btn-divide" onclick="calculate('divide')">➗ Diviser</button>
        </div>
        
        <div class="result">
            <div class="result-label">Résultat:</div>
            <div class="result-value" id="resultValue">0</div>
        </div>
        
        <button class="reset-btn" onclick="reset()">🔄 Réinitialiser</button>
    </div>
    
    <script>
        function calculate(operation) {
            const num1 = parseFloat(document.getElementById('num1').value);
            const num2 = parseFloat(document.getElementById('num2').value);
            
            if (isNaN(num1) || isNaN(num2)) {
                alert('Veuillez entrer deux nombres valides');
                return;
            }
            
            let result;
            switch(operation) {
                case 'add':
                    result = num1 + num2;
                    break;
                case 'subtract':
                    result = num1 - num2;
                    break;
                case 'multiply':
                    result = num1 * num2;
                    break;
                case 'divide':
                    if (num2 === 0) {
                        alert('Division par zéro impossible!');
                        return;
                    }
                    result = num1 / num2;
                    break;
            }
            
            document.getElementById('resultValue').textContent = result.toFixed(2);
        }
        
        function reset() {
            document.getElementById('num1').value = '';
            document.getElementById('num2').value = '';
            document.getElementById('resultValue').textContent = '0';
        }
    </script>
</body>
</html>'''

        # CSS simple
        css_content = '''/* Styles de démonstration */
body {
    font-family: Arial, sans-serif;
}'''

        # JavaScript simple
        js_content = '''// Script de démonstration
console.log('Calculatrice chargée');'''

        # Créer le projet
        project_data = {
            'id': project_id,
            'name': 'Calculatrice Simple',
            'type': 'html-app',
            'description': 'Une calculatrice simple en HTML/CSS/JS vanilla - Parfait pour tester le Live Preview!',
            'status': 'completed',
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
            'code_files': [
                {
                    'filename': 'index.html',
                    'language': 'html',
                    'content': html_content
                },
                {
                    'filename': 'style.css',
                    'language': 'css',
                    'content': css_content
                },
                {
                    'filename': 'script.js',
                    'language': 'javascript',
                    'content': js_content
                }
            ],
            'tech_stack': ['HTML5', 'CSS3', 'Vanilla JavaScript']
        }
        
        result = await projects.insert_one(project_data)
        
        print(f'✅ Projet créé avec succès!')
        print(f'ID: {project_id}')
        print(f'Nom: Calculatrice Simple')
        print(f'Type: HTML/CSS/JS Vanilla (Parfait pour le Live Preview!)')
        print(f'\n📋 Fichiers:')
        print(f'  - index.html')
        print(f'  - style.css')
        print(f'  - script.js')
        
        client.close()
        
    except Exception as e:
        print(f'❌ Erreur: {e}')

asyncio.run(create_test_project())
