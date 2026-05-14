import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

from backend.services.supabase_client import supabase

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def create_embedding(text):
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=768
        )
    )

    return result.embeddings[0].values


def main():
    rows = (
        supabase.table("ai_knowledge")
        .select("*")
        .is_("embedding", "null")
        .execute()
        .data
    )

    print(f"Found {len(rows)} rows without embeddings.")

    for row in rows:
        text = f"{row['title']}\n{row['content']}"
        embedding = create_embedding(text)

        supabase.table("ai_knowledge") \
            .update({"embedding": embedding}) \
            .eq("id", row["id"]) \
            .execute()

        print(f"Embedded: {row['title']}")


if __name__ == "__main__":
    main()