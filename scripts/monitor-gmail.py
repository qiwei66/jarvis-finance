#!/usr/bin/env python3
"""
Gmail 邮箱监控脚本
监控 kiwei666888@gmail.com 的新邮件，特别关注：
1. 登录验证码
2. 银行/财务相关邮件
3. 重要通知
"""

import imaplib
import email
from email.header import decode_header
import time
import json
import os
from datetime import datetime
import re

# Gmail 配置
GMAIL_EMAIL = "kiwei666888@gmail.com"
GMAIL_APP_PASSWORD = "ktxjswdkejmhwtkp"  # App Password（去掉空格）
IMAP_SERVER = "imap.gmail.com"
IMAP_PORT = 993

# 关键词监控（中文+英文）
KEYWORDS = [
    # 验证码相关
    "验证码", "code", "verification", "OTP", "一次性密码",
    "登录验证", "security code", "确认码",
    
    # 银行/财务相关
    "招行", "招商银行", "CMB", "信用卡", "账单",
    "支付宝", "Alipay", "转账", "交易",
    "工资", "salary", "收入",
    
    # 重要通知
    "重要", "urgent", "紧急", "attention",
    "通知", "notification", "提醒"
]

def decode_mime_words(text):
    """解码MIME编码的邮件头"""
    if text is None:
        return ""
    decoded_parts = decode_header(text)
    result = []
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            if encoding:
                result.append(part.decode(encoding))
            else:
                result.append(part.decode('utf-8', errors='ignore'))
        else:
            result.append(part)
    return "".join(result)

def check_for_important_email(msg):
    """检查邮件是否重要"""
    subject = decode_mime_words(msg.get("Subject", ""))
    from_addr = msg.get("From", "")
    
    # 提取邮件正文（简单版本）
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain":
                try:
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    break
                except:
                    pass
    else:
        try:
            body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
        except:
            pass
    
    full_text = f"{subject} {from_addr} {body}".lower()
    
    # 检查关键词
    important = False
    matched_keywords = []
    
    for keyword in KEYWORDS:
        if keyword.lower() in full_text:
            important = True
            matched_keywords.append(keyword)
    
    # 检查验证码模式
    verification_patterns = [
        r'\b\d{4,6}\b',  # 4-6位数字验证码
        r'code.*\b\d{4,6}\b',
        r'验证码.*\b\d{4,6}\b'
    ]
    
    for pattern in verification_patterns:
        if re.search(pattern, body or "", re.IGNORECASE):
            important = True
            matched_keywords.append("验证码模式")
            break
    
    return important, {
        "subject": subject,
        "from": from_addr,
        "date": msg.get("Date", ""),
        "matched_keywords": matched_keywords,
        "snippet": (body[:200] + "...") if body else ""
    }

def monitor_gmail():
    """监控Gmail新邮件"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始监控Gmail...")
    
    try:
        # 连接IMAP服务器
        imap = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
        imap.login(GMAIL_EMAIL, GMAIL_APP_PASSWORD)
        
        # 选择收件箱
        imap.select("INBOX")
        
        # 搜索未读邮件
        status, messages = imap.search(None, 'UNSEEN')
        
        if status == "OK" and messages[0]:
            email_ids = messages[0].split()
            print(f"发现 {len(email_ids)} 封未读邮件")
            
            important_emails = []
            
            for email_id in email_ids:
                # 获取邮件
                status, msg_data = imap.fetch(email_id, '(RFC822)')
                
                if status == "OK":
                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)
                    
                    # 检查是否重要
                    important, email_info = check_for_important_email(msg)
                    
                    if important:
                        important_emails.append(email_info)
                        print(f"⚠️ 重要邮件: {email_info['subject']}")
                        print(f"   发件人: {email_info['from']}")
                        print(f"   匹配关键词: {', '.join(email_info['matched_keywords'])}")
                        print(f"   摘要: {email_info['snippet']}")
                        print("-" * 50)
            
            # 如果有重要邮件，保存到文件
            if important_emails:
                save_important_emails(important_emails)
        
        # 关闭连接
        imap.close()
        imap.logout()
        
        return important_emails
        
    except Exception as e:
        print(f"监控出错: {str(e)}")
        return []

def save_important_emails(emails):
    """保存重要邮件到JSON文件"""
    data = {
        "timestamp": datetime.now().isoformat(),
        "count": len(emails),
        "emails": emails
    }
    
    # 保存到jarvis-finance项目目录
    output_dir = os.path.expanduser("~/.openclaw/workspace/jarvis-finance/data")
    os.makedirs(output_dir, exist_ok=True)
    
    filename = f"important_emails_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"重要邮件已保存到: {filepath}")
    
    # 同时保存到最新文件
    latest_file = os.path.join(output_dir, "important_emails_latest.json")
    with open(latest_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def test_connection():
    """测试连接"""
    print("测试Gmail连接...")
    try:
        imap = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
        imap.login(GMAIL_EMAIL, GMAIL_APP_PASSWORD)
        
        status, folders = imap.list()
        print(f"连接成功！找到 {len(folders)} 个邮箱文件夹")
        
        imap.logout()
        return True
    except Exception as e:
        print(f"连接失败: {str(e)}")
        return False

if __name__ == "__main__":
    # 测试连接
    if test_connection():
        print("连接测试通过")
        
        # 运行一次监控
        important = monitor_gmail()
        
        if important:
            print(f"发现 {len(important)} 封重要邮件")
        else:
            print("没有发现重要邮件")
    else:
        print("连接测试失败，请检查App Password")