import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Получить подключение к БД"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

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
    Обрабатывает заказы билетов и отправляет подтверждение на email
    Args: event - содержит httpMethod, body с данными заказа
          context - контекст выполнения функции
    Returns: HTTP ответ с результатом операции
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    
    full_name = body.get('full_name')
    email = body.get('email')
    phone = body.get('phone')
    cart_items = body.get('cart_items', [])
    total_amount = body.get('total_amount', 0)
    
    if not all([full_name, email, phone]):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Заполните все поля'}),
            'isBase64Encoded': False
        }
    
    if not cart_items:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Корзина пуста'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        order_number = f"ORD-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        cur.execute(
            """INSERT INTO t_p613096_greeting_project_36.orders 
            (order_number, full_name, email, phone, total_amount, status, created_at) 
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (order_number, full_name, email, phone, total_amount, 'confirmed', datetime.now())
        )
        order_id = cur.fetchone()['id']
        
        for item in cart_items:
            cur.execute(
                """INSERT INTO t_p613096_greeting_project_36.order_items 
                (order_id, event_title, ticket_type, price, quantity) 
                VALUES (%s, %s, %s, %s, %s)""",
                (order_id, item['eventTitle'], item['ticketType'], item['price'], item['quantity'])
            )
        
        conn.commit()
        
        tickets_html = ""
        for item in cart_items:
            tickets_html += f"""
            <tr>
                <td style="padding: 15px; border-bottom: 1px solid #eee;">
                    <strong style="color: #333; display: block; margin-bottom: 5px;">{item['eventTitle']}</strong>
                    <span style="color: #666; font-size: 14px;">{item['ticketType']}</span>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: center; color: #666;">
                    {item['quantity']} шт.
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right; color: #333; font-weight: bold;">
                    {item['price'] * item['quantity']} ₽
                </td>
            </tr>
            """
        
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
            <div style="background: #9b87f5; padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px;">🎫 EventHub</h1>
            </div>
            
            <div style="padding: 30px; background: white;">
                <h2 style="color: #333; margin-top: 0;">Спасибо за заказ!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Здравствуйте, {full_name}!<br><br>
                    Ваш заказ успешно оформлен. Ниже вы найдете детали вашего заказа.
                </p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <p style="margin: 5px 0; color: #666;"><strong>Номер заказа:</strong> {order_number}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Дата:</strong> {datetime.now().strftime('%d.%m.%Y %H:%M')}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> {email}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Телефон:</strong> {phone}</p>
                </div>
                
                <h3 style="color: #333; margin-top: 30px;">Ваши билеты:</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #f9f9f9;">
                            <th style="padding: 15px; text-align: left; color: #666; font-weight: 600;">Мероприятие</th>
                            <th style="padding: 15px; text-align: center; color: #666; font-weight: 600;">Кол-во</th>
                            <th style="padding: 15px; text-align: right; color: #666; font-weight: 600;">Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets_html}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding: 20px 15px; text-align: right; font-weight: bold; color: #333; font-size: 18px;">
                                Итого:
                            </td>
                            <td style="padding: 20px 15px; text-align: right; font-weight: bold; color: #9b87f5; font-size: 20px;">
                                {total_amount} ₽
                            </td>
                        </tr>
                    </tfoot>
                </table>
                
                <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 25px 0;">
                    <p style="margin: 0; color: #2e7d32; font-weight: 600;">✓ Билеты забронированы</p>
                    <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                        Сохраните это письмо. Покажите его на входе или предъявите QR-код с номером заказа.
                    </p>
                </div>
                
                <p style="color: #999; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    Если у вас возникли вопросы, свяжитесь с нами: info@eventhub.ru или +7 (495) 123-45-67
                </p>
            </div>
            
            <div style="background: #f9f9f9; padding: 20px; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                    © 2025 EventHub. Все права защищены.
                </p>
            </div>
        </body>
        </html>
        """
        
        email_sent = send_email(email, f'Ваши билеты EventHub - Заказ {order_number}', email_body)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'order_number': order_number,
                'email_sent': email_sent,
                'message': 'Билеты отправлены на email' if email_sent else 'Заказ оформлен, но email не отправлен'
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        conn.rollback()
        print(f'Order error: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка оформления заказа: {str(e)}'}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()
