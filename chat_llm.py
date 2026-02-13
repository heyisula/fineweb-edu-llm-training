import torch
from transformers import GPT2LMHeadModel, PreTrainedTokenizerFast

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

model_dir = "out/models/mini_llm_gpu_fixed"
tokenizer = PreTrainedTokenizerFast.from_pretrained(model_dir)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

model = GPT2LMHeadModel.from_pretrained(model_dir).to(device)
model.eval()

print("Mini GPT Chatbot ready! Type 'exit' to quit.")

while True:
    prompt = input("You: ")
    if prompt.lower() in ["exit", "quit"]:
        print("Exiting chatbot...")
        break

    # Encode input
    inputs = tokenizer(prompt, return_tensors="pt").to(device)

    # Generate response
    outputs = model.generate(
        **inputs,
        max_new_tokens=100,      # limit new tokens instead of total length
        temperature=0.7,         # slightly lower temperature for focus
        top_p=0.9,               # nucleus sampling
        repetition_penalty=1.2,  # discourage repeating tokens
        no_repeat_ngram_size=2,  # prevent repeating pairs of words
        do_sample=True,
        eos_token_id=tokenizer.eos_token_id,
        pad_token_id=tokenizer.pad_token_id
    )

    # Decode & print
    # Decode & print (skip the input prompt tokens)
    input_length = inputs.input_ids.shape[1]
    response = tokenizer.decode(outputs[0][input_length:], skip_special_tokens=True)
    print("Bot:", response.strip())
