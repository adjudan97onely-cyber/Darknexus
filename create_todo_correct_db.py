import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

async def create_in_correct_db():
    """Crée le Todo App dans la BONNE database"""
    
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000)
        db = client['adj_killagain_db']  # ← LA BONNE BD!
        projects_collection = db['projects']
        
        # HTML Todo App
        html_content = '''<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', sans-serif;
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
        h1 { color: #333; margin-bottom: 20px; text-align: center; }
        .input-group { display: flex; gap: 10px; margin-bottom: 20px; }
        input { flex: 1; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; }
        input:focus { outline: none; border-color: #667eea; }
        button {
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
        }
        .todo-list { list-style: none; }
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
        .todo-text { flex: 1; color: #333; }
        .todo-actions { display: flex; gap: 8px; }
        .btn-small { padding: 6px 12px; font-size: 14px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .btn-delete { background: #f5576c; }
        .stats { margin-top: 20px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center; }
        .empty { text-align: center; color: #999; padding: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 Todo App</h1>
        <div class="input-group">
            <input id="todoInput" placeholder="Nouvelle tâche..." onkeypress="if(event.key==='Enter')addTodo()">
            <button onclick="addTodo()">Ajouter</button>
        </div>
        <ul class="todo-list" id="todoList"></ul>
        <div id="emptyState" class="empty">Aucune tâche 🎉</div>
        <div class="stats">
            <p>Total: <strong id="totalCount">0</strong> | Fait: <strong id="completedCount">0</strong></p>
        </div>
    </div>
    <script>
        let todos = [];
        function addTodo() {
            const text = document.getElementById('todoInput').value.trim();
            if(text) {
                todos.push({id: Date.now(), text: text, completed: false});
                document.getElementById('todoInput').value = '';
                render();
            }
        }
        function toggleTodo(id) {
            todos = todos.map(t => t.id === id ? {...t, completed: !t.completed} : t);
            render();
        }
        function deleteTodo(id) {
            todos = todos.filter(t => t.id !== id);
            render();
        }
        function render() {
            const list = document.getElementById('todoList');
            const empty = document.getElementById('emptyState');
            list.innerHTML = todos.map(t => `
                <li class="todo-item ${t.completed ? 'completed' : ''}">
                    <span class="todo-text" onclick="toggleTodo(${t.id})">${t.text}</span>
                    <div class="todo-actions">
                        <button class="btn-small" onclick="toggleTodo(${t.id})">${t.completed ? '↩️' : '✓'}</button>
                        <button class="btn-small btn-delete" onclick="deleteTodo(${t.id})">Del</button>
                    </div>
                </li>
            `).join('');
            empty.style.display = todos.length ? 'none' : 'block';
            document.getElementById('totalCount').textContent = todos.length;
            document.getElementById('completedCount').textContent = todos.filter(t => t.completed).length;
        }
        render();
    </script>
</body>
</html>'''
        
        project_data = {
            'id': 'todo-app-html-test',
            'name': 'Todo App HTML',
            'type': 'web-app',
            'description': 'Une Todo App en HTML/CSS/JS vanilla - Parfait pour tester le Live Preview',
            'status': 'completed',
            'code_files': [
                {'filename': 'index.html', 'language': 'html', 'content': html_content}
            ],
            'tech_stack': ['HTML5', 'CSS3', 'Vanilla JavaScript'],
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
        }
        
        # Insérer
        result = await projects_collection.insert_one(project_data)
        
        # Vérifier le total
        count = await projects_collection.count_documents({})
        all_p = await projects_collection.find({}, {'_id': 0, 'id': 1, 'name': 1}).to_list(None)
        
        print(f'✅ Todo App créé dans adj_killagain_db!')
        print(f'Total projets: {count}')
        for p in all_p:
            print(f'  - {p["name"]}')
        
        client.close()
        
    except Exception as e:
        print(f'❌ Erreur: {e}')
        import traceback
        traceback.print_exc()

asyncio.run(create_in_correct_db())
