import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

async def create_html_test_project():
    """Crée un projet HTML/CSS/JS vanilla TESTABLE pour le Live Preview"""
    
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000)
        db = client['darknexus']
        projects_collection = db['projects']
        
        # HTML avec CSS et JS INLINE - parfait pour le preview
        html_file_content = '''<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App</title>
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
            padding: 20px;
        }
        
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 30px;
        }
        
        h1 {
            color: #333;
            margin-bottom: 20px;
            text-align: center;
            font-size: 32px;
        }
        
        .input-group {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        input {
            flex: 1;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        button {
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
        }
        
        button:hover {
            transform: translateY(-2px);
        }
        
        button:active {
            transform: translateY(0);
        }
        
        .todo-list {
            list-style: none;
        }
        
        .todo-item {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-left: 4px solid #667eea;
        }
        
        .todo-item.completed {
            opacity: 0.6;
        }
        
        .todo-item.completed span {
            text-decoration: line-through;
            color: #999;
        }
        
        .todo-text {
            flex: 1;
            color: #333;
            font-size: 16px;
        }
        
        .todo-actions {
            display: flex;
            gap: 8px;
        }
        
        .btn-small {
            padding: 6px 12px;
            font-size: 14px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .btn-delete {
            background: #f5576c;
        }
        
        .stats {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #666;
        }
        
        .empty {
            text-align: center;
            color: #999;
            padding: 40px 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 Ma Todo App</h1>
        
        <div class="input-group">
            <input 
                type="text" 
                id="todoInput" 
                placeholder="Ajoute une nouvelle tâche..."
                onkeypress="if(event.key === 'Enter') addTodo()"
            >
            <button onclick="addTodo()">Ajouter</button>
        </div>
        
        <ul class="todo-list" id="todoList"></ul>
        
        <div id="emptyState" class="empty">
            Aucune tâche pour le moment 🎉
        </div>
        
        <div class="stats">
            <p>Tâches totales: <strong id="totalCount">0</strong></p>
            <p>Complétées: <strong id="completedCount">0</strong></p>
        </div>
    </div>
    
    <script>
        let todos = [];
        
        function addTodo() {
            const input = document.getElementById('todoInput');
            const text = input.value.trim();
            
            if (text === '') {
                alert('Il faut entrer une tâche!');
                return;
            }
            
            todos.push({
                id: Date.now(),
                text: text,
                completed: false
            });
            
            input.value = '';
            render();
        }
        
        function toggleTodo(id) {
            todos = todos.map(t => 
                t.id === id ? {...t, completed: !t.completed} : t
            );
            render();
        }
        
        function deleteTodo(id) {
            todos = todos.filter(t => t.id !== id);
            render();
        }
        
        function render() {
            const list = document.getElementById('todoList');
            const emptyState = document.getElementById('emptyState');
            const totalCount = document.getElementById('totalCount');
            const completedCount = document.getElementById('completedCount');
            
            list.innerHTML = '';
            
            if (todos.length === 0) {
                emptyState.style.display = 'block';
            } else {
                emptyState.style.display = 'none';
                todos.forEach(todo => {
                    const li = document.createElement('li');
                    li.className = 'todo-item' + (todo.completed ? ' completed' : '');
                    li.innerHTML = `
                        <span class="todo-text" onclick="toggleTodo(${todo.id})">${todo.text}</span>
                        <div class="todo-actions">
                            <button class="btn-small" onclick="toggleTodo(${todo.id})">
                                ${todo.completed ? '↩️ Annuler' : '✓ Fait'}
                            </button>
                            <button class="btn-small btn-delete" onclick="deleteTodo(${todo.id})">Supprimer</button>
                        </div>
                    `;
                    list.appendChild(li);
                });
            }
            
            totalCount.textContent = todos.length;
            completedCount.textContent = todos.filter(t => t.completed).length;
        }
        
        // Initialiser le rendu
        render();
    </script>
</body>
</html>'''
        
        # Créer la structure du projet exactement comme les autres
        project_data = {
            'id': 'todo-app-test-2b5f4e8d',
            'name': 'Todo App - Test Preview',
            'type': 'web-app',
            'description': 'Une simple application Todo en HTML/CSS/JS vanilla - Parfaite pour tester le Live Preview!',
            'status': 'completed',
            'ai_model_used': None,
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
            'code_files': [
                {
                    'filename': 'index.html',
                    'language': 'html',
                    'content': html_file_content
                }
            ],
            'tech_stack': ['HTML5', 'CSS3', 'Vanilla JavaScript']
        }
        
        # Insérer dans la BD
        result = await projects_collection.insert_one(project_data)
        
        print('✅ Projet Todo App créé avec succès!')
        print(f'ID: todo-app-test-2b5f4e8d')
        print(f'Nom: Todo App - Test Preview')
        print(f'Type: HTML/CSS/JS Vanilla ✅')
        print(f'\n📋 Caractéristiques:')
        print(f'  ✓ 1 fichier HTML avec CSS et JS inline')
        print(f'  ✓ Pas de JSX - fonctionne avec le preview!')
        print(f'  ✓ Todo app fonctionnelle (ajouter, marquer, supprimer)')
        print(f'  ✓ Design avec gradient et animations')
        
        client.close()
        
    except Exception as e:
        print(f'❌ Erreur: {e}')
        import traceback
        traceback.print_exc()

asyncio.run(create_html_test_project())
