import requests
import base64
import json
import os

# API配置
API_URL = "https://api.apimart.ai/v1/images/generations"
API_KEY = "sk-Hft7jGWOElcT6gVH4DXZBXdx33YvuF4WLXOn355spfowUIKs"

def image_to_base64(image_path):
    """将图片转换为base64格式"""
    with open(image_path, "rb") as image_file:
        base64_data = base64.b64encode(image_file.read()).decode("utf-8")

    # 根据文件扩展名确定MIME类型
    ext = os.path.splitext(image_path)[1].lower()
    mime_types = {
        ".jpg": "jpeg",
        ".jpeg": "jpeg",
        ".png": "png",
        ".webp": "webp"
    }
    mime_type = mime_types.get(ext, "jpeg")

    return f"data:image/{mime_type};base64,{base64_data}"

def generate_model_wearing_tshirt():
    """调用API生成模特穿搭插画图"""

    # 获取当前脚本所在目录
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # 图片路径
    outfit_image_path = os.path.join(script_dir, "image.png")         # 服装配件flat-lay图
    style_image_path = os.path.join(script_dir, "image copy.png")     # 风格参考模特插画图

    # 检查图片是否存在
    for path, name in [(outfit_image_path, "服装配件图(image.png)"), (style_image_path, "风格参考图(image copy.png)")]:
        if not os.path.exists(path):
            print(f"❌ 错误: {name}不存在: {path}")
            return None

    # 转换图片为base64
    print("正在转换图片为base64格式...")
    outfit_base64 = image_to_base64(outfit_image_path)
    style_base64 = image_to_base64(style_image_path)

    # 构建请求payload
    payload = {
        "model": "gemini-3-pro-image-preview",
        "prompt": "请参考第二张图片的时尚插画风格，生成一位穿着第一张图片中服装配件的模特插画。第一张图片中的服装包括：黄色纽扣针织开衫、白色碎花吊带上衣、白色高腰阔腿裤配黑色腰带、黄色帆布包（上面印有红色BEST字样）、黄色心形耳环、黄色厚底运动鞋。请让模特穿上这些服装和配饰，整体造型完整搭配。风格要求：与第二张参考图相同的时尚插画风格，精致的线条感，柔和的色彩渲染，模特姿态自然优雅，有时尚博主的感觉，白色简洁背景。模特为亚洲年轻女性，长发，身材纤细，全身照。",
        "size": "3:4",  # 适合全身模特照的比例
        "n": 1,
        "resolution": "2K",
        "image_urls": [
            {"url": outfit_base64},    # 服装配件图
            {"url": style_base64}      # 风格参考图
        ]
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    print("正在调用API生成图片...")
    print(f"API URL: {API_URL}")

    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        result = response.json()

        print("\nAPI响应:")
        print(json.dumps(result, indent=2, ensure_ascii=False))

        if result.get("code") == 200:
            task_id = result["data"][0]["task_id"]
            print(f"\n任务已提交！")
            print(f"Task ID: {task_id}")
            print("\n请使用Task ID查询结果（API文档中应该有查询接口）")
            return task_id
        else:
            print(f"\n生成失败: {result}")
            return None

    except Exception as e:
        print(f"\n请求出错: {e}")
        return None

if __name__ == "__main__":
    # 检查API Key是否已设置
    if API_KEY == "YOUR_API_KEY_HERE":
        print("请先在脚本中设置你的API Key!")
        print("将 API_KEY = \"YOUR_API_KEY_HERE\" 替换为你的实际API Key")
    else:
        generate_model_wearing_tshirt()
