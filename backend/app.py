from flask import Flask, request, jsonify, make_response

from google.oauth2 import id_token
from google.auth.transport import requests
import os
import secrets
from dotenv import load_dotenv
from auth import create_token, token_required, decode_token

# Загружаем .env если есть
load_dotenv()

# Автоматическая настройка переменных окружения
def setup_env():
    env_file = '.env'
    needs_update = False
    env_vars = {}
    
    # Читаем текущие переменные если файл существует
    if os.path.exists(env_file):
        try:
            with open(env_file, 'r') as f:
                for line in f:
                    if '=' in line:
                        key, value = line.strip().split('=', 1)
                        env_vars[key] = value
        except Exception as e:
            print(f"Ошибка чтения .env: {e}")
            return

    # Сохраняем GOOGLE_CLIENT_ID если он есть
    if os.getenv('GOOGLE_CLIENT_ID'):
        env_vars['GOOGLE_CLIENT_ID'] = os.getenv('GOOGLE_CLIENT_ID')

    # Устанавливаем FLASK_ENV в production
    if os.getenv('FLASK_ENV') != 'production':
        env_vars['FLASK_ENV'] = 'production'
        os.environ['FLASK_ENV'] = 'production'
        needs_update = True

    # Генерируем JWT_SECRET если его нет
    if not os.getenv('JWT_SECRET'):
        jwt_secret = secrets.token_urlsafe(32)
        env_vars['JWT_SECRET'] = jwt_secret
        os.environ['JWT_SECRET'] = jwt_secret
        needs_update = True

    # Записываем обновленные переменные в файл
    if needs_update:
        try:
            with open(env_file, 'w') as f:
                for key, value in env_vars.items():
                    f.write(f'{key}={value}\n')
        except Exception as e:
            print(f"Ошибка записи .env: {e}")

# Настраиваем переменные окружения
setup_env()

# Проверяем обязательные переменные
if not os.getenv('GOOGLE_CLIENT_ID'):
    raise ValueError("GOOGLE_CLIENT_ID не настроен")
if not os.getenv('JWT_SECRET'):
    raise ValueError("JWT_SECRET не настроен")

app = Flask(__name__)

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
JWT_SECRET = os.getenv('JWT_SECRET')

@app.route('/auth/google', methods=['POST'])
def google_auth():
    try:
        token = request.json.get('token')
        if not token:
            return jsonify({'error': 'Token not provided'}), 400

        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        
        user_id = idinfo['sub']
        
        # Создаем JWT токены
        access_token = create_token(user_id, 'access')
        refresh_token = create_token(user_id, 'refresh')
        
        # Создаем ответ
        response = make_response(jsonify({
            'user': {
                'id': user_id,
                'email': idinfo.get('email'),
                'name': idinfo.get('name'),
                'picture': idinfo.get('picture')
            }
        }))
        
        # Устанавливаем куки
        cookie_options = {
            'httponly': True,
            'secure': True,
            'samesite': 'Strict',
            'max_age': 30*24*60*60  # 30 дней
        }
        
        response.set_cookie('auth_token', access_token, **cookie_options)
        response.set_cookie('refresh_token', refresh_token, **cookie_options)
        
        return response
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        return jsonify({'error': 'Authentication failed'}), 500

@app.route('/api/notes', methods=['GET'])
@token_required
def get_notes(user_id):
    # TODO: Добавить работу с базой данных
    return jsonify({'notes': [], 'user_id': user_id})

@app.route('/api/notes', methods=['POST'])
@token_required
def create_note(user_id):
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    # TODO: Добавить работу с базой данных
    return jsonify({'note': data, 'user_id': user_id}), 201

@app.route('/api/notes/<note_id>', methods=['PUT'])
@token_required
def update_note(user_id, note_id):
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    # TODO: Добавить работу с базой данных
    return jsonify({'note': data, 'user_id': user_id})

@app.route('/api/notes/<note_id>', methods=['DELETE'])
@token_required
def delete_note(user_id, note_id):
    # TODO: Добавить работу с базой данных
    return jsonify({'success': True, 'user_id': user_id})

@app.route('/auth/refresh', methods=['POST'])
def refresh_auth():
    refresh_token = request.cookies.get('refresh_token')
    if not refresh_token:
        return jsonify({'message': 'Refresh token is missing'}), 401

    payload = decode_token(refresh_token)
    if not payload or payload.get('type') != 'refresh':
        return jsonify({'message': 'Invalid refresh token'}), 401

    # Генерим новый access token 
    access_token = create_token(payload['user_id'], 'access')
    
    response = make_response(jsonify({'message': 'Token refreshed'}))
    
    cookie_options = {
        'httponly': True,
        'secure': True,
        'samesite': 'Strict',
        'max_age': 30*24*60*60  # 30 дней
    }
    
    response.set_cookie('auth_token', access_token, **cookie_options)
    
    return response

@app.route('/auth/logout', methods=['POST'])
def logout():
    response = make_response(jsonify({'message': 'Logged out'}))
    response.delete_cookie('auth_token')
    response.delete_cookie('refresh_token')
    return response

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    auth_token = request.cookies.get('auth_token')
    if not auth_token:
        return jsonify({'authenticated': False}), 200
        
    try:
        payload = decode_token(auth_token)
        if payload and payload.get('type') == 'access':
            return jsonify({'authenticated': True}), 200
    except:
        pass
        
    return jsonify({'authenticated': False}), 200

@app.route('/api/auth/user', methods=['GET'])
@token_required
def get_user(user_id):
    # В будущем здесь можно добавить получение данных пользователя из базы данных
    return jsonify({
        'id': user_id,
        'username': 'User ' + user_id[:6]  # Временное решение
    })

if __name__ == '__main__':
    app.run(debug=False)