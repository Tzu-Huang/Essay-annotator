"""
This is a testing .py file that ensure api key and basic cosine similarity calculation works as expected

"""
from openai import OpenAI
import os
from make_embedding import normalize


client = OpenAI(api_key = os.environ["OPENAI_API_KEY"])

response = client.embeddings.create(
    model="text-embedding-3-small",
    input= "Music"
    
)#.data[0].embedding # This is the only information we need 
doc = response.data[0].embedding

normalize(doc)
print(doc)

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



