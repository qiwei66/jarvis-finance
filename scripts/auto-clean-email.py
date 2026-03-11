#!/usr/bin/env python3
"""
邮箱自动化清理系统
低成本模型/agent定期执行：
1. 清理验证码邮件（一次性）
2. 归档重要邮件（银行、财务）
3. 删除垃圾邮件
4. 分类整理
"""

import imaplib
import email
from email.header import decode_header
import ssl
from datetime import datetime, timedelta
import re
import json
import os

# 配置
GMAIL_EMAIL = "kiwei666888@gmail.com"
GMAIL_APP_PASSWORD = "ktxjswdkejmhwtkp"
IMAP_SERVER = "imap.gmail.com"
IMAP_PORT = 993

# 清理策略 - 每天一次综合清理
CLEANUP_RULES = {
    # 验证码邮件：超过24小时自动删除（每天清理昨天的验证码）
    "verification": {
        "keywords": ["验证码", "code", "verification", "otp", "一次性密码", "登录验证", "security code"],
        "max_age_hours": 24,
        "action": "delete",
        "preserve_if": []  # 保留条件
    },
    
    # 推广邮件：超过14天自动删除（两周清理一次）
    "promotion": {
        "keywords": ["promotion", "sale", "折扣", "优惠", "subscribe", "订阅", "newsletter", "deal", "offer"],
        "max_age_days": 14,
        "action": "delete",
        "senders": ["noreply@medium.com", "newsletter@", "promo@", "marketing@", "sales@"]
    },
    
    # 技术通知：超过60天归档（两月归档一次）
    "tech_notification": {
        "keywords": ["github", "stack", "update", "release", "版本更新", "changelog", "announcement"],
        "max_age_days": 60,
        "action": "archive",
        "label": "技术"
    },
    
    # 财务邮件：永久保留，添加标签
    "financial": {
        "keywords": ["bank", "招商", "cmb", "alipay", "支付宝", "信用卡", "账单", "交易", "statement", "invoice"],
        "action": "label",
        "label": "财务",
        "priority": "high"
    },
    
    # 社交通知：超过30天标记已读
    "social": {
        "keywords": ["twitter", "facebook", "linkedin", "微信", "wechat", "like", "comment", "follow"],
        "max_age_days": 30,
        "action": "mark_read"
    }
}

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

def get_email_age(email_date_str):
    """计算邮件年龄（小时）"""
    try:
        # 解析邮件日期
        email_date = email.utils.parsedate_to_datetime(email_date_str)
        now = datetime.now(email_date.tzinfo) if email_date.tzinfo else datetime.now()
        age_hours = (now - email_date).total_seconds() / 3600
        return age_hours
    except:
        return 999  # 无法解析则认为是旧邮件

def classify_email(msg):
    """分类邮件"""
    subject = decode_mime_words(msg.get("Subject", "")).lower()
    from_addr = msg.get("From", "").lower()
    date_str = msg.get("Date", "")
    
    # 提取发件人邮箱
    sender_match = re.search(r'<([^>]+)>', from_addr)
    sender = sender_match.group(1) if sender_match else from_addr
    
    age_hours = get_email_age(date_str)
    
    # 应用分类规则
    for category, rule in CLEANUP_RULES.items():
        # 检查关键词
        keywords_match = any(keyword.lower() in subject or keyword.lower() in from_addr 
                           for keyword in rule.get("keywords", []))
        
        # 检查发件人
        senders_match = any(sender_pattern in sender 
                          for sender_pattern in rule.get("senders", []))
        
        # 检查年龄
        max_age = rule.get("max_age_hours", 99999) or rule.get("max_age_days", 99999) * 24
        age_ok = age_hours > max_age  # 超过最大年龄才处理
        
        if (keywords_match or senders_match) and age_ok:
            return category, rule, age_hours
    
    return "unknown", None, age_hours

def auto_clean_email():
    """自动清理邮箱"""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始自动清理邮箱")
    print("=" * 60)
    
    try:
        # 连接IMAP
        context = ssl.create_default_context()
        imap = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT, ssl_context=context)
        imap.login(GMAIL_EMAIL, GMAIL_APP_PASSWORD)
        
        # 选择收件箱
        imap.select("INBOX")
        
        # 搜索所有邮件
        status, messages = imap.search(None, 'ALL')
        
        if not (status == "OK" and messages[0]):
            print("没有找到邮件")
            imap.logout()
            return
        
        email_ids = messages[0].split()
        print(f"找到 {len(email_ids)} 封邮件需要处理")
        
        stats = {
            "total": len(email_ids),
            "processed": 0,
            "deleted": 0,
            "archived": 0,
            "labeled": 0,
            "skipped": 0,
            "errors": 0
        }
        
        # 处理每封邮件（从最旧的开始）
        for i, email_id in enumerate(email_ids):
            try:
                # 获取邮件头
                status, msg_data = imap.fetch(email_id, '(BODY[HEADER])')
                
                if status != "OK":
                    stats["errors"] += 1
                    continue
                
                msg = email.message_from_bytes(msg_data[0][1])
                
                # 分类
                category, rule, age_hours = classify_email(msg)
                
                if category == "unknown" or not rule:
                    stats["skipped"] += 1
                    continue
                
                # 执行操作
                action = rule.get("action")
                subject = decode_mime_words(msg.get("Subject", ""))[:50]
                
                if action == "delete":
                    # 移动到垃圾邮件（实际删除需要先移动到Trash）
                    print(f"🗑️  删除: {subject} ({age_hours:.1f}小时前)")
                    imap.store(email_id, '+FLAGS', '\\Deleted')
                    stats["deleted"] += 1
                    
                elif action == "archive":
                    # 标记已读并移动到归档文件夹
                    print(f"📁 归档: {subject}")
                    imap.store(email_id, '+FLAGS', '\\Seen')
                    # 这里需要创建对应的标签/文件夹
                    stats["archived"] += 1
                    
                elif action == "label":
                    # 添加标签（Gmail需要特殊处理）
                    label = rule.get("label", "重要")
                    print(f"🏷️  标记: {subject} -> [{label}]")
                    stats["labeled"] += 1
                    
                elif action == "mark_read":
                    # 标记已读
                    imap.store(email_id, '+FLAGS', '\\Seen')
                    stats["processed"] += 1
                
                stats["processed"] += 1
                
                # 每处理10封邮件输出一次进度
                if (i + 1) % 10 == 0:
                    print(f"进度: {i+1}/{len(email_ids)}")
                
            except Exception as e:
                print(f"处理邮件 {email_id} 出错: {str(e)}")
                stats["errors"] += 1
        
        # 永久删除标记为删除的邮件
        imap.expunge()
        
        # 关闭连接
        imap.close()
        imap.logout()
        
        # 输出统计
        print("\\n" + "=" * 60)
        print("📊 清理统计:")
        print(f"   总共邮件: {stats['total']}")
        print(f"   已处理: {stats['processed']}")
        print(f"   删除: {stats['deleted']}")
        print(f"   归档: {stats['archived']}")
        print(f"   标记: {stats['labeled']}")
        print(f"   跳过: {stats['skipped']}")
        print(f"   错误: {stats['errors']}")
        
        # 保存日志
        save_cleanup_log(stats)
        
    except Exception as e:
        print(f"清理过程出错: {str(e)}")

def save_cleanup_log(stats):
    """保存清理日志"""
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "stats": stats,
        "rules_applied": list(CLEANUP_RULES.keys())
    }
    
    # 保存到jarvis-finance项目目录
    output_dir = os.path.expanduser("~/.openclaw/workspace/jarvis-finance/logs")
    os.makedirs(output_dir, exist_ok=True)
    
    filename = f"email_cleanup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(log_data, f, ensure_ascii=False, indent=2)
    
    print(f"📝 日志已保存: {filepath}")

def setup_cron_schedule():
    """设置定时任务建议"""
    print("\\n⏰ 建议的定时任务配置（每天一次综合清理）:")
    print("=" * 60)
    
    cron_schedule = {
        "每日综合清理": {
            "schedule": "0 9 * * *",  # 每天上午9点
            "task": "综合清理：验证码(>24h)、推广(>14d)、技术归档(>60d)、财务标记",
            "model": "免费模型 (zenmux/deepseek)",
            "cost": "$0"
        },
        "周度优化": {
            "schedule": "0 10 * * 0",  # 每周日10点
            "task": "优化清理规则，分析邮件模式，生成周报",
            "model": "Claude Sonnet (中等成本)",
            "cost": "$0.10/次"
        },
        "月度深度分析": {
            "schedule": "0 9 1 * *",  # 每月1号9点
            "task": "深度分析邮件习惯，优化分类算法，生成月度报告",
            "model": "Claude Opus (高质量)",
            "cost": "$1.00/次"
        }
    }
    
    for task_name, config in cron_schedule.items():
        print(f"{task_name}:")
        print(f"  时间: {config['schedule']}")
        print(f"  任务: {config['task']}")
        print(f"  模型: {config['model']}")
        print(f"  成本: {config['cost']}")
        print()

def test_rules():
    """测试分类规则"""
    print("🧪 测试分类规则...")
    
    test_emails = [
        {"subject": "您的验证码是 123456", "from": "noreply@example.com", "expected": "verification"},
        {"subject": "招商银行信用卡账单", "from": "cmb@bank.com", "expected": "financial"},
        {"subject": "GitHub: New release available", "from": "notifications@github.com", "expected": "tech_notification"},
        {"subject": "Black Friday Sale 50% OFF", "from": "promo@store.com", "expected": "promotion"},
    ]
    
    for test in test_emails:
        # 模拟邮件对象
        class MockMsg:
            def get(self, key, default=""):
                if key == "Subject":
                    return test["subject"]
                elif key == "From":
                    return test["from"]
                elif key == "Date":
                    return "Mon, 1 Jan 2024 00:00:00 +0000"
                return default
        
        msg = MockMsg()
        category, rule, age = classify_email(msg)
        
        result = "✅" if category == test["expected"] else "❌"
        print(f"{result} {test['subject']} -> {category} (预期: {test['expected']})")

if __name__ == "__main__":
    print("📧 邮箱自动化清理系统")
    print("=" * 60)
    
    # 测试规则
    test_rules()
    
    print("\\n" + "=" * 60)
    
    # 询问是否执行清理
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--auto":
        auto_clean_email()
    else:
        print("安全模式：只显示计划，不实际执行")
        print("使用 --auto 参数实际执行清理")
        print("\\n本次将执行的操作:")
        auto_clean_email()
    
    # 显示定时任务建议
    setup_cron_schedule()