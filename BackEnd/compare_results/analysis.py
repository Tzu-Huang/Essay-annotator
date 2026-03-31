from openai import OpenAI
import os
import json

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
MODEL = "gpt-5.4-mini"

# Return the prompt text 
def load_prompt(path="compare_prompt.txt"):
    with open(path, "r") as f:
        return f.read()
    
# Upon the prompt template, replace the user_essay and database_essay in the prompt
def build_prompt(template, user_essay, database_essay):
    prompt = template.replace("{user_input}", user_essay)
    prompt = prompt.replace("{database_essay}", database_essay)
    return prompt

# Call the LLM model that we're using, and feed with our prompt
def call_llm(prompt):
    response = client.responses.create(
        model = MODEL,
        input = prompt
    )
    return response.output_text # Returns the generated text in one single string

def parse_response(text):
    try:
        return json.loads(text)
    except:
        return {
            "error": "failed to parse",
            "raw": text
        }

def compare(user_essay: str, sample_essay: str):
    # 1. load prompt template
    template = load_prompt()

    # 2. build prompt
    prompt = build_prompt(template, user_essay, sample_essay)

    # 3. call LLM
    raw_output = call_llm(prompt)

    # 4. parse into dict
    result = parse_response(raw_output)

    return result