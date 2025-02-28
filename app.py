from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import datetime

app = Flask(__name__)
CORS(app)

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
    c.execute('''
        CREATE TABLE IF NOT EXISTS notes
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
         title TEXT NOT NULL,
         content TEXT NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/api/notes', methods=['GET'])
def get_notes():
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute('SELECT * FROM notes ORDER BY created_at DESC')
    notes = [{'id': row[0], 'title': row[1], 'content': row[2], 'created_at': row[3]} 
             for row in c.fetchall()]
    conn.close()
    return jsonify(notes)

@app.route('/api/notes', methods=['POST'])
def create_note():
    data = request.json
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute('INSERT INTO notes (title, content) VALUES (?, ?)',
              (data['title'], data['content']))
    conn.commit()
    note_id = c.lastrowid
    conn.close()
    return jsonify({'id': note_id, 'message': 'Note created successfully'})

@app.route('/api/notes/<int:note_id>', methods=['PUT'])
def update_note(note_id):
    data = request.json
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute('UPDATE notes SET title = ?, content = ? WHERE id = ?',
              (data['title'], data['content'], note_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Note updated successfully'})

@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute('DELETE FROM notes WHERE id = ?', (note_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Note deleted successfully'})

@app.route('/api/notes/search', methods=['GET'])
def search_notes():
    query = request.args.get('q', '')
    strict_search = request.args.get('strict', 'false').lower() == 'true'
    
    if not query:
        return get_notes()
    
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    c.execute('SELECT * FROM notes ORDER BY created_at DESC')
    all_notes = c.fetchall()
    conn.close()

    if strict_search:
        # Регистронезависимый поиск по точному совпадению
        notes = [
            {'id': row[0], 'title': row[1], 'content': row[2], 'created_at': row[3]}
            for row in all_notes
            if query.lower() in row[1].lower() or query.lower() in row[2].lower()
        ]
    else:
        # Нечеткий поиск с использованием расстояния Левенштейна
        notes = [
            {'id': row[0], 'title': row[1], 'content': row[2], 'created_at': row[3]}
            for row in all_notes
            if fuzzy_search(row[1], query) or fuzzy_search(row[2], query)
        ]

    return jsonify(notes)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')