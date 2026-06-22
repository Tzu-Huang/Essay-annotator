<<<<<<< HEAD
from openai import OpenAI
from dotenv import load_dotenv
import os
from pathlib import Path
import json

load_dotenv()

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

MODEL = "gpt-5.4-mini"

=======
import re
import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path


# ===========================
# Compare config
# ===========================
load_dotenv()
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
MODEL = "gpt-5.4-mini"

MIN_COMPARE_WORDS = 80
MAX_SUGGESTIONS = 3


def get_compare_limit(word_count: int) -> int:
    if word_count < 120:
        return 2
    if word_count < 300:
        return 3
    if word_count < 600:
        return 4
    return 5

>>>>>>> feature/Footer
def load_prompt(path="compare_prompt.txt"):
    base_dir = Path(__file__).resolve().parent
    full_path = base_dir / path

    with open(full_path, "r", encoding="utf-8") as f:
        return f.read()
<<<<<<< HEAD
    
=======


>>>>>>> feature/Footer
# Upon the prompt template, replace the user_essay and database_essay in the prompt
def build_prompt(template, user_essay, database_essay):
    prompt = template.replace("{user_input}", user_essay)
    prompt = prompt.replace("{database_essay}", database_essay)
    return prompt

<<<<<<< HEAD
# Call the LLM model that we're using, and feed with our prompt
def call_llm(prompt):
    response = client.responses.create(
        model = MODEL,
        input = prompt
    )
    return response.output_text # Returns the generated text in one single string
=======

# Count the number of words from the input
def count_words(text: str) -> int:
    return len((text or "").split())


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def split_paragraphs(text: str) -> list[str]:
    return [p.strip() for p in re.split(r"\n\s*\n", text or "") if p.strip()]


def split_sentences(text: str) -> list[str]:
    return [
        s.strip()
        for s in re.split(r'(?<=[.!?])\s+', text or "")
        if s.strip()
    ]


def find_sentence_index(sentences: list[str], target: str) -> int | None:
    target = normalize_text(target)

    for i, sentence in enumerate(sentences):
        normalized_sentence = normalize_text(sentence)

        if normalized_sentence == target:
            return i

        if target in normalized_sentence:
            return i

        if normalized_sentence in target:
            return i

    return None


def find_paragraph_index(paragraphs: list[str], sentence: str) -> int | None:
    sentence = normalize_text(sentence)

    for i, paragraph in enumerate(paragraphs):
        if sentence in normalize_text(paragraph):
            return i

    return None


def prepare_compare_context(user_essay: str, database_essay: str):
    user_paragraphs = split_paragraphs(user_essay)
    db_paragraphs = split_paragraphs(database_essay)

    user_sentences = split_sentences(user_essay)
    db_sentences = split_sentences(database_essay)

    return {
        "user_word_count": count_words(user_essay),
        "user_paragraphs": user_paragraphs,
        "db_paragraphs": db_paragraphs,
        "user_sentences": user_sentences,
        "db_sentences": db_sentences,
    }


def clean_suggestions(raw_suggestions):
    if not isinstance(raw_suggestions, list):
        return []

    return [
        suggestion.strip()
        for suggestion in raw_suggestions
        if isinstance(suggestion, str) and suggestion.strip()
    ][:MAX_SUGGESTIONS]


def clean_comparison(text: str) -> str:
    comparison = (text or "").strip()

    if len(comparison) > 400:
        comparison = comparison[:400] + "..."

    return comparison


def finalize_compare_result(raw_result: dict, essay_id: str, context: dict):
    comparisons = raw_result.get("comparisons", [])

    if not isinstance(comparisons, list):
        comparisons = []

    cleaned = []
    seen_pairs = set()

    max_comparisons = get_compare_limit(context["user_word_count"])

    for item in comparisons:
        if len(cleaned) >= max_comparisons:
            break

        if not isinstance(item, dict):
            continue

        user_sentence = item.get("user_sentence", "").strip()
        example_sentence = item.get("example_sentence", "").strip()

        if not user_sentence or not example_sentence:
            continue

        pair_key = (
            normalize_text(user_sentence),
            normalize_text(example_sentence),
        )

        if pair_key in seen_pairs:
            continue

        seen_pairs.add(pair_key)

        user_sentence_index = find_sentence_index(
            context["user_sentences"],
            user_sentence
        )

        example_paragraph_index = find_paragraph_index(
            context["db_paragraphs"],
            example_sentence
        )

        if user_sentence_index is None or example_paragraph_index is None:
            continue

        cleaned.append({
            "id": len(cleaned) + 1,
            "user_sentence": user_sentence,
            "user_sentence_index": user_sentence_index,
            "example_sentence": example_sentence,
            "example_paragraph": context["db_paragraphs"][example_paragraph_index],
            "example_paragraph_index": example_paragraph_index,
            "comparison": clean_comparison(item.get("comparison", "")),
            "suggestions": clean_suggestions(item.get("suggestions", [])),
        })

    return {
        "essay_id": essay_id,
        "too_short": False,
        "comparisons": cleaned,
    }


# Call the LLM model that we're using, and feed with our prompt
def call_llm(prompt):
    response = client.responses.create(
        model=MODEL,
        input=prompt
    )

    return response.output_text

>>>>>>> feature/Footer

def parse_response(text):
    try:
        return json.loads(text)
<<<<<<< HEAD
    except:
=======
    except Exception:
>>>>>>> feature/Footer
        return {
            "error": "failed to parse",
            "raw": text
        }

<<<<<<< HEAD
=======

>>>>>>> feature/Footer
def compare(user_essay: str, sample_essay: str):
    # 1. load prompt template
    template = load_prompt()

    # 2. build prompt
    prompt = build_prompt(template, user_essay, sample_essay)

    # 3. call LLM
    raw_output = call_llm(prompt)

    # 4. parse into dict
    result = parse_response(raw_output)

<<<<<<< HEAD
    return result

def main():
    print(compare(
        "Content: As the last whistle of the game blew, the Lynbrook girls’ basketball team secured their spot as third in the Santa Clara Valley Athletics League. As the team captain, I felt proud of ourselves and our journey. Like all other teams, it took us some time to grow and come together as one, but I am glad we did not give up on trying. In the end, with all our hard work, we finished third.   In the beginning, most drills did not go smoothly because most of us were unfamiliar with each other, and it was a challenge when we wanted to pass the ball. As the oldest team member, I told myself that I should do something to break the ice. Therefore, I talked to the coach and asked if we could let everyone come ten minutes earlier than usual for the next week of practice. Despite suspicions, I encouraged everyone to introduce themselves during drills to build a bond. From discussing our hobbies and backgrounds to tactical discussions regarding everyone’s areas for improvement while warming up together, I saw a drastic improvement in our morale, and I was able to lead the drills more smoothly. To work on our shortcomings, such as long-range passing, I would propose the team practice together as we practice passing while running across the court, allowing us to practice stamina and ensure that no one gets left behind.   A week after that, the coach told me that the team had nominated me as the team captain. Feeling honored, I accepted the offer because I would love to give everything I have to help this team grow. However, new problems arose as practice continued, as people started to forget about the strategies and plays we had planned for our games because there were too many of them. There was one game when one of the guards forgot to run to the corner, disrupting our pace, and we lost that possession. When we had a break between quarters, I pulled the teammate over and started drawing on the whiteboard with arrows indicating each person’s responsibilities to remind everyone where they should go. Realizing that drawing our play on the whiteboard might not be enough, I organized the team into small groups based on our positions on the court, so each group got three guards and two bigs to run plays and point mistakes.   Going into the league games season, we faced teams that were even more skilled and challenging to play against. Determined to cheer up my team to continue doing our best after losing three games in a row, I asked my coach and the team’s parents to host a team dinner. At the team dinner, I gave a pep talk about how giving up was too early, and we could still win the rest and achieve the goal we set at the start of the season - the top three in our league. Most of the team was encouraged and seemed more energetic in the practices afterward as we returned to a winning streak and regained our confidence. This taught me how to think positively to encourage my teammates and myself.   As a captain, I learned how to encourage my teammates, preparing me for the rest of high school and leadership experiences as I became more confident leading members while pursuing a shared goal. I believe this leadership engagement will become instrumental as I join the university’s basketball team, care for my teammates, and always be there when they need me.",
        "The butterfly book and I were inseparable. When I was three years old, my grandmother gave me an adult butterfly encyclopedia, and I read it nonstop for months. I didn’t just admire the pictures; I spewed scientific butterfly facts to anyone who would listen until I drove them crazy. I was so obsessed, for a three-year-old, that it was frankly kind of bizarre.\n\nShortly after I got the book, my family visited the New York City Museum of Natural History, and, as fate would have it, the butterfly exhibit was open. I was so ecstatic that I could barely stand it. When I walked into the lush green jungle, my eyes lit up like a Christmas tree; I pointed out different species and twirled around, taking it all in. One of the workers welcomed us and described the rules of the exhibit, but my eyes were fixated on a display case depicting metamorphosis. I pointed to the case and blurted out, “Chrysalis!” She looked at me in awe, utterly astounded that a toddler could identify a chrysalis. She asked me to follow her to see something special. “Put out your hand,” she whispered, and a gorgeous yellow swallowtail floated down and perched on my finger. People stopped to gather around me and observe with reverence and amazement. Most three-year-olds probably would’ve crushed the delicate insect, but I stood as still as a statue with my jaw hanging open. I watched its intricate wings flap back and forth like rustling leaves in a morning breeze. After fourteen years, that day is still imbedded in my memory. For me, it represents the first moment when my passion for learning allowed me to find deep meaning in the simplest creature.\n\nSeven years passed, and my Nonna — the same grandmother who gave me the butterfly book — died. I remember being distraught, crying in my room, when I suddenly caught a glimpse of a yellow swallowtail flitting past my window. From that moment on, Nonna has sent me yellow butterflies. Whenever I’m having a particularly awful day or find myself in unfamiliar territory, if I see a swallowtail I am instantly reassured. Just as the caterpillar is reborn as a butterfly, Nonna’s death was more like a metamorphosis than an end. I cannot point to a page in the encyclopedia where it explains how or why she sends them to me, but every time I see one, I know deep down that the creature is far more than a head, thorax, and abdomen. Butterflies are hope for something better after this life, evidence of my grandmother’s love, and a way to get me through the day when I need it most.\n\nDid you know that most butterflies only live for a few days, or that they taste with their feet? I firmly believe that the chrysalis-screaming-three-year-old who is fascinated by these facts, and the grieving grandson who finds assurance in butterflies without any concrete evidence, are both still alive inside me. It seems strange that these differing narratives converge to form what butterflies mean to me, but I don’t think of them as contradictory in the slightest. In fact, I’ve found it’s nearly impossible to live with one and not the other. If I search only for abstractions and what lies beyond comprehension, then I couldn’t marvel at the pattern of a yellow swallowtail’s wing or the complex mechanism that allows it to fly. Conversely, if I lead my life focusing only on what can be memorized and observed, none of these facts really amount to anything. What a mundane world it would be if the butterfly could not contain love and sorrow and countless other meanings within its wings. I strive to search for the balance between the tangible and unexplainable; the world is my butterfly — replete with significance on and below the surface that I tirelessly work to find."
    ))

if __name__ == "__main__":
    main()
=======
    return result
>>>>>>> feature/Footer
