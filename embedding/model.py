from openai import OpenAI
import os

client = OpenAI(api_key = os.environ["OPENAI_API_KEY"])


response = client.embeddings.create(
    model="text-embedding-3-small",
    input= "This is a very easy test"
    
)#.data[0].embedding # This is the only information we need 
doc = response.data[0].embedding

# Input 
query = "This test should be very easy"

q_vec = client.embeddings.create(
    model="text-embedding-3-small",
    input= query
    
)#.data[0].embedding # This is the only information we need 
test = q_vec.data[0].embedding

import numpy as np

def cosine(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

score = cosine(test, doc)
print(score)



