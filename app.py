from flask import Flask, request, jsonify, redirect, session
from flask_cors import CORS
import sqlite3
import datetime
from functools import wraps
from google.oauth2 import id_token
from google.auth.transport import requests
import os
import requests as requests_lib

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = os.urandom(24)  # для сессий

# Конфигурация Google OAuth
GOOGLE_CLIENT_ID = "ВАШ_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET = "ВАШ_GOOGLE_CLIENT_SECRET"
REDIRECT_URI = "https://notes.narkis.ru/api/auth/callback"

def levenshtein_distance(s1, s2):
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)

    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1.lower() != c2.lower())
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]

def fuzzy_search(text, query, threshold=3):
    """Выполняет нечеткий поиск подстрок в тексте"""
    text = text.lower()
    query = query.lower()
    
    # Сначала проверяем точное вхождение (регистронезависимое)
    if query in text:
        return True
        
    # Если точного вхождения нет, ищем подстроки с близким расстоянием Левенштейна
    words = text.split()
    query_words = query.split()
    
    for q_word in query_words:
        found = False
        for word in words:
            if levenshtein_distance(word, q_word) <= threshold:
                found = True
                break
        if not found:
            return False
    return True

def init_db():
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    
    # Таблица пользователей
    c.execute('''
        CREATE TABLE IF NOT EXISTS users
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
         email TEXT UNIQUE NOT NULL,
         username TEXT NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         last_login TIMESTAMP,
         google_id TEXT UNIQUE)
    ''')
    
    # Обновленная таблица заметок
    c.execute('''
        CREATE TABLE IF NOT EXISTS notes
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
         title TEXT NOT NULL,
         content TEXT NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         user_id INTEGER,
         FOREIGN KEY (user_id) REFERENCES users(id))
    ''')
    
    conn.commit()
    conn.close()

init_db()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/auth/login', methods=['GET'])
def login():
    # Редирект на страницу авторизации Google
    return redirect(f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope=email profile")

def get_google_user_info(code):
    # Получаем токен доступа от Google
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        'code': code,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code'
    }
    
    response = requests_lib.post(token_url, data=data)
    if not response.ok:
        raise Exception('Failed to get token from Google')
    
    token_data = response.json()
    
    # Получаем информацию о пользователе
    userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
    headers = {'Authorization': f'Bearer {token_data["access_token"]}'}
    response = requests_lib.get(userinfo_url, headers=headers)
    
    if not response.ok:
        raise Exception('Failed to get user info from Google')
    
    return response.json()

@app.route('/api/auth/callback')
def callback():
    try:
        code = request.args.get('code')
        if not code:
            return jsonify({'error': 'No authorization code provided'}), 400
            
        # Получаем информацию о пользователе
        user_info = get_google_user_info(code)
        
        conn = sqlite3.connect('notes.db')
        c = conn.cursor()
        
        # Проверяем существование пользователя или создаем нового
        c.execute('SELECT id FROM users WHERE email = ?', (user_info['email'],))
        user = c.fetchone()
        
        if user is None:
            username = user_info['email'].split('@')[0]
            c.execute('''
                INSERT INTO users (email, username, google_id, last_login)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ''', (user_info['email'], username, user_info['sub']))
            user_id = c.lastrowid
        else:
            user_id = user[0]
            c.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', (user_id,))
        
        conn.commit()
        conn.close()
        
        session['user_id'] = user_id
        return redirect('/')
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/logout')
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'})

@app.route('/api/auth/user')
@login_required
def get_user():
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute('SELECT id, email, username, created_at FROM users WHERE id = ?', (session['user_id'],))
    user = c.fetchone()
    conn.close()
    
    return jsonify({
        'id': user[0],
        'email': user[1],
        'username': user[2],
        'created_at': user[3]
    })

@app.route('/api/notes', methods=['GET'])
@login_required
def get_notes():
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute('''
        SELECT n.*, u.username 
        FROM notes n 
        JOIN users u ON n.user_id = u.id 
        WHERE user_id = ? 
        ORDER BY n.updated_at DESC
    ''', (session['user_id'],))
    
    notes = [{
        'id': row[0],
        'title': row[1],
        'content': row[2],
        'created_at': row[3],
        'updated_at': row[4],
        'author': row[6]
    } for row in c.fetchall()]
    
    conn.close()
    return jsonify(notes)

@app.route('/api/notes', methods=['POST'])
@login_required
def create_note():
    data = request.json
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    
    now = datetime.datetime.now().isoformat()
    c.execute('''
        INSERT INTO notes (title, content, user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (data['title'], data['content'], session['user_id'], now, now))
    
    note_id = c.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': note_id, 'message': 'Note created successfully'})

@app.route('/api/notes/<int:note_id>', methods=['PUT'])
@login_required
def update_note(note_id):
    data = request.json
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    
    # Проверяем, принадлежит ли заметка пользователю
    c.execute('SELECT user_id FROM notes WHERE id = ?', (note_id,))
    note = c.fetchone()
    
    if not note or note[0] != session['user_id']:
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 401
    
    c.execute('''
        UPDATE notes 
        SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
    ''', (data['title'], data['content'], note_id, session['user_id']))
    
    conn.commit()
    conn.close()
    return jsonify({'message': 'Note updated successfully'})

@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
@login_required
def delete_note(note_id):
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    
    # Проверяем, принадлежит ли заметка пользователю
    c.execute('SELECT user_id FROM notes WHERE id = ?', (note_id,))
    note = c.fetchone()
    
    if not note or note[0] != session['user_id']:
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 401
    
    c.execute('DELETE FROM notes WHERE id = ? AND user_id = ?', (note_id, session['user_id']))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Note deleted successfully'})

@app.route('/api/notes/search', methods=['GET'])
@login_required
def search_notes():
    query = request.args.get('q', '')
    strict_search = request.args.get('strict', 'false').lower() == 'true'
    
    if not query:
        return get_notes()
    
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute('''
        SELECT n.*, u.username 
        FROM notes n 
        JOIN users u ON n.user_id = u.id 
        WHERE n.user_id = ? 
        ORDER BY n.updated_at DESC
    ''', (session['user_id'],))
    all_notes = c.fetchall()
    conn.close()

    if strict_search:
        notes = [
            {
                'id': row[0],
                'title': row[1],
                'content': row[2],
                'created_at': row[3],
                'updated_at': row[4],
                'author': row[6]
            }
            for row in all_notes
            if query.lower() in row[1].lower() or query.lower() in row[2].lower()
        ]
    else:
        notes = [
            {
                'id': row[0],
                'title': row[1],
                'content': row[2],
                'created_at': row[3],
                'updated_at': row[4],
                'author': row[6]
            }
            for row in all_notes
            if fuzzy_search(row[1], query) or fuzzy_search(row[2], query)
        ]

    return jsonify(notes)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')