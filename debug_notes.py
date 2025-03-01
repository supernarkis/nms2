import sqlite3

def check_db():
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    
    print("=== Пользователи ===")
    c.execute('SELECT * FROM users')
    users = c.fetchall()
    for user in users:
        print(f"ID: {user[0]}, Email: {user[1]}, Username: {user[2]}, Created: {user[3]}, Last Login: {user[4]}, Google ID: {user[5]}")
    
    print("\n=== Заметки ===")
    c.execute('SELECT * FROM notes')
    notes = c.fetchall()
    for note in notes:
        print(f"ID: {note[0]}, Title: {note[1]}, Content: {note[2][:50]}..., Created: {note[3]}, Updated: {note[4]}, User ID: {note[5]}")
    
    conn.close()

if __name__ == "__main__":
    check_db() 

