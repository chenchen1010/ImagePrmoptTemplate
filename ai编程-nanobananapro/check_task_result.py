import requests
import json
import time
import os

API_KEY = "sk-Hft7jGWOElcT6gVH4DXZBXdx33YvuF4WLXOn355spfowUIKs"
TASK_ID = "task_01KH6RQRT5M8YCSQ1KWBC166WJ"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def check_task():
    """查询任务状态"""
    response = requests.get(f"https://api.apimart.ai/v1/tasks/{TASK_ID}", headers=headers)
    return response.json()

def download_image(url, filename):
    """下载图片"""
    response = requests.get(url)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    filepath = os.path.join(script_dir, filename)
    with open(filepath, 'wb') as f:
        f.write(response.content)
    print(f"图片已保存: {filepath}")

print(f"正在查询任务: {TASK_ID}\n")

result = check_task()
print(json.dumps(result, indent=2, ensure_ascii=False))

data = result.get("data", {})
status = data.get("status")

if status == "completed":
    print("\n任务完成!")
    # 尝试获取图片URL
    output = data.get("output", [])
    if output:
        for i, item in enumerate(output):
            url = item.get("url") if isinstance(item, dict) else item
            if url:
                print(f"图片URL: {url}")
                download_image(url, f"result_{i}.png")
elif status == "failed":
    print("\n任务失败!")
    print(f"错误信息: {data.get('error', '未知错误')}")
else:
    print(f"\n任务状态: {status}")
    print(f"进度: {data.get('progress', 0)}%")
    print("\n请稍后再次运行此脚本查询结果")
