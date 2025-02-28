import sqlite3

def migrate_notes():
    conn = sqlite3.connect('notes.db')
    c = conn.cursor()
    
    # Находим ID первого созданного пользователя
    c.execute('SELECT id FROM users ORDER BY created_at ASC LIMIT 1')
    first_user = c.fetchone()
    
    if not first_user:
        print("Нет пользователей в базе данных")
        conn.close()
        return
        
    first_user_id = first_user[0]
    
    # Обновляем ВСЕ заметки
    c.execute('''
        UPDATE notes 
        SET user_id = ?
    ''', (first_user_id,))
    
    updated_count = c.rowcount
    conn.commit()
    conn.close()
    
    print(f"Все заметки ({updated_count} шт.) перенесены пользователю с ID {first_user_id}")

if __name__ == "__main__":
    migrate_notes() 