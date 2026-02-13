import torch
from transformers import GPT2LMHeadModel, PreTrainedTokenizerFast

device = "cuda" if torch.cuda.is_available() else "cpu"
model_dir = "out/models/mini_llm_gpu_fixed"

tokenizer = PreTrainedTokenizerFast.from_pretrained(model_dir)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

model = GPT2LMHeadModel.from_pretrained(model_dir).to(device)
model.eval()

prompts = ["hi", "what is gyroscope", "tell me about science"]

print("--- Chatbot Verification ---")
for prompt in prompts:
    print(f"User: {prompt}")
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=100,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.2,
            no_repeat_ngram_size=2,
            do_sample=True,
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.pad_token_id
        )

    input_length = inputs.input_ids.shape[1]
    response = tokenizer.decode(outputs[0][input_length:], skip_special_tokens=True)
    print(f"Bot: {response.strip()}")
    print("-" * 30)
