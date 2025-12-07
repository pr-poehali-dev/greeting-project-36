import json
import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib

def get_db_connection():
    """Получить подключение к БД"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    """Хешировать пароль"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_code() -> str:
    """Генерировать 4-значный код"""
    return str(random.randint(1000, 9999))

def send_email(to_email: str, subject: str, body: str) -> bool:
    """Отправить email"""
    try:
        smtp_host = os.environ.get('SMTP_HOST')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER')
        smtp_password = os.environ.get('SMTP_PASSWORD')
        
        if not all([smtp_host, smtp_user, smtp_password]):
            return False
        
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html', 'utf-8'))
        
        with smtplib.SMTP(smtp_host, smtp_port, timeout=5) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f'Email error: {e}')
        return False

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Обрабатывает запросы авторизации, регистрации и восстановления пароля
    Args: event - содержит httpMethod, body с данными пользователя
          context - контекст выполнения функции
    Returns: HTTP ответ с результатом операции
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body = json.loads(event.get('body', '{}'))
    action = body.get('action')
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if action == 'register':
            email = body.get('email')
            phone = body.get('phone')
            full_name = body.get('full_name')
            password = body.get('password')
            
            if not all([email, phone, full_name, password]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заполните все поля'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT id FROM t_p613096_greeting_project_36.users WHERE email = %s",
                (email,)
            )
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email уже зарегистрирован'}),
                    'isBase64Encoded': False
                }
            
            code = generate_code()
            expires_at = datetime.now() + timedelta(minutes=10)
            
            cur.execute(
                """INSERT INTO t_p613096_greeting_project_36.verification_codes 
                (email, code, code_type, expires_at) VALUES (%s, %s, %s, %s)""",
                (email, code, 'registration', expires_at)
            )
            conn.commit()
            
            email_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #9b87f5; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">EventHub</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #333;">Подтверждение регистрации</h2>
                    <p style="color: #666; font-size: 16px;">Ваш код подтверждения:</p>
                    <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="color: #9b87f5; font-size: 48px; margin: 0; letter-spacing: 8px;">{code}</h1>
                    </div>
                    <p style="color: #666;">Код действителен 10 минут.</p>
                    <p style="color: #999; font-size: 14px;">Если вы не регистрировались на EventHub, проигнорируйте это письмо.</p>
                </div>
            </body>
            </html>
            """
            
            email_sent = send_email(email, 'Код подтверждения EventHub', email_body)
            
            password_hash = hash_password(password)
            cur.execute(
                """INSERT INTO t_p613096_greeting_project_36.users 
                (email, phone, full_name, password_hash, is_verified) 
                VALUES (%s, %s, %s, %s, FALSE)""",
                (email, phone, full_name, password_hash)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Код отправлен на email' if email_sent else 'Регистрация создана, но email не отправлен',
                    'email_sent': email_sent
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'verify':
            email = body.get('email')
            code = body.get('code')
            
            cur.execute(
                """SELECT id, expires_at FROM t_p613096_greeting_project_36.verification_codes 
                WHERE email = %s AND code = %s AND code_type = 'registration' AND used = FALSE 
                ORDER BY created_at DESC LIMIT 1""",
                (email, code)
            )
            verification = cur.fetchone()
            
            if not verification:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный код'}),
                    'isBase64Encoded': False
                }
            
            if datetime.now() > verification['expires_at']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Код истек'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "UPDATE t_p613096_greeting_project_36.verification_codes SET used = TRUE WHERE id = %s",
                (verification['id'],)
            )
            cur.execute(
                "UPDATE t_p613096_greeting_project_36.users SET is_verified = TRUE WHERE email = %s",
                (email,)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Email подтвержден'}),
                'isBase64Encoded': False
            }
        
        elif action == 'login':
            email = body.get('email')
            password = body.get('password')
            
            password_hash = hash_password(password)
            cur.execute(
                """SELECT id, email, phone, full_name, is_verified, role 
                FROM t_p613096_greeting_project_36.users 
                WHERE email = %s AND password_hash = %s""",
                (email, password_hash)
            )
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный email или пароль'}),
                    'isBase64Encoded': False
                }
            
            if not user['is_verified']:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email не подтвержден'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user['id'],
                        'email': user['email'],
                        'phone': user['phone'],
                        'full_name': user['full_name'],
                        'role': user['role']
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'reset_password_request':
            email = body.get('email')
            
            cur.execute(
                "SELECT id FROM t_p613096_greeting_project_36.users WHERE email = %s",
                (email,)
            )
            if not cur.fetchone():
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email не найден'}),
                    'isBase64Encoded': False
                }
            
            code = generate_code()
            expires_at = datetime.now() + timedelta(minutes=10)
            
            cur.execute(
                """INSERT INTO t_p613096_greeting_project_36.verification_codes 
                (email, code, code_type, expires_at) VALUES (%s, %s, %s, %s)""",
                (email, code, 'password_reset', expires_at)
            )
            conn.commit()
            
            email_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #9b87f5; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">EventHub</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #333;">Восстановление пароля</h2>
                    <p style="color: #666; font-size: 16px;">Ваш код для сброса пароля:</p>
                    <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="color: #9b87f5; font-size: 48px; margin: 0; letter-spacing: 8px;">{code}</h1>
                    </div>
                    <p style="color: #666;">Код действителен 10 минут.</p>
                    <p style="color: #999; font-size: 14px;">Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
                </div>
            </body>
            </html>
            """
            
            email_sent = send_email(email, 'Восстановление пароля EventHub', email_body)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Код отправлен на email' if email_sent else 'Запрос создан, но email не отправлен',
                    'email_sent': email_sent
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'reset_password':
            email = body.get('email')
            code = body.get('code')
            new_password = body.get('new_password')
            
            cur.execute(
                """SELECT id, expires_at FROM t_p613096_greeting_project_36.verification_codes 
                WHERE email = %s AND code = %s AND code_type = 'password_reset' AND used = FALSE 
                ORDER BY created_at DESC LIMIT 1""",
                (email, code)
            )
            verification = cur.fetchone()
            
            if not verification:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный код'}),
                    'isBase64Encoded': False
                }
            
            if datetime.now() > verification['expires_at']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Код истек'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hash_password(new_password)
            cur.execute(
                "UPDATE t_p613096_greeting_project_36.verification_codes SET used = TRUE WHERE id = %s",
                (verification['id'],)
            )
            cur.execute(
                "UPDATE t_p613096_greeting_project_36.users SET password_hash = %s WHERE email = %s",
                (password_hash, email)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Пароль изменен'}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неизвестное действие'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()