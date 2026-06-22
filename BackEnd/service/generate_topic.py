from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

MODEL = "gpt-4o-mini"

def load_prompt(path="gen_topic_prompt.txt"):
    base_dir = Path(__file__).resolve().parent
    full_path = base_dir / path

    with open(full_path, "r", encoding="utf-8") as f:
        return f.read()


def get_topic(topic: str, content: str, client) -> str:
    system_prompt = load_prompt()
    user_message = f"Topic: {topic}\n\nContent:\n{content}"

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        max_tokens=50,
    )

    return response.choices[0].message.content.strip()
