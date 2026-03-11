#!/bin/bash
# Gmail邮箱监控脚本 - 本地运行版本

cd "$(dirname "$0")/.."

echo "=== Gmail邮箱监控 ==="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"

# 运行Python监控脚本
python3 scripts/monitor-gmail.py

# 如果有重要邮件，发送通知（示例）
if [ -f "data/important_emails_latest.json" ]; then
    count=$(jq '.count' data/important_emails_latest.json 2>/dev/null || echo "0")
    if [ "$count" -gt "0" ]; then
        echo "⚠️  发现 $count 封重要邮件"
        # 这里可以添加通知逻辑，比如：
        # - 发送Telegram消息
        # - 发送系统通知
        # - 记录到日志文件
    fi
fi

echo "监控完成"
echo ""