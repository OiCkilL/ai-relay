#!/bin/bash
# 团队成员 Git 身份设置脚本
# 使用方法: bash scripts/setup-git-identity.sh <成员名>
#
# Git 身份规则：
# - 名字：agent-[name]（GitHub 账号名）
# - 邮箱：[name]@izmw.me（真实邮箱）
# - Pusher：统一用 Boss 的 GitHub 账号

MEMBER=$1

case $MEMBER in
  "小赫"|"xiaohe")
    git config user.name "agent-xiaohe"
    git config user.email "xiaohe@izmw.me"
    ;;
  "饼哥"|"bingge")
    git config user.name "agent-bingge"
    git config user.email "bingge@izmw.me"
    ;;
  "像素姐"|"pixiel")
    git config user.name "agent-pixiel"
    git config user.email "pixiel@izmw.me"
    ;;
  "码飞"|"mafei")
    git config user.name "agent-mafei"
    git config user.email "mafei@izmw.me"
    ;;
  *)
    echo "未知成员: $MEMBER"
    echo "可选: 小赫/xiaohe, 饼哥/bingge, 像素姐/pixiel, 码飞/mafei"
    exit 1
    ;;
esac

echo "✅ Git 身份已设置为:"
echo "   姓名: $(git config user.name)"
echo "   邮箱: $(git config user.email)"
