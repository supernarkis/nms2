from datetime import datetime, timedelta
import jwt
from functools import wraps
from flask import request, jsonify
import os

JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = 'HS256'
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

def create_token(user_id, token_type='access'):
    expires_delta = JWT_ACCESS_TOKEN_EXPIRES if token_type == 'access' else JWT_REFRESH_TOKEN_EXPIRES
    expires = datetime.utcnow() + expires_delta
    
    payload = {
        'user_id': user_id,
        'type': token_type,
        'exp': expires,
        'iat': datetime.utcnow()
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('auth_token')
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
            
        payload = decode_token(token)
        if not payload:
            return jsonify({'message': 'Token is invalid'}), 401
            
        kwargs['user_id'] = payload['user_id']
        return f(*args, **kwargs)
        
    return decorated 